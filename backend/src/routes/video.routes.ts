import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { videoProcessing } from '../services/video-processing.service.js';
import { generationJobs } from '../services/job.service.js';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateMathProblem } from '../services/math-validation.service.js';
import { videoGenerationSchema } from '../schemas/video.schema.js';
import { getVideoFormatProfile } from '../services/video-format.service.js';

const router = Router();
router.use(optionalAuth);

router.post('/generate-video', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
    const existing = await generationJobs.findByIdempotencyKey(idempotencyKey, req.user.id);
    if (existing) return res.status(200).json(existing);

    const videoId = input.id || `video_${randomUUID().replace(/-/g, '')}`;
    if (await generationJobs.get(videoId)) {
      return res.status(409).json({ code: 'VIDEO_ID_EXISTS', error: 'Ya existe un trabajo con ese identificador', id: videoId });
    }

    const initialStatus = generationJobs.create(videoId, {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const requestedId = typeof req.body?.id === 'string' ? req.body.id : undefined;
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
