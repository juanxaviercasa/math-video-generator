import { manim } from './manim.service.js';
import { ffmpeg } from './ffmpeg.service.js';
import { openai } from './openai.service.js';
import { tts } from './tts.service.js';
import * as path from 'path';
import * as os from 'os';

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
}

interface VideoGenerationProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export const videoProcessing = {
  /**
   * Procesar video completo
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationProgress> {
    const { id, title, content, quality = 'medium', outputDir, enableNarration = true, aiProvider = 'openrouter', enableComfyUI = false } = request;
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

      if (!manimReady || !ffmpegReady) {
        console.warn('⚠️ Dependencias no disponibles. Ejecutando modo simulado para mantener la app usable.');
        progress.status = 'completed';
        progress.progress = 100;
        progress.message = 'Generación simulada completada. Instala FFmpeg y Manim para render real del video.';
        progress.videoUrl = undefined;
        progress.thumbnailUrl = undefined;
        return progress;
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

      if (enableComfyUI) {
        console.log('🎨 ComfyUI habilitado (para futuras mejoras visuales)');
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
        quality === 'high' ? '4k' : quality === 'medium' ? '1080' : '720';
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
      const duration = Math.round(parseFloat(videoInfo.format.duration));

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
