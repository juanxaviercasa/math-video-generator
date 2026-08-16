import { Router, Request, Response } from 'express';
import { videoProcessing } from '../services/video-processing.service.js';
import { generationJobs } from '../services/job.service.js';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateMathProblem } from '../services/math-validation.service.js';
import { videoGenerationSchema } from '../schemas/video.schema.js';
import * as path from 'path';
import * as os from 'os';

const router = Router();
router.use(optionalAuth);

/**
 * POST /api/generate-video
 * Generar un video matemático
 */
router.post('/generate-video', async (req: Request, res: Response) => {
  try {
    const parsed = videoGenerationSchema.safeParse(req.body);

    if (!parsed.success) {
      const fields = parsed.error.issues.reduce<Record<string, string[]>>((acc, issue) => {
        const field = issue.path[0]?.toString() || 'request';
        acc[field] = [...(acc[field] || []), issue.message];
        return acc;
      }, {});

      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        error: 'La solicitud contiene datos inválidos',
        fields,
      });
    }

    const { id, title, content, quality, enableNarration, aiProvider, enableComfyUI } = parsed.data;
    const videoId = id || `video_${Date.now()}`;

    if (generationJobs.has(videoId)) {
      return res.status(409).json({
        code: 'VIDEO_ID_EXISTS',
        error: 'Ya existe un trabajo con ese identificador',
        id: videoId,
      });
    }

    const authenticatedUserId = (req as AuthenticatedRequest).user?.id;
    const initialStatus = generationJobs.create(videoId, {
      userId: authenticatedUserId,
      title,
      content,
    });

    // Crear directorio temporal para este trabajo.
    const outputDir = path.join(os.tmpdir(), `mvg-${videoId}`);
    console.log(`📂 Output directory: ${outputDir}`);

    generationJobs.enqueue(videoId, (onProgress) =>
      videoProcessing.generateVideo({
        id: videoId,
        title,
        content,
        quality,
        userId: authenticatedUserId || 'temp-user',
        outputDir,
        enableNarration,
        aiProvider,
        enableComfyUI,
        steps: parsed.data.steps,
        onProgress,
      })
    );

    return res.status(202).json(initialStatus);
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const requestedId = typeof req.body?.id === 'string' ? req.body.id : undefined;
    if (requestedId) {
      generationJobs.fail(requestedId, errorMessage);
    }
    res.status(500).json({
      code: 'GENERATION_FAILED',
      error: 'La generación del video falló',
      details: process.env.NODE_ENV === 'production' ? undefined : errorMessage,
    });
  }
});

/**
 * GET /api/generate-video/status/:id
 * Verificar estado de generación
 */
router.post('/preview', (req: Request, res: Response) => {
  const parsed = videoGenerationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: 'La solicitud de previsualización no es válida',
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const validation = validateMathProblem(parsed.data.content);
  const steps = parsed.data.steps?.length ? parsed.data.steps : validation.steps;
  return res.json({
    title: parsed.data.title,
    validation,
    steps: steps.length ? steps : [parsed.data.content],
    requiresReview: !validation.supported || !validation.valid,
  });
});

router.get('/generate-video/status/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const current = generationJobs.get(id);

    if (!current) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(current);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

router.get('/videos', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const videos = await generationJobs.listForUser(req.user!.id);
    return res.json({ videos });
  } catch (error) {
    console.error('[Videos] Could not list videos:', error);
    return res.status(500).json({ code: 'VIDEO_LIST_FAILED', error: 'No se pudo cargar la biblioteca' });
  }
});

router.get('/videos/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const job = generationJobs.get(req.params.id);
  if (!job || !generationJobs.belongsTo(req.params.id, req.user!.id)) {
    return res.status(404).json({ code: 'VIDEO_NOT_FOUND', error: 'Video no encontrado' });
  }
  return res.json({ video: job });
});

export const videoRoutes = router;
