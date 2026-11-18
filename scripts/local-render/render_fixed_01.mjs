import { generationJobs } from '../../backend/dist/services/job.service.js';
import { randomUUID } from 'node:crypto';

async function main() {
  const videoId = 'mvg_pilot_01_fixed';
  const userId = process.env.OWNER_USER_ID;
  const idempotencyKey = 'idemp_' + videoId + '_' + Date.now();

  console.log('Submitting fixed pilot job:', videoId);
  console.log('Problem: x^2 - 7x + 12 = 0 (16:9, medium, es-PE-CamilaNeural)');

  // Remove existing job record if any
  const existing = await generationJobs.get(videoId);
  if (existing) {
    console.log('Cleaning up prior existing job record for', videoId);
    await generationJobs.update(videoId, { status: 'pending', progress: 0, message: 'Reencolando' });
  }

  const request = {
    id: videoId,
    title: 'Ejercicio 01 (Corregido): x^2 - 7x + 12 = 0 (16:9)',
    content: 'x^2 - 7x + 12 = 0',
    quality: 'medium',
    aspectRatio: '16:9',
    layoutDensity: 'comfortable',
    narrationStyle: 'warm_teacher',
    enableNarration: true,
    narratorVoiceId: 'es-PE-CamilaNeural',
    idempotencyKey,
  };

  if (!existing) {
    await generationJobs.create(videoId, {
      userId,
      title: request.title,
      content: request.content,
      idempotencyKey,
      request,
    });
  }

  await generationJobs.enqueue(videoId);
  console.log('Job enqueued in BullMQ. Now monitoring progress...');

  let lastProgress = -1;
  let lastMessage = '';
  while (true) {
    await new Promise((r) => setTimeout(r, 4000));
    const current = await generationJobs.get(videoId);
    if (!current) continue;
    if (current.progress !== lastProgress || current.message !== lastMessage) {
      lastProgress = current.progress;
      lastMessage = current.message || '';
      console.log(`[${new Date().toISOString()}] Status: ${current.status} | Progress: ${current.progress}% | ${current.message || ''}`);
    }
    if (current.status === 'completed') {
      console.log('SUCCESS! Job completed.');
      console.log('Result payload:', JSON.stringify(current.result, null, 2));
      break;
    }
    if (current.status === 'failed') {
      console.error('FAILED! Job failed with error:', current.error || current.message);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error in render_fixed_01:', err);
  process.exit(1);
});
