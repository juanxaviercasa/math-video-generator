import { manim } from './manim.service.js';
import { ffmpeg } from './ffmpeg.service.js';
import { openai } from './openai.service.js';
import { tts } from './tts.service.js';
import { resolveVoiceId } from './voice-catalog.service.js';
import { validateAudibleAudio } from './audio-qa.service.js';
import { validateMathProblem, type MathValidation } from './math-validation.service.js';
import { verifyQuadraticSymbolically } from './sympy-verification.service.js';
import { synchronization, type SynchronizedScene } from './synchronization.service.js';
import { buildLessonTimeline, validateLessonTimeline } from './timeline.service.js';
import type { LessonTimeline } from './timeline.types.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { renderRemotionDeck } from './remotion-renderer.service.js';
import { getVideoFormatProfile, type VideoAspectRatio, type VideoQuality } from './video-format.service.js';
import { validateRenderIntegrity } from './render-integrity.service.js';
import { readAndValidateGeometry } from './manim-geometry-qa.service.js';
import { auditFinalVideoFrames } from './final-frame-qa.service.js';
import { extractVoiceCues, buildCueTimingPlan, CUE_INTRO_SECONDS, CUE_OUTRO_SECONDS, CUE_LEAD_SECONDS } from './voice-cue.service.js';
import { readWordBoundaries, cueHighlightOffset, assertWordBoundariesMatchNarration, type SpokenWordBoundary } from './voice-boundary.service.js';
import { renderWithBoundedVisualRecovery, type VisualRecoveryAttempt } from './visual-render-recovery.service.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const mediaRoot = () => path.resolve(process.env.MEDIA_ROOT || path.join(os.tmpdir(), 'math-video-generator'));

const toMediaUrl = (filePath: string): string => {
  const absolutePath = path.resolve(filePath);
  const relativePath = path.relative(mediaRoot(), absolutePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('El archivo generado está fuera del directorio multimedia permitido');
  }
  const [jobDirectory, ...fileParts] = relativePath.split(path.sep);
  if (!jobDirectory || fileParts.length === 0) throw new Error('No se pudo determinar el artefacto generado');
  return `/api/media/${encodeURIComponent(jobDirectory.replace(/^mvg-/, ''))}/${fileParts.map((segment) => encodeURIComponent(segment)).join('/')}`;
};

/**
 * Video Processing Service
 * Orquesta Manim + FFmpeg + OpenAI para generar videos
 */

interface VideoGenerationRequest {
  id: string;
  title: string;
  content: string; // Problema matemático
  quality?: VideoQuality; // Calidad del video
  aspectRatio?: VideoAspectRatio;
  layoutDensity?: 'comfortable' | 'compact';
  narrationStyle?: 'warm_teacher' | 'neutral_teacher';
  userId: string;
  outputDir: string;
  enableNarration?: boolean;
  narratorVoiceId?: string;
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
      aspectRatio = '16:9',
      layoutDensity = 'comfortable',
      narrationStyle = 'warm_teacher',
      outputDir,
      enableNarration = true,
      narratorVoiceId,
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
    const selectedVoice = resolveVoiceId(narratorVoiceId);
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
      if (!validation.supported && process.env.ALLOW_UNVERIFIED_MATH_VIDEO !== 'true') {
        throw new Error('MATH_UNSUPPORTED: El problema requiere un solver determinista antes de publicarse. Usa preview/revisión manual o activa el flag solo en un entorno de QA.');
      }

      // Independent SymPy proof: only bounded, prevalidated numeric coefficients.
      // A symbolic disagreement always aborts publication; no LLM bypass.
      if (validation.supported && validation.valid && validation.kind === 'quadratic') {
        const symbolic = await verifyQuadraticSymbolically(validation);
        fs.writeFileSync(path.join(outputDir, `${id}-sympy-verification.json`), JSON.stringify(symbolic, null, 2), 'utf8');
        if (symbolic.warning) console.warn('⚠️ SymPy:', symbolic.warning);
      }

      // 2. Generar descripción con OpenAI (opcional)
      console.log('🤖 Generando descripción...');
      progress.progress = 20;
      progress.message = 'Generando descripción con IA...';
      report();

