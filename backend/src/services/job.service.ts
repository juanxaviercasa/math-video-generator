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

const jobs = new Map<string, GenerationJob>();

const now = () => new Date().toISOString();

const update = (id: string, patch: JobPatch): GenerationJob | undefined => {
  const current = jobs.get(id);
  if (!current) return undefined;

  const next: GenerationJob = {
    ...current,
    ...patch,
    updatedAt: now(),
  };
  jobs.set(id, next);
  return next;
};

export const generationJobs = {
  has(id: string): boolean {
    return jobs.has(id);
  },

  create(id: string): GenerationJob {
    const timestamp = now();
    const job: GenerationJob = {
      id,
      status: 'pending',
      progress: 0,
      message: 'Video en cola...',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    jobs.set(id, job);
    return job;
  },

  get(id: string): GenerationJob | undefined {
    return jobs.get(id);
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
