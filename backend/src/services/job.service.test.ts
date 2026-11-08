import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma.js';
import { generationJobs } from './job.service.js';

test('generationJobs manages lifecycle and durable state', async () => {
  const store = new Map<string, any>();
  const originalUpsert = prisma.video.upsert;
  const originalUpdate = prisma.video.update;
  const originalFindUnique = prisma.video.findUnique;
  const originalFindFirst = prisma.video.findFirst;

  prisma.video.upsert = (async ({ where, create, update }: any) => {
    const existing = store.get(where.id);
    const result = existing ? { ...existing, ...update, updatedAt: new Date() } : { ...create, createdAt: new Date(), updatedAt: new Date() };
    store.set(where.id, result);
    return result;
  }) as any;

  prisma.video.update = (async ({ where, data }: any) => {
    const existing = store.get(where.id) || { id: where.id, createdAt: new Date() };
    const result = { ...existing, ...data, updatedAt: new Date() };
    store.set(where.id, result);
    return result;
  }) as any;

  prisma.video.findUnique = (async ({ where }: any) => store.get(where.id) || null) as any;
  prisma.video.findFirst = (async ({ where }: any) => {
    for (const item of store.values()) {
      if (where.idempotencyKey && item.idempotencyKey === where.idempotencyKey && (!where.userId || item.userId === where.userId)) {
        return item;
      }
    }
    return null;
  }) as any;

  try {
    const jobId = 'test_job_lifecycle_' + Date.now();
    const userId = 'f8ac2d08-5301-4585-9919-252ea34f91da';
    const idempotencyKey = 'idemp_' + jobId;

    // 1. Create
    const job = await generationJobs.create(jobId, {
      userId,
      title: 'Test Job',
      content: 'x^2 - 5x + 6 = 0',
      idempotencyKey,
      request: {
        id: jobId,
        title: 'Test Job',
        content: 'x^2 - 5x + 6 = 0',
      },
    });

    assert.equal(job.id, jobId);
    assert.equal(job.status, 'pending');
    assert.equal(job.progress, 0);

    // 2. Mark processing
    const processing = await generationJobs.markProcessing(jobId, 'worker-unit-test');
    assert.equal(processing?.status, 'processing');
    assert.equal(processing?.workerId, 'worker-unit-test');
    assert.ok(processing?.progress && processing.progress >= 1);

    // 3. Intermediate updates
    const updated = generationJobs.update(jobId, {
      progress: 50,
      message: 'Mitad completada',
    });
    assert.equal(updated?.progress, 50);

    // 4. Complete
    const completed = await generationJobs.complete(jobId, {
      message: 'Video completado exitosamente',
      videoUrl: `/api/media/${jobId}/video.mp4`,
      thumbnailUrl: `/api/media/${jobId}/thumb.jpg`,
      duration: 120,
    });
    assert.equal(completed.status, 'completed');
    assert.equal(completed.progress, 100);
    assert.equal(completed.duration, 120);

    // 5. Guard against stale demotion:
    // A late onProgress callback trying to set progress: 70 must NOT demote 'completed' to 'processing'
    const demoteAttempt = generationJobs.update(jobId, {
      status: 'processing',
      progress: 70,
      message: 'Late progress callback',
    });
    assert.equal(demoteAttempt?.status, 'completed');
    assert.equal(demoteAttempt?.progress, 100);

    // 6. Find by idempotency
    const found = await generationJobs.findByIdempotencyKey(idempotencyKey, userId);
    assert.equal(found?.id, jobId);
    assert.equal(found?.status, 'completed');
  } finally {
    prisma.video.upsert = originalUpsert;
    prisma.video.update = originalUpdate;
    prisma.video.findUnique = originalFindUnique;
    prisma.video.findFirst = originalFindFirst;
  }
});

test('generationJobs.getRequest retrieves stored request from DB in worker without memory metadata', async () => {
  const originalFindUnique = prisma.video.findUnique;
  const testId = 'test_external_worker_' + Date.now();
  const testUserId = 'f8ac2d08-5301-4585-9919-252ea34f91da';
  const testRequest = {
    id: testId,
    title: 'Ecuacion de prueba',
    content: 'x^2 - 1 = 0',
  };

  prisma.video.findUnique = (async ({ where }: any) => {
    if (where.id === testId) {
      return {
        userId: testUserId,
        requestJson: JSON.stringify(testRequest),
      };
    }
    return null;
  }) as any;

  try {
    const result = await generationJobs.getRequest(testId);
    assert.ok(result);
    assert.equal(result?.userId, testUserId);
    assert.equal(result?.request.title, 'Ecuacion de prueba');
    assert.equal(result?.request.content, 'x^2 - 1 = 0');
  } finally {
    prisma.video.findUnique = originalFindUnique;
  }
});