      // A verified solver is authoritative. Do not call an LLM to regenerate
      // already-validated mathematics or expose the workflow to an avoidable API failure.
      const steps = requestedSteps?.length
        ? requestedSteps
        : validation.supported && validation.valid
          ? [...validation.steps]
          : await openai.generateSolutionSteps(content);
      if (!steps.length) {
        steps.push(content);
      }

      const pedagogicalScenes = validation.supported && validation.kind === 'quadratic'
        ? buildQuadraticStoryboard(content, validation, narrationStyle)
        : [];
      const synchronizedScenes: SynchronizedScene[] = pedagogicalScenes.length
        ? pedagogicalScenes
        : synchronization.buildSynchronizedScenes(content, steps);
      let narrationAudioPath = '';
      let lessonTimeline: LessonTimeline | undefined;
      const spokenWordAudit: Array<{ sceneId: string; cueIndex: number; source: string; words: SpokenWordBoundary[]; highlightOffsetSeconds: number; sceneOffsetSeconds: number }> = [];
      if (enableNarration) {
        console.log(`🎙️ Generando narración con voz neural ${selectedVoice}; proveedor IA: ${aiProvider}`);
        const audioSegments: string[] = [];
        for (const scene of synchronizedScenes) {
          const pedagogical = pedagogicalScenes.find((item) => item.id === scene.id);
          const cues = pedagogical ? extractVoiceCues(pedagogical) : [];
          if (cues.length) {
            const clips: string[] = [];
            const actualDurations: number[] = [];
            const wordBoundaries: SpokenWordBoundary[][] = [];
            for (const [cueIndex, speech] of cues.entries()) {
              const clip = await tts.generateNarrationAudio(speech, outputDir, `${id}-${scene.id}-cue-${cueIndex + 1}`, { style: narrationStyle, voiceId: selectedVoice });
              if (!clip) throw new Error(`VOICE_CUE_MISSING: La voz neural falló en ${scene.id}, transformación ${cueIndex + 1}.`);
              const info = await ffmpeg.getVideoInfo(clip);
              const measured = Number(info.format?.duration);
              if (!Number.isFinite(measured) || measured <= 0) {
                throw new Error(`VOICE_CUE_INVALID: Duración de voz inválida en ${scene.id}, transformación ${cueIndex + 1}.`);
              }
              clips.push(clip);
              actualDurations.push(measured);
              const srtPath = clip.replace(/-narration\.(?:mp3|wav)$/i, '-narration.srt');
              const boundaries = readWordBoundaries(srtPath, measured);
              assertWordBoundariesMatchNarration(speech, boundaries);
              wordBoundaries.push(boundaries);
            }
            const timing = buildCueTimingPlan(actualDurations);
            const highlightOffsets = wordBoundaries.map((words, index) =>
              cueHighlightOffset(words, timing.stageDurations[index], CUE_LEAD_SECONDS));
            wordBoundaries.forEach((words, index) => spokenWordAudit.push({
              sceneId: scene.id, cueIndex: index, source: words.length ? 'edge-tts' : 'duration-fallback',
              words, highlightOffsetSeconds: highlightOffsets[index], sceneOffsetSeconds: timing.stageStarts[index],
            }));
            const parts: string[] = [
              await ffmpeg.createSilentAudio(path.join(outputDir, `${id}-${scene.id}-opening.wav`), CUE_INTRO_SECONDS),
            ];
            for (let index = 0; index < clips.length; index += 1) {
              parts.push(await ffmpeg.alignNarrationSegment(
                clips[index],
                path.join(outputDir, `${id}-${scene.id}-cue-${index + 1}-aligned.wav`),
                timing.stageDurations[index],
                CUE_LEAD_SECONDS,
              ));
            }
            parts.push(await ffmpeg.createSilentAudio(path.join(outputDir, `${id}-${scene.id}-closing.wav`), CUE_OUTRO_SECONDS));
            const segmentPath = await ffmpeg.concatenateAudio(parts, path.join(outputDir, `${id}-${scene.id}-narrated.wav`));
            const segmentInfo = await ffmpeg.getVideoInfo(segmentPath);
            const actualSceneDuration = Number(segmentInfo.format?.duration);
            if (!Number.isFinite(actualSceneDuration) || Math.abs(actualSceneDuration - timing.sceneDuration) > 0.06) {
              throw new Error(`VOICE_CUE_DRIFT: El audio y el storyboard difieren en ${scene.id}.`);
            }
            scene.duration = timing.sceneDuration;
            scene.narrationText = cues.join(' ');
            if (pedagogical) pedagogical.visualCueDurations = timing.stageDurations;
            if (pedagogical) pedagogical.visualCueHighlightOffsets = highlightOffsets;
            audioSegments.push(segmentPath);
            continue;
          }

          const segmentPath = await tts.generateNarrationAudio(
            scene.narrationText,
            outputDir,
            `${id}-${scene.id}`,
            { style: narrationStyle, voiceId: selectedVoice },
          );
          if (!segmentPath) {
            throw new Error(`AUDIO_SEGMENT_MISSING: No se generó la narración de la escena ${scene.id}. Se cancela el video para evitar desincronización.`);
          }
          const audioInfo = await ffmpeg.getVideoInfo(segmentPath);
          const audioDuration = Number(audioInfo.format?.duration);
          if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
            throw new Error(`AUDIO_SEGMENT_INVALID: Duración de narración inválida en ${scene.id}.`);
          }
          const visualDuration = Math.max(scene.kind === 'graph' ? 6 : 4, audioDuration + 0.15);
          const alignedSegment = await ffmpeg.alignNarrationSegment(
            segmentPath,
            path.join(outputDir, `${id}-${scene.id}-aligned.wav`),
            visualDuration,
          );
          audioSegments.push(alignedSegment);
          scene.duration = visualDuration;
        }

