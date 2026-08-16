import { prisma } from '../lib/prisma.js';

export type JobState = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  status: JobState;
  progress: number;
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

type JobPatch = Partial<Omit<GenerationJob, 'id' | 'createdAt'>>;
type JobExecutor = (report: (patch: JobPatch) => void) => Promise<JobPatch>;

type JobMetadata = {
  userId?: string;
  title?: string;
  content?: string;
};

const jobs = new Map<string, GenerationJob>();
const metadata = new Map<string, JobMetadata>();

const now = () => new Date().toISOString();

const persist = async (job: GenerationJob): Promise<void> => {
  const details = metadata.get(job.id);
  if (!details?.userId || details.userId === 'temp-user' || !details.title || !details.content) return;

  try {
    await prisma.video.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        userId: details.userId,
        title: details.title,
        content: details.content,
        status: job.status,
        progress: job.progress,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        duration: job.duration,
      },
      update: {
        status: job.status,
        progress: job.progress,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        duration: job.duration,
      },
    });
  } catch (error) {
    console.error(`[Jobs] Could not persist ${job.id}:`, error);
  }
};

const update = (id: string, patch: JobPatch): GenerationJob | undefined => {
  const current = jobs.get(id);
  if (!current) return undefined;

  const next: GenerationJob = {
    ...current,
    ...patch,
    updatedAt: now(),
  };
  jobs.set(id, next);
  void persist(next);
  return next;
};

export const generationJobs = {
  has(id: string): boolean {
    return jobs.has(id);
  },

  create(id: string, details: JobMetadata = {}): GenerationJob {
    const timestamp = now();
    metadata.set(id, details);
    const job: GenerationJob = {
      id,
      status: 'pending',
      progress: 0,
      message: 'Video en cola...',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    jobs.set(id, job);
    void persist(job);
    return job;
  },

  get(id: string): GenerationJob | undefined {
    return jobs.get(id);
  },

  belongsTo(id: string, userId: string): boolean {
    return metadata.get(id)?.userId === userId;
  },

  async listForUser(userId: string): Promise<GenerationJob[]> {
    const persisted = await prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return persisted.map((video: GenerationJob) => ({
      id: video.id,
      status: video.status,
      progress: video.progress,
      message: video.status === 'completed' ? 'Video completado' : 'Video guardado',
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      createdAt: new Date(video.createdAt).toISOString(),
      updatedAt: new Date(video.updatedAt).toISOString(),
    }));
  },

  fail(id: string, error: string): GenerationJob | undefined {
    return update(id, {
      status: 'failed',
      progress: 100,
      message: 'La generación falló',
      error,
    });
  },

  enqueue(id: string, executor: JobExecutor): void {
    setImmediate(async () => {
      update(id, {
        status: 'processing',
        progress: 1,
        message: 'Iniciando procesamiento...',
      });

      try {
        const result = await executor((patch) => update(id, patch));
        update(id, result);
      } catch (error) {
        update(id, {
          status: 'failed',
          progress: 100,
          message: 'La generación falló',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  },
};
