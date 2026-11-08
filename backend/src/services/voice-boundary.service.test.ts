import assert from 'node:assert/strict';
import test from 'node:test';
import { cueHighlightOffset, parseWordBoundaries } from './voice-boundary.service.js';

const srt = [
  '1', '00:00:00,120 --> 00:00:00,460', 'Calculamos', '',
  '2', '00:00:00,490 --> 00:00:00,760', 'delta', '',
].join('\n');

test('reads real Edge TTS word timestamps and protects their order', () => {
  assert.deepEqual(parseWordBoundaries(srt, 1.2), [
    { text: 'Calculamos', startSeconds: 0.12, endSeconds: 0.46 },
    { text: 'delta', startSeconds: 0.49, endSeconds: 0.76 },
  ]);
  assert.equal(cueHighlightOffset(parseWordBoundaries(srt, 1.2), 1.2, 0.2), 0.32);
  assert.equal(cueHighlightOffset([], 0.8, 0.2), 0.25);
});

test('refuses corrupt and impossible subtitle boundaries rather than trusting fake timing', () => {
  assert.throws(() => parseWordBoundaries(srt, 0.5), /VOICE_BOUNDARY_INVALID/);
  assert.throws(() => parseWordBoundaries(srt.replace('00:00:00,490', '00:00:00,100'), 1.2), /VOICE_BOUNDARY_INVALID/);
  assert.throws(() => parseWordBoundaries(srt.replace('2\n', '3\n'), 1.2), /VOICE_BOUNDARY_INVALID/);
  assert.deepEqual(parseWordBoundaries('', 2), []);
});
