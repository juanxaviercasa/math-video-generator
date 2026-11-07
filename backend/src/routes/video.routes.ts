import express, { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { generationJobs } from '../services/job.service.js';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateMathProblem } from '../services/math-validation.service.js';
import { videoGenerationSchema } from '../schemas/video.schema.js';
import { getVideoFormatProfile } from '../services/video-format.service.js';
import { extractExerciseFromSource, ExerciseExtractionError } from '../services/exercise-extraction.service.js';
import { SPANISH_VOICES, resolveVoiceId } from '../services/voice-catalog.service.js';
import { tts } from '../services/tts.service.js';
import { validateAudibleAudio } from '../services/audio-qa.service.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const awaitRawExerciseUpload = express.raw({ type: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'], limit: '10mb' });
const router = Router();
router.use(optionalAuth);

router.get('/voices', (_req: Request, res: Response) => {
  return res.json({ voices: SPANISH_VOICES, defaultVoiceId: SPANISH_VOICES[0].id, voiceTechnology: 'edge-tts', generatedByAI: true });
});

router.post('/voices/preview', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
  const requestedVoice = req.body?.narratorVoiceId;
  const requestedStyle = req.body?.narrationStyle;
  if (typeof requestedVoice !== 'string' || (requestedStyle !== 'warm_teacher' && requestedStyle !== 'neutral_teacher')) {
    return res.status(400).json({ code: 'VOICE_PREVIEW_INVALID', error: 'Selecciona una voz y un estilo válidos.' });
  }
  let voiceId: string;
  try {
    voiceId = resolveVoiceId(requestedVoice);
  } catch {
    return res.status(400).json({ code: 'VOICE_NOT_SUPPORTED', error: 'La voz elegida no está disponible.' });
  }
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'mvg-voice-preview-'));
  try {
    // Preview the actual math reading, not a synthetic beep.
    const message = 'Hoy resolveremos una ecuación de segundo grado. Primero identificamos los coeficientes y después calculamos el discriminante.';
    const audioFile = await tts.generateNarrationAudio(message, scratch, 'voice-preview', { style: requestedStyle, voiceId });
    if (!audioFile) {
      return res.status(503).json({
        code: 'NEURAL_VOICE_UNAVAILABLE',
        error: 'La voz neural no se pudo generar. Instala edge-tts en el servidor y comprueba el acceso a Internet.',
      });
    }
    const qa = await validateAudibleAudio(audioFile);
    if (!qa.passed) {
      return res.status(502).json({ code: 'VOICE_PREVIEW_SILENT', error: 'La voz de prueba no contiene audio audible.' });
    }
    const data = await fs.readFile(audioFile);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(data.length));
    return res.end(data);
  } catch (error) {
    console.warn('[Voice preview] Error:', error instanceof Error ? error.message : error);
    return res.status(503).json({ code: 'VOICE_PREVIEW_FAILED', error: 'No fue posible producir una muestra neural audible.' });
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
});


// Binary upload; no source image or PDF is persisted with the video job.
// The extracted text must be confirmed in the editor before generation.
router.post('/extract-exercise', requireAuth,
  // The global JSON parser does not consume image/pdf bodies.
  (awaitRawExerciseUpload),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
    try {
      const mediaType = req.header('content-type') || '';
      const provider = req.query.provider;
      if (provider !== undefined && provider !== 'gemini' && provider !== 'openai' && provider !== 'openrouter') {
        return res.status(400).json({ code: 'VISION_PROVIDER_INVALID', error: 'Proveedor visual no reconocido.' });
      }
      const result = await extractExerciseFromSource(req.body as Buffer, mediaType, req.query.page, provider || 'auto');
      return res.json(result);
    } catch (error) {
      if (error instanceof ExerciseExtractionError) {
        return res.status(error.status).json({ code: error.code, error: error.message });
      }
      console.error('[Exercise extraction]', error);
      return res.status(500).json({ code: 'EXERCISE_EXTRACTION_FAILED', error: 'No se pudo procesar el ejercicio.' });
    }
  },
);


