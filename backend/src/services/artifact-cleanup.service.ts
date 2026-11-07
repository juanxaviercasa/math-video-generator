import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { prisma } from '../lib/prisma.js';

const mediaRoot = () => path.resolve(process.env.MEDIA_ROOT || path.join(os.tmpdir(), 'math-video-generator'));

export async function cleanupFailedArtifacts(retentionMs = Number(process.env.FAILED_ARTIFACT_RETENTION_MS || 86_400_000)): Promise<number> {
  const cutoff = new Date(Date.now() - retentionMs);
  const failedVideos = await prisma.video.findMany({
    where: { status: 'failed', updatedAt: { lt: cutoff } },
    select: { id: true },
  });
  let removed = 0;
  for (const video of failedVideos) {
    const directory = path.join(mediaRoot(), `mvg-${video.id}`);
    try {
      await fs.rm(directory, { recursive: true, force: true });
      removed += 1;
    } catch (error) {
      console.warn(`[Artifacts] No se pudo limpiar ${video.id}:`, error);
    }
  }
  return removed;
}
