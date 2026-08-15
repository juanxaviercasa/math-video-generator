import { Router, Request, Response } from 'express';
import { videoProcessing } from '../services/video-processing.service.js';
import * as path from 'path';
import * as os from 'os';

const router = Router();
const generationJobs = new Map<string, any>();

/**
 * POST /api/generate-video
 * Generar un video matemático
 */
router.post('/generate-video', async (req: Request, res: Response) => {
  try {
    const { id, title, content, quality, enableNarration, aiProvider, enableComfyUI } = req.body;
    const videoId = id || `video_${Date.now()}`;

    // Validar input
    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields: title, content',
      });
    }

    const initialStatus = {
      id: videoId,
      status: 'pending',
      progress: 0,
      message: 'Video en cola...',
    };

    generationJobs.set(videoId, initialStatus);

    // Crear directorio temporal
    const outputDir = path.join(os.tmpdir(), `mvg-${videoId}`);
    console.log(`📂 Output directory: ${outputDir}`);

    // Procesar video
    const result = await videoProcessing.generateVideo({
      id: videoId,
      title,
      content,
      quality: quality || 'medium',
      userId: 'temp-user',
      outputDir,
      enableNarration: enableNarration !== false,
      aiProvider: aiProvider || 'openrouter',
      enableComfyUI: enableComfyUI === true,
    });

    const finalResult = { id: videoId, ...result };
    generationJobs.set(videoId, finalResult);

    // Retornar resultado
    res.json(finalResult);
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (req.body?.id) {
      generationJobs.set(req.body.id, {
        id: req.body.id,
        status: 'failed',
        progress: 100,
        message: 'Fallo en la generación',
        error: errorMessage,
      });
    }
    res.status(500).json({
      error: 'Video generation failed',
      details: errorMessage,
    });
  }
});

/**
 * GET /api/generate-video/status/:id
 * Verificar estado de generación
 */
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

export const videoRoutes = router;