router.post('/generate-video', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  let createdVideoId: string | undefined;
  let requestIdempotencyKey: string | undefined;
  try {
    const parsed = videoGenerationSchema.safeParse(req.body);
    if (!parsed.success) {
      const fields = parsed.error.issues.reduce<Record<string, string[]>>((acc, issue) => {
        const field = issue.path[0]?.toString() || 'request';
        acc[field] = [...(acc[field] || []), issue.message];
        return acc;
      }, {});
      return res.status(400).json({ code: 'VALIDATION_ERROR', error: 'La solicitud contiene datos inválidos', fields });
    }

    if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
    const input = parsed.data;
    const idempotencyKey = input.idempotencyKey || req.header('Idempotency-Key') || randomUUID();
    requestIdempotencyKey = idempotencyKey;
    const existing = await generationJobs.findByIdempotencyKey(idempotencyKey, req.user.id);
    if (existing) return res.status(200).json(existing);

    const videoId = input.id || `video_${randomUUID().replace(/-/g, '')}`;
    createdVideoId = videoId;
    if (await generationJobs.get(videoId)) {
      return res.status(409).json({ code: 'VIDEO_ID_EXISTS', error: 'Ya existe un trabajo con ese identificador', id: videoId });
    }

    const initialStatus = await generationJobs.create(videoId, {
      userId: req.user.id,
      title: input.title,
      content: input.content,
      idempotencyKey,
      request: { ...input, id: videoId, idempotencyKey },
    });

    await generationJobs.enqueue(videoId);
    return res.status(202).json(initialStatus);
  } catch (error) {
    console.error('API Error:', error);
    if ((error as { code?: string })?.code === 'P2002' && req.user && requestIdempotencyKey) {
      const existing = await generationJobs.findByIdempotencyKey(requestIdempotencyKey, req.user.id);
      if (existing) return res.status(200).json(existing);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    const requestedId = createdVideoId || (typeof req.body?.id === 'string' ? req.body.id : undefined);
    if (requestedId) generationJobs.fail(requestedId, errorMessage, 'QUEUE_ENQUEUE_FAILED');
    return res.status(503).json({ code: 'QUEUE_UNAVAILABLE', error: 'El sistema de procesamiento no está disponible temporalmente' });
  }
});

router.post('/preview', (req: Request, res: Response) => {
  const parsed = videoGenerationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', error: 'La solicitud de previsualización no es válida', fields: parsed.error.flatten().fieldErrors });
  }
  const validation = validateMathProblem(parsed.data.content);
  const steps = parsed.data.steps?.length ? parsed.data.steps : validation.steps;
  return res.json({
    title: parsed.data.title,
    validation,
    steps: steps.length ? steps : [parsed.data.content],
    formatProfile: getVideoFormatProfile(parsed.data.aspectRatio, parsed.data.quality),
    requiresReview: !validation.supported || !validation.valid,
  });
});

router.get('/generate-video/status/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
    const { id } = req.params;
    if (!(await generationJobs.belongsTo(id, req.user.id))) {
      return res.status(404).json({ code: 'VIDEO_NOT_FOUND', error: 'Video no encontrado' });
    }
    const current = await generationJobs.get(id);
    if (!current) return res.status(404).json({ code: 'VIDEO_NOT_FOUND', error: 'Video no encontrado' });
    return res.json(current);
  } catch (error) {
    console.error('[Video status] Error:', error);
    return res.status(500).json({ code: 'VIDEO_STATUS_FAILED', error: 'No se pudo obtener el estado del video' });
  }
});

router.get('/videos', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
  try {
    const videos = await generationJobs.listForUser(req.user.id);
    return res.json({ videos });
  } catch (error) {
    console.error('[Videos] Could not list videos:', error);
    return res.status(500).json({ code: 'VIDEO_LIST_FAILED', error: 'No se pudo cargar la biblioteca' });
  }
});

router.get('/videos/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
  try {
    if (!(await generationJobs.belongsTo(req.params.id, req.user.id))) {
      return res.status(404).json({ code: 'VIDEO_NOT_FOUND', error: 'Video no encontrado' });
    }
    const job = await generationJobs.get(req.params.id);
    if (!job) return res.status(404).json({ code: 'VIDEO_NOT_FOUND', error: 'Video no encontrado' });
    return res.json({ video: job });
  } catch (error) {
    console.error('[Video detail] Error:', error);
    return res.status(500).json({ code: 'VIDEO_DETAIL_FAILED', error: 'No se pudo cargar el video' });
  }
});

export const videoRoutes = router;
