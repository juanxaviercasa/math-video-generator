import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRenderIntegrity } from './render-integrity.service.js';

const good = {
  format: { duration: '10.10' },
  streams: [
    { codec_type: 'video', width: 1280, height: 720, avg_frame_rate: '30/1', duration: '10.10', nb_frames: '303' },
    { codec_type: 'audio', duration: '10.02' },
  ],
};

const expected = { width: 1280, height: 720, fps: 30, narrationRequired: true };

test('accepts a 30 fps encoded video with matching audio and dimensions', () => {
  const result = validateRenderIntegrity(good, { ...expected, plannedDurationSeconds: 10 });
  assert.equal(result.passed, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.actual.fps, 30);
});

test('rejects 15 fps or wrong dimensions regardless of the export command', () => {
  const result = validateRenderIntegrity({
    ...good,
    streams: [{ ...good.streams[0], avg_frame_rate: '15/1', width: 854 }],
  }, expected);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes('FPS')));
  assert.ok(result.errors.some((error) => error.includes('Resolución')));
});

test('rejects missing requested narration and invalid video duration', () => {
  const result = validateRenderIntegrity({
    format: { duration: '0' },
    streams: [{ codec_type: 'video', width: 1280, height: 720, avg_frame_rate: '30/1', duration: '0' }],
  }, expected);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes('duración')));
  assert.ok(result.errors.some((error) => error.includes('narración')));
});

test('rejects audio that continues after images end', () => {
  const result = validateRenderIntegrity({
    format: { duration: '15' },
    streams: [
      { codec_type: 'video', width: 1280, height: 720, avg_frame_rate: '30/1', duration: '10' },
      { codec_type: 'audio', duration: '15' },
    ],
  }, expected);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes('excede la imagen')));
});

test('reports rather than hiding long trailing silence or timeline drift', () => {
  const result = validateRenderIntegrity({
    format: { duration: '20' },
    streams: [
      { codec_type: 'video', width: 1280, height: 720, avg_frame_rate: '30/1', duration: '20' },
      { codec_type: 'audio', duration: '10' },
    ],
  }, { ...expected, plannedDurationSeconds: 12 });
  assert.equal(result.passed, true);
  assert.equal(result.warnings.length, 2);
});
