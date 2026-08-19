import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRemotionDeck } from './remotion-renderer.service.js';

test('keeps Remotion opt-in and reports an actionable configuration error', async () => {
  const previous = process.env.REMOTION_ENABLED;
  delete process.env.REMOTION_ENABLED;
  await assert.rejects(
    renderRemotionDeck({ id: 'disabled', format: '16:9', outputDir: '/tmp', timeline: {
      id: 'timeline', version: '2', problem: 'x = 1', narrationStyle: 'warm_teacher', segments: [], events: [],
    } }),
    /Remotion está desactivado/,
  );
  if (previous === undefined) delete process.env.REMOTION_ENABLED;
  else process.env.REMOTION_ENABLED = previous;
});