        const timelineScenes = pedagogicalScenes.length ? pedagogicalScenes : synchronizedScenes;
        lessonTimeline = buildLessonTimeline({
          problem: content,
          scenes: timelineScenes,
          narrationStyle,
          lessonMode: 'tutorial',
          pedagogicalContract: pedagogicalScenes[0]?.pedagogicalContract,
        });
        lessonTimeline.segments.forEach((segment, index) => {
          segment.audioPath = audioSegments[index];
        });
        // Bind actual neural speech clips to their on-screen transformation,
        // rather than distributing events across an estimated text duration.
        for (const pedagogical of pedagogicalScenes) {
          const cueDurations = pedagogical.visualCueDurations;
          const cueHighlights = pedagogical.visualCueHighlightOffsets;
          if (!cueDurations?.length || !cueHighlights?.length) continue;
          const events = lessonTimeline.events.filter((event) => event.segmentId === `segment-${pedagogical.id}`);
          if (events.length !== cueDurations.length) throw new Error(`VOICE_CUE_EVENT_MISMATCH: ${pedagogical.id}`);
          let offset = CUE_INTRO_SECONDS;
          for (const [index, event] of events.entries()) {
            event.startOffset = Number((offset + cueHighlights[index]).toFixed(3));
            event.duration = 0.40;
            event.holdAfter = Number((cueDurations[index] - cueHighlights[index] - 0.40).toFixed(3));
            offset += cueDurations[index];
          }
        }
        const timelineReport = validateLessonTimeline(lessonTimeline);
        if (!timelineReport.passed) {
          throw new Error(`La línea de tiempo pedagógica es inválida: ${timelineReport.issues.map((issue) => issue.message).join(' | ')}`);
        }

