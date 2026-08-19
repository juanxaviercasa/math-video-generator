import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';
import { videoProcessing } from './services/video-processing.service.js';
import { generationJobs, videoQueue } from './services/job.service.js';

const workerId = `${os.hostname()}-${process.pid}`;
const concurrency = Math.max(1, Number(process.env.VIDEO_WORKER_CONCURRENCY || 1));

const run = async () => {
  const recovered = await generationJobs.recoverStaleJobs();
  if (recovered > 0) console.log(`[Worker ${workerId}] Reencolados ${recovered} jobs detenidos.`);

  const queue = videoQueue.instance;
  queue.process(concurrency, async (job) => {
    const videoId = job.data.videoId;
    const stored = await generationJobs.getRequest(videoId);
    if (!stored) throw new Error(`No existe una solicitud persistida para el job ${videoId}`);

    await generationJobs.markProcessing(videoId, workerId);
    const outputDir = path.join(process.env.MEDIA_ROOT || path.join(os.tmpdir(), 'math-video-generator'), `mvg-${videoId}`);
    const request = stored.request;

    const result = await videoProcessing.generateVideo({
      ...request,
      id: videoId,
      userId: stored.userId,
      outputDir,
      onProgress: (progress) => {
        generationJobs.update(videoId, {
          status: progress.status,
          progress: progress.progress,
          message: progress.message,
          videoUrl: progress.videoUrl,
          thumbnailUrl: progress.thumbnailUrl,
          duration: progress.duration,
          error: progress.error,
          heartbeatAt: new Date().toISOString(),
        });
      },
    });

    if (result.status === 'failed') {
      generationJobs.fail(videoId, result.error || result.message);
      throw new Error(result.error || result.message);
    }

    generationJobs.update(videoId, {
      status: 'completed',
      progress: 100,
      message: result.message,
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      heartbeatAt: new Date().toISOString(),
    });

    return result;
  });

  queue.on('failed', (job, error) => {
    if (job) generationJobs.fail(job.data.videoId, error.message);
    console.error(`[Worker ${workerId}] Job falló:`, error.message);
  });

  queue.on('error', (error) => console.error(`[Worker ${workerId}] Redis error:`, error));
  console.log(`[Worker ${workerId}] Cola ${videoQueue.name} activa con concurrencia ${concurrency}.`);

  const shutdown = async (signal: string) => {
    console.log(`[Worker ${workerId}] Received ${signal}; closing queue.`);
    try {
      await queue.close();
      process.exit(0);
    } catch (error) {
      console.error(`[Worker ${workerId}] Shutdown failed:`, error);
      process.exit(1);
    }
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
};

run().catch((error) => {
  console.error(`[Worker ${workerId}] No se pudo iniciar:`, error);
  process.exitCode = 1;
});
