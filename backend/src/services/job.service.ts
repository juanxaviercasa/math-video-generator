import Bull from 'bull';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';

export type JobState = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationRequestSnapshot {
  id: string;
  title: string;
  content: string;
  quality?: 'low' | 'medium' | 'high';
  aspectRatio?: '16:9' | '1:1' | '9:16';
  layoutDensity?: 'comfortable' | 'compact';
  narrationStyle?: 'warm_teacher' | 'neutral_teacher';
  enableNarration?: boolean;
  aiProvider?: 'openrouter' | 'gemini' | 'openai';
  enableComfyUI?: boolean;
  idempotencyKey?: string;
  steps?: string[];
}

export interface GenerationJob {
  id: string;
  status: JobState;
  progress: number;
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  errorCode?: string;
  attempts: number;
  heartbeatAt?: string;
  workerId?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

type JobMetadata = {
  userId: string;
  title: string;
  content: string;
  request: GenerationRequestSnapshot;
  idempotencyKey?: string;
};

type JobPatch = Partial<Omit<GenerationJob, 'id' | 'createdAt'>>;

const jobs = new Map<string, GenerationJob>();
const metadata = new Map<string, JobMetadata>();
const persistenceChains = new Map<string, Promise<void>>();
let queue: Bull.Queue<{ videoId: string }> | undefined;

const now = () => new Date().toISOString();
const queueName = process.env.VIDEO_QUEUE_NAME || 'math-video-generation';

const getQueue = (): Bull.Queue<{ videoId: string }> => {
  if (queue) return queue;
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  queue = new Bull<{ videoId: string }>(queueName, redisUrl, {
    defaultJobOptions: {
      attempts: Number(process.env.VIDEO_JOB_ATTEMPTS || 2),
      backoff: { type: 'exponential', delay: Number(process.env.VIDEO_JOB_BACKOFF_MS || 5000) },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
  return queue;
};

const fromPersisted = (video: any): GenerationJob => ({
  id: video.id,
  status: video.status as JobState,
  progress: video.progress,
  message: video.message || (video.status === 'completed' ? 'Video completado' : 'Video guardado'),
  videoUrl: video.videoUrl || undefined,
  thumbnailUrl: video.thumbnailUrl || undefined,
  duration: video.duration || undefined,
  error: video.lastError || undefined,
  errorCode: video.errorCode || undefined,
  attempts: video.attempts || 0,
  heartbeatAt: video.heartbeatAt?.toISOString(),
  workerId: video.workerId || undefined,
  idempotencyKey: video.idempotencyKey || undefined,
  createdAt: new Date(video.createdAt).toISOString(),
  updatedAt: new Date(video.updatedAt).toISOString(),
});

const persist = async (job: GenerationJob, details?: JobMetadata): Promise<void> => {
  const current = details || metadata.get(job.id);
  if (!current?.userId) return;

  await prisma.video.upsert({
    where: { id: job.id },
    create: {
      id: job.id,
      userId: current.userId,
      title: current.title,
      content: current.content,
      status: job.status,
      progress: job.progress,
      message: job.message,
      videoUrl: job.videoUrl,
      thumbnailUrl: job.thumbnailUrl,
      duration: job.duration,
      lastError: job.error,
      errorCode: job.errorCode,
      attempts: job.attempts,
      heartbeatAt: job.heartbeatAt ? new Date(job.heartbeatAt) : undefined,
      workerId: job.workerId,
      idempotencyKey: current.idempotencyKey,
      requestJson: JSON.stringify(current.request),
      startedAt: job.status === 'processing' ? new Date() : undefined,
      completedAt: job.status === 'completed' ? new Date() : undefined,
      outputDir: process.env.MEDIA_ROOT || undefined,
    },
    update: {
      status: job.status,
      progress: job.progress,
      message: job.message,
      videoUrl: job.videoUrl,
      thumbnailUrl: job.thumbnailUrl,
      duration: job.duration,
      lastError: job.error,
      errorCode: job.errorCode,
      attempts: job.attempts,
      heartbeatAt: job.heartbeatAt ? new Date(job.heartbeatAt) : undefined,
      workerId: job.workerId,
      completedAt: job.status === 'completed' ? new Date() : undefined,
    },
  });
};

const safePersist = (job: GenerationJob): void => {
  const previous = persistenceChains.get(job.id) || Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() => persist(job))
    .catch((error) => {
      console.error(`[Jobs] No se pudo persistir ${job.id}:`, error);
    });
  persistenceChains.set(job.id, next);
  void next.finally(() => {
    if (persistenceChains.get(job.id) === next) persistenceChains.delete(job.id);
  });
};

const updateMemory = (id: string, patch: JobPatch): GenerationJob | undefined => {
  const current = jobs.get(id);
  if (!current) return undefined;
  const next = { ...current, ...patch, updatedAt: now() };
  jobs.set(id, next);
  safePersist(next);
  return next;
};

export const generationJobs = {
  has(id: string): boolean {
    return jobs.has(id);
  },

  async findByIdempotencyKey(idempotencyKey: string, userId: string): Promise<GenerationJob | undefined> {
    const persisted = await prisma.video.findFirst({ where: { idempotencyKey, userId } });
    return persisted ? fromPersisted(persisted) : undefined;
  },

  async create(id: string, details: JobMetadata): Promise<GenerationJob> {
    const timestamp = now();
    const job: GenerationJob = {
      id,
      status: 'pending',
      progress: 0,
      message: 'Video en cola...',
      attempts: 0,
      idempotencyKey: details.idempotencyKey,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    metadata.set(id, details);
    jobs.set(id, job);
    await persist(job, details);
    return job;
  },

  async get(id: string): Promise<GenerationJob | undefined> {
    const memory = jobs.get(id);
    if (memory) return memory;
    const persisted = await prisma.video.findUnique({ where: { id } });
    if (!persisted) return undefined;
    const job = fromPersisted(persisted);
    jobs.set(id, job);
    return job;
  },

  async getRequest(id: string): Promise<{ userId: string; request: GenerationRequestSnapshot } | undefined> {
    const memory = metadata.get(id);
    if (memory) return { userId: memory.userId, request: memory.request };
    const persisted = await prisma.video.findUnique({ where: { id }, select: { userId: true, requestJson: true } });
    if (!persisted?.requestJson) return undefined;
    return { userId: persisted.userId, request: JSON.parse(persisted.requestJson) as GenerationRequestSnapshot };
  },

  async belongsTo(id: string, userId: string): Promise<boolean> {
    const persisted = await prisma.video.findFirst({ where: { id, userId }, select: { id: true } });
    return Boolean(persisted || metadata.get(id)?.userId === userId);
  },

  async listForUser(userId: string): Promise<GenerationJob[]> {
    const persisted = await prisma.video.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return persisted.map(fromPersisted);
  },

  update(id: string, patch: JobPatch): GenerationJob | undefined {
    return updateMemory(id, patch);
  },

  fail(id: string, error: string, errorCode = 'GENERATION_FAILED'): GenerationJob | undefined {
    return updateMemory(id, {
      status: 'failed',
      progress: 100,
      message: 'La generación falló',
      error,
      errorCode,
    });
  },

  async enqueue(id: string): Promise<void> {
    await getQueue().add({ videoId: id }, { jobId: id });
  },

  async markProcessing(id: string, workerId: string): Promise<GenerationJob | undefined> {
    const current = await this.get(id);
    if (!current) return undefined;
    return updateMemory(id, {
      status: 'processing',
      progress: Math.max(current.progress, 1),
      message: 'Procesamiento iniciado...',
      attempts: current.attempts + 1,
      workerId,
      heartbeatAt: now(),
    });
  },

  async recoverStaleJobs(maxAgeMs = Number(process.env.VIDEO_JOB_STALE_MS || 900000)): Promise<number> {
    const threshold = new Date(Date.now() - maxAgeMs);
    const stale = await prisma.video.findMany({ where: { status: 'processing', OR: [{ heartbeatAt: null }, { heartbeatAt: { lt: threshold } }] }, select: { id: true } });
    for (const video of stale) {
      await prisma.video.update({ where: { id: video.id }, data: { status: 'pending', message: 'Reencolado después de detectar un worker detenido.', workerId: null, heartbeatAt: null } });
      await getQueue().add({ videoId: video.id }, { jobId: `recovery-${video.id}-${randomUUID()}` });
    }
    return stale.length;
  },
};

export const videoQueue = {
  get name() {
    return queueName;
  },
  get instance() {
    return getQueue();
  },
};
