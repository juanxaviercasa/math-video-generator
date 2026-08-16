import { manim } from './manim.service.js';
import { ffmpeg } from './ffmpeg.service.js';
import { openai } from './openai.service.js';
import { tts } from './tts.service.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * Video Processing Service
 * Orquesta Manim + FFmpeg + OpenAI para generar videos
 */

interface VideoGenerationRequest {
  id: string;
  title: string;
  content: string; // Problema matemático
  quality?: 'low' | 'medium' | 'high'; // Calidad del video
  userId: string;
  outputDir: string;
  enableNarration?: boolean;
  aiProvider?: 'openrouter' | 'gemini' | 'openai';
    enableComfyUI?: boolean;
  allowSimulation?: boolean;
}

interface VideoGenerationProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  duration?: number;
}

export const videoProcessing = {
  /**
   * Procesar video completo
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationProgress> {
    const {
      id,
      title,
      content,
      quality = 'medium',
      outputDir,
      enableNarration = true,
      aiProvider = 'openrouter',
      enableComfyUI = false,
      allowSimulation = process.env.ALLOW_SIMULATION === 'true',
    } = request;
    let progress: VideoGenerationProgress = {
      status: 'processing',
      progress: 0,
      message: 'Iniciando procesamiento...',
    };

    try {
      // 1. Verificar dependencias
      console.log('🔍 Verificando dependencias...');
      progress.progress = 10;
      progress.message = 'Verificando Manim y FFmpeg...';

      const manimReady = await manim.isInstalled();
      const ffmpegReady = await ffmpeg.isInstalled();

      const missingDependencies = [
        !manimReady ? 'Manim' : null,
        !ffmpegReady ? 'FFmpeg' : null,
      ].filter(Boolean);

      if (missingDependencies.length > 0) {
        const message = `Faltan dependencias de render: ${missingDependencies.join(', ')}. Instálalas antes de generar un video real.`;
        if (!allowSimulation) {
          throw new Error(message);
        }

        console.warn(`⚠️ ${message} Ejecutando modo demo porque ALLOW_SIMULATION=true.`);
        progress.status = 'completed';
        progress.progress = 100;
        progress.message = 'Modo demo completado; no se creó un video real.';
        return progress;
      }

      if (enableComfyUI) {
        throw new Error('La integración con ComfyUI todavía no está implementada. Desactiva esta opción.');
      }

      // 2. Generar descripción con OpenAI (opcional)
      console.log('🤖 Generando descripción...');
      progress.progress = 20;
      progress.message = 'Generando descripción con IA...';

      const steps = await openai.generateSolutionSteps(content);
      if (!steps.length) {
        steps.push(content);
      }

      let narrationAudioPath = '';
      if (enableNarration) {
        console.log(`🎙️ Generando narración con ${aiProvider}...`);
        const narrationScript = await openai.generateNarrationScript(content, steps);
        narrationAudioPath = await tts.generateNarrationAudio(
          narrationScript.join(' '),
          outputDir,
          id
        );
        if (narrationAudioPath) {
          console.log(`✓ Audio de narración generado: ${narrationAudioPath}`);
        } else {
          console.log('⚠️ No se pudo generar audio; continuando sin narración');
        }
      } else {
        console.log('🔇 Narración deshabilitada por el usuario');
      }

      // 3. Renderizar con Manim
      console.log('📝 Generando animaciones...');
      progress.progress = 30;
      progress.message = 'Renderizando animaciones matemáticas...';

      const manimScene = {
        title,
        steps: steps.slice(0, 5), // Máx 5 pasos por video
        outputDir,
      };

      const videoPath = await manim.renderVideo(manimScene);
      progress.progress = 70;

      // 4. Procesar con FFmpeg
      console.log('🎬 Procesando video...');
      progress.progress = 75;
      progress.message = 'Optimizando video...';

      const resolution =
        quality === 'high' ? '4k' : quality === 'medium' ? '1080' : '480';
      const bitrate =
        quality === 'high' ? '10000k' : quality === 'medium' ? '5000k' : '2500k';

      const outputVideoPath = path.join(outputDir, `${id}-final.mp4`);

      let processedPath = await ffmpeg.processVideo({
        inputPath: videoPath,
        outputPath: outputVideoPath,
        resolution,
        bitrate,
        fps: 30,
      });

      if (!fs.existsSync(processedPath)) {
        throw new Error('FFmpeg no produjo el archivo de video final');
      }

      if (narrationAudioPath) {
        const narratedVideoPath = path.join(outputDir, `${id}-narrated.mp4`);
        processedPath = await ffmpeg.mergeAudioWithVideo({
          videoPath: processedPath,
          audioPath: narrationAudioPath,
          outputPath: narratedVideoPath,
        });
      }

      progress.progress = 85;

      // 5. Generar thumbnail
      console.log('🖼️  Generando thumbnail...');
      progress.progress = 90;
      progress.message = 'Generando miniatura...';

      const thumbnailPath = path.join(outputDir, `${id}-thumbnail.jpg`);
      await ffmpeg.extractThumbnail(processedPath, thumbnailPath);

      progress.progress = 95;

      // 6. Obtener información del video
      const videoInfo = await ffmpeg.getVideoInfo(processedPath);
            const duration = Math.round(parseFloat(videoInfo.format?.duration));
      if (!Number.isFinite(duration) || duration <= 0 || !fs.existsSync(processedPath) || !fs.existsSync(thumbnailPath)) {
        throw new Error('Los artefactos generados no superaron la validación final');
      }

      progress.duration = duration;
      progress.status = 'completed';
      progress.progress = 100;
      progress.message = 'Video completado';
      progress.videoUrl = processedPath;
      progress.thumbnailUrl = thumbnailPath;

      console.log(`✅ Video generado exitosamente: ${processedPath}`);

      return progress;
    } catch (error) {
      console.error('❌ Error en generación de video:', error);

      progress.status = 'failed';
      progress.message = 'Error en procesamiento';
      progress.error = error instanceof Error ? error.message : String(error);

      return progress;
    }
  },

  /**
   * Monitorear progreso de generación (para futuros WebSockets)
   */
  createProgressTracker(onProgress: (progress: VideoGenerationProgress) => void) {
    return {
      update: (progress: VideoGenerationProgress) => {
        onProgress(progress);
      },
    };
  },
};
