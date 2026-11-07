import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBlackIntervals, assessBlackIntervals, buildStageSampleTimes } from './final-frame-qa.service.js';

test('parses FFmpeg blackout intervals from mixed log output', () => {
  const source = '[blackdetect @ abc] black_start:1.234 black_end:2.345 black_duration:1.111\n'
    + 'frame= 120\n'
    + '[blackdetect @ abc] black_start:8.5 black_end:8.9 black_duration:0.4';
  const out = parseBlackIntervals(source);
  assert.deepEqual(out, [
    { start: 1.234, end: 2.345, duration: 1.111 },
    { start: 8.5, end: 8.9, duration: 0.4 },
  ]);
});

test('blocks real blank segments while allowing short transitions', () => {
  const reviewed = assessBlackIntervals([
    { start: 0, end: 0.15, duration: 0.15 },
    { start: 2, end: 2.8, duration: 0.8 },
    { start: 6, end: 6.45, duration: 0.45 },
  ], 10);
  assert.equal(reviewed.errors.length, 1);
  assert.ok(reviewed.errors[0].includes('VISUAL_BLACKOUT'));
  assert.equal(reviewed.warnings.length, 1);
});

test('ignores malformed FFmpeg log records', () => {
  assert.deepEqual(parseBlackIntervals('black_start:nan black_end:5 black_duration:abc'), []);
});

test('samples every real scene midpoint even when uniform sampling would skip it', () => {
  const samples = buildStageSampleTimes(60, [
    { id: 'hook', start: 0, end: 4 },
    { id: 'micro-step', start: 4, end: 5 },
    { id: 'graph', start: 5, end: 60 },
  ], 2);
  assert.ok(samples.includes(2));
  assert.ok(samples.includes(4.5));
  assert.ok(samples.includes(32.5));
  assert.deepEqual(samples, [...samples].sort((a, b) => a - b));
});

test('rejects broken stage intervals instead of silently omitting a scene', () => {
  assert.throws(() => buildStageSampleTimes(10, [{ id: 'missing', start: 9, end: 8 }]), /FRAME_STAGE_INVALID/);
  assert.throws(() => buildStageSampleTimes(10, [{ id: 'outside', start: 11, end: 12 }]), /FRAME_STAGE_INVALID/);
});
