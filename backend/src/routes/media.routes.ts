import { Router, Response } from 'express';
import path from 'node:path';
import os from 'node:os';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
const mediaRoot = () => path.resolve(process.env.MEDIA_ROOT || path.join(os.tmpdir(), 'math-video-generator'));

router.get('/:id/:file', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
  const videoId = req.params.id;
  const fileName = path.basename(req.params.file);
  if (!videoId || !fileName || fileName !== req.params.file || !/^[a-zA-Z0-9._-]+$/.test(videoId)) {
    return res.status(400).json({ code: 'INVALID_MEDIA_PATH', error: 'Ruta de media inválida' });
  }

  const video = await prisma.video.findFirst({ where: { id: videoId, userId: req.user.id }, select: { id: true } });
  if (!video) return res.status(404).json({ code: 'MEDIA_NOT_FOUND', error: 'Artefacto no encontrado' });

  const root = path.join(mediaRoot(), `mvg-${videoId}`);
  return res.sendFile(fileName, { root, dotfiles: 'deny' }, (error) => {
    const statusCode = error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 404;
    if (error && !res.headersSent) res.status(statusCode).json({ code: 'MEDIA_NOT_FOUND', error: 'Artefacto no encontrado' });
  });
});

export const mediaRoutes = router;