        const neuralProvider = (process.env.TTS_PROVIDER || 'edge').toLowerCase() === 'edge';
        if (neuralProvider && audioSegments.length !== synchronizedScenes.length) {
          throw new Error(`La voz neural no está disponible para todas las escenas (${audioSegments.length}/${synchronizedScenes.length}). Se cancela el render para no entregar un video silencioso o con una voz distinta.`);
        }
        if (!audioSegments.length) {
          throw new Error('La narración fue solicitada, pero no se generó ningún segmento de audio válido.');
        }
        narrationAudioPath = await ffmpeg.concatenateAudio(
          audioSegments,
          path.join(outputDir, `${id}-narration.wav`)
        );
        fs.writeFileSync(
          path.join(outputDir, `${id}-voice-word-boundaries.json`),
          JSON.stringify({ version: 1, source: 'edge-tts SRT WordBoundary where available', cues: spokenWordAudit }, null, 2),
          'utf8',
        );
        console.log(`✓ Audio sincronizado generado: ${narrationAudioPath}`);
      } else {
        console.log('🔇 Narración deshabilitada por el usuario');
      }

      // 3. Renderizar con Manim
      console.log('📝 Generando animaciones...');
      progress.progress = 30;
      progress.message = 'Renderizando animaciones matemáticas...';
      report();

      const formatProfile = getVideoFormatProfile(aspectRatio, quality);
      const manimScene = {
        title,
        content,
        steps: steps.slice(0, 5), // Máx 5 pasos por video
        synchronizedScenes,
        pedagogicalScenes,
        outputDir,
        formatProfile,
        layoutDensity,
        narrationStyle,
        lessonTimeline,
        // Voice-locked stages use the stable audited renderer, which consumes
        // the exact cue durations. The experimental timeline renderer cannot
        // independently certify those same timestamps.
        narrationTimeline: process.env.NARRATION_TIMELINE === 'true' && !pedagogicalScenes.some((scene) => scene.visualCueDurations?.length),
        geometryReportPath: path.join(outputDir, `${id}-manim-geometry.json`),
        formulaFirst: false,
      };

      const recoveryAudit: VisualRecoveryAttempt[] = [];
      let manimVideoPath: string;
      try {
        manimVideoPath = await renderWithBoundedVisualRecovery(async (pass) => {
          manimScene.formulaFirst = pass === 'formula-first';
          // Never accept stale geometry after an unsuccessful previous pass.
          if (fs.existsSync(manimScene.geometryReportPath)) fs.unlinkSync(manimScene.geometryReportPath);
          const rendered = await manim.renderVideo(manimScene);
          if (pedagogicalScenes.length) {
            const geometry = readAndValidateGeometry(manimScene.geometryReportPath, {
              width: formatProfile.width,
              height: formatProfile.height,
              sceneIds: pedagogicalScenes.map((pedagogical) => pedagogical.id),
              requirePersistentProblem: pedagogicalScenes.some((pedagogical) => pedagogical.id === 'hook' && Boolean(pedagogical.visualLatex?.[0])),
              expectedDurations: Object.fromEntries(pedagogicalScenes.map((pedagogical) => [
                pedagogical.id, Math.max(4, pedagogical.duration ?? pedagogical.estimatedDuration),
              ])),
              tolerancePixels: 2,
            });
            fs.writeFileSync(path.join(outputDir, `${id}-geometry-qa.json`), JSON.stringify(geometry, null, 2), 'utf8');
            for (const warning of geometry.warnings) console.warn('⚠️  Geometría:', warning);
            if (!geometry.passed) throw new Error(`VISUAL_QA_FAILED: ${geometry.errors.join(' | ')}`);
          }
          return rendered;
        }, recoveryAudit);
      } finally {
        fs.writeFileSync(
          path.join(outputDir, `${id}-visual-recovery.json`),
          JSON.stringify({ version: 1, attempts: recoveryAudit, passed: recoveryAudit.some((item) => item.status === 'passed') }, null, 2),
          'utf8',
        );
      }

      const remotionEnabled = process.env.REMOTION_ENABLED === 'true';
      // Manim's measured text geometry cannot certify Remotion's independent
      // HTML/CSS compositor. Keep the experimental output out of production.
      if (remotionEnabled && process.env.REMOTION_ALLOW_UNVERIFIED_LAYOUT !== 'true') {
        throw new Error('REMOTION_VISUAL_QA_REQUIRED: La salida Remotion necesita un validador de geometría propio antes de publicarse.');
      }
      const remotionTimeline = lessonTimeline;
      if (remotionEnabled && !remotionTimeline) {
        throw new Error('REMOTION_ENABLED=true requiere enableNarration=true para conservar un único timeline audiovisual.');
      }
      let videoPath = manimVideoPath;
      if (remotionEnabled) {
        if (!remotionTimeline) throw new Error('No existe LessonTimeline para el renderer Remotion.');
        videoPath = await renderRemotionDeck({ id, timeline: remotionTimeline, format: aspectRatio, outputDir });
      }
      progress.progress = 70;
      progress.message = 'Animación renderizada; preparando video final...';
      report();

      // 4. Procesar con FFmpeg
      console.log('🎬 Procesando video...');
      progress.progress = 75;
      progress.message = 'Optimizando video...';
      report();

      const exportProfile = getVideoFormatProfile(aspectRatio, quality);
      const bitrate =
        quality === 'high' ? '10000k' : quality === 'medium' ? '5000k' : '2500k';

      const outputVideoPath = path.join(outputDir, `${id}-final.mp4`);

      let processedPath = await ffmpeg.processVideo({
        inputPath: videoPath,
        outputPath: outputVideoPath,
        width: exportProfile.width,
        height: exportProfile.height,
        bitrate,
        fps: 30,
      });

      if (!fs.existsSync(processedPath)) {
        throw new Error('FFmpeg no produjo el archivo de video final');
      }

      if (narrationAudioPath && !remotionEnabled) {
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
      await ffmpeg.extractThumbnail(
        processedPath,
        thumbnailPath,
        '00:00:08',
        exportProfile.width,
        exportProfile.height,
      );

      progress.progress = 95;
      progress.message = 'Validando artefactos finales...';
      report();

      // 6. Validar el MP4 final con metadatos decodificados, no solo su existencia.
      const videoInfo = await ffmpeg.getVideoInfo(processedPath);
      const expectedVideo = getVideoFormatProfile(aspectRatio, quality);
      const plannedDurationSeconds = lessonTimeline?.segments.reduce((total, segment) => total + segment.durationSeconds, 0);
      const integrity = validateRenderIntegrity(videoInfo, {
        width: expectedVideo.width,
        height: expectedVideo.height,
        fps: 30,
        narrationRequired: enableNarration,
        plannedDurationSeconds,
      });
      fs.writeFileSync(path.join(outputDir, `${id}-render-integrity.json`), JSON.stringify(integrity, null, 2), 'utf8');
      if (integrity.warnings.length) {
        console.warn('⚠️  Advertencias de sincronización:', integrity.warnings.join(' | '));
      }
      if (!integrity.passed || !fs.existsSync(processedPath) || !fs.existsSync(thumbnailPath)) {
        throw new Error(`Los artefactos finales no superaron la validación audiovisual: ${integrity.errors.join(' | ') || 'archivos faltantes'}`);
      }
      // Sample each measured pedagogical scene in the encoded MP4, not only
      // uniform timestamps which may skip short scenes.
      if (enableNarration) {
        const audibility = await validateAudibleAudio(processedPath);
        fs.writeFileSync(path.join(outputDir, `${id}-audio-qa.json`), JSON.stringify(audibility, null, 2));
        if (!audibility.passed) {
          throw new Error(`NARRATION_INAUDIBLE: El MP4 no contiene voz suficientemente audible (${audibility.reason}; pico ${audibility.maxDb} dBFS).`);
        }
      }

      const measuredStages = !remotionEnabled && pedagogicalScenes.length
        ? (JSON.parse(fs.readFileSync(manimScene.geometryReportPath, 'utf8')) as {
          stages: Array<{ id: string; start: number; end: number }>;
        }).stages
        : [];
      const frameQa = await auditFinalVideoFrames(
        processedPath, outputDir, integrity.actual.videoDuration ?? 0, 8, measuredStages,
      );
      fs.writeFileSync(path.join(outputDir, `${id}-frame-qa.json`), JSON.stringify(frameQa, null, 2), 'utf8');
      for (const warning of frameQa.warnings) console.warn('⚠️  Fotogramas:', warning);
      if (!frameQa.passed) {
        throw new Error(`FINAL_FRAME_QA_FAILED: ${frameQa.errors.join(' | ')}`);
      }
      const duration = Math.round(integrity.actual.videoDuration ?? 0);

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
