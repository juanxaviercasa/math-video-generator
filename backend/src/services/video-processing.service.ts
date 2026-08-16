import { manim } from './manim.service.js';
import { ffmpeg } from './ffmpeg.service.js';
import { openai } from './openai.service.js';
import { tts } from './tts.service.js';
import { validateMathProblem, type MathValidation } from './math-validation.service.js';
import { synchronization, type SynchronizedScene } from './synchronization.service.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const toMediaUrl = (filePath: string): string => {
  const relativePath = path.relative(os.tmpdir(), filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('El archivo generado está fuera del directorio multimedia permitido');
  }
  return `/media/${relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
};

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
  onProgress?: (progress: VideoGenerationProgress) => void;
  steps?: string[];
}

interface VideoGenerationProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  duration?: number;
  validation?: MathValidation;
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
      steps: requestedSteps,
    } = request;
    let progress: VideoGenerationProgress = {
      status: 'processing',
      progress: 0,
      message: 'Iniciando procesamiento...',
    };
    const report = () => request.onProgress?.({ ...progress });
    report();

    try {
      // 1. Verificar dependencias
      console.log('🔍 Verificando dependencias...');
      progress.progress = 10;
      progress.message = 'Verificando Manim y FFmpeg...';
      report();

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
        report();
        return progress;
      }

      if (enableComfyUI) {
        throw new Error('La integración con ComfyUI todavía no está implementada. Desactiva esta opción.');
      }

      const validation = validateMathProblem(content);
      progress.validation = validation;
      report();

      if (validation.supported && !validation.valid) {
        throw new Error(validation.warnings[0] || 'El problema matemático no superó la validación');
      }

      // 2. Generar descripción con OpenAI (opcional)
      console.log('🤖 Generando descripción...');
      progress.progress = 20;
      progress.message = 'Generando descripción con IA...';
      report();

      const generatedSteps = requestedSteps?.length
        ? requestedSteps
        : await openai.generateSolutionSteps(content);
      const steps = requestedSteps?.length
        ? requestedSteps
        : validation.supported && validation.valid
          ? validation.steps
          : generatedSteps;
      if (!steps.length) {
        steps.push(content);
      }

      const synchronizedScenes: SynchronizedScene[] = synchronization.buildSynchronizedScenes(content, steps);
      let narrationAudioPath = '';
      if (enableNarration) {
        console.log(`🎙️ Generando narración sincronizada con ${aiProvider}...`);
        const audioSegments: string[] = [];
        for (const scene of synchronizedScenes) {
          const segmentPath = await tts.generateNarrationAudio(scene.narrationText, outputDir, `${id}-${scene.id}`);
          if (!segmentPath) continue;
          audioSegments.push(segmentPath);
          const audioInfo = await ffmpeg.getVideoInfo(segmentPath);
          const audioDuration = Number(audioInfo.format?.duration);
          if (Number.isFinite(audioDuration) && audioDuration > 0) {
            scene.duration = Math.max(2, audioDuration);
          }
        }

        if (audioSegments.length) {
          narrationAudioPath = await ffmpeg.concatenateAudio(
            audioSegments,
            path.join(outputDir, `${id}-narration.wav`)
          );
          console.log(`✓ Audio sincronizado generado: ${narrationAudioPath}`);
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
      report();

      const manimScene = {
        title,
        content,
        steps: steps.slice(0, 5), // Máx 5 pasos por video
        synchronizedScenes,
        outputDir,
      };

      const videoPath = await manim.renderVideo(manimScene);
      progress.progress = 70;
      progress.message = 'Animación renderizada; preparando video final...';
      report();

      // 4. Procesar con FFmpeg
      console.log('🎬 Procesando video...');
      progress.progress = 75;
      progress.message = 'Optimizando video...';
      report();

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
      progress.message = 'Video optimizado; generando miniatura...';
      report();

      // 5. Generar thumbnail
      console.log('🖼️  Generando thumbnail...');
      progress.progress = 90;
      progress.message = 'Generando miniatura...';
      report();

      const thumbnailPath = path.join(outputDir, `${id}-thumbnail.jpg`);
      await ffmpeg.extractThumbnail(processedPath, thumbnailPath);

      progress.progress = 95;
      progress.message = 'Validando artefactos finales...';
      report();

      // 6. Obtener información del video
      const videoInfo = await ffmpeg.getVideoInfo(processedPath);
            const duration = Math.round(parseFloat(videoInfo.format?.duration));
      if (!Number.isFinite(duration) || duration <= 0 || !fs.existsSync(processedPath) || !fs.existsSync(thumbnailPath)) {
        throw new Error('Los artefactos generados no superaron la validación final');
      }

      progress.duration = duration;
      progress.videoUrl = toMediaUrl(processedPath);
      progress.thumbnailUrl = toMediaUrl(thumbnailPath);
      progress.status = 'completed';
      progress.progress = 100;
      progress.message = 'Video completado';
      report();

      console.log(`✅ Video generado exitosamente: ${processedPath}`);

      return progress;
    } catch (error) {
      console.error('❌ Error en generación de video:', error);

      progress.status = 'failed';
      progress.message = 'Error en procesamiento';
      progress.error = error instanceof Error ? error.message : String(error);
      report();

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
