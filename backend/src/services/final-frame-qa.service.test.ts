import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBlackIntervals, assessBlackIntervals } from './final-frame-qa.service.js';

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
