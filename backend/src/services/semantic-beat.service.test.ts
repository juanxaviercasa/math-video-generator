import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSemanticBeats, auditSemanticBeatTiming } from './semantic-beat.service.js';

const speech = [
  { text: 'Primero', startSeconds: 0.35, endSeconds: 0.66 },
  { text: 'identificaremos', startSeconds: 0.72, endSeconds: 1.15 },
  { text: 'los', startSeconds: 1.20, endSeconds: 1.34 },
  { text: 'coeficientes.', startSeconds: 1.40, endSeconds: 1.87 },
  { text: 'Después', startSeconds: 2.13, endSeconds: 2.48 },
  { text: 'sustituiremos', startSeconds: 2.55, endSeconds: 3.03 },
  { text: 'los', startSeconds: 3.12, endSeconds: 3.25 },
  { text: 'valores.', startSeconds: 3.30, endSeconds: 3.75 },
  { text: 'Finalmente', startSeconds: 4.20, endSeconds: 4.72 },
  { text: 'calcularemos', startSeconds: 4.79, endSeconds: 5.18 },
];
test('visual events follow actual spoken word starts, not uniform percentages', () => {
  const beats = resolveSemanticBeats(
    ['Primero identificaremos', 'Después sustituiremos', 'Finalmente calcularemos'],
    speech, 0.4, 6.6,
  );
  assert.deepEqual(beats.map((b) => b.atSeconds), [0.75, 2.53, 4.6]);
  assert.deepEqual(beats.map((b) => b.wordIndex), [0, 4, 8]);
});

test('reject missing, reordered, crowded or too-late voice events', () => {
  assert.throws(() => resolveSemanticBeats(['después', 'primero'], speech, 0.4, 6.6), /VOICE_BEAT_NOT_FOUND/);
  assert.throws(() => resolveSemanticBeats(['palabra inexistente'], speech, 0.4, 6.6), /VOICE_BEAT_NOT_FOUND/);
  assert.throws(() => resolveSemanticBeats(['Primero', 'identificaremos'], speech, 0.4, 6.6), /VOICE_BEAT_TOO_CLOSE/);
  assert.throws(() => resolveSemanticBeats(['Finalmente'], speech, 0.4, 4.9), /VOICE_BEAT_TOO_LATE/);
  assert.throws(() => resolveSemanticBeats(['Primero'], [], 0.4, 6.6), /VOICE_BEATS_MISSING/);
});

test('measured Manim events must actually coincide with their spoken timestamps', () => {
  const plan = { hook: [0.75, 2.53, 4.6] };
  const good = [
    { id: 'hook', beats: plan.hook.map((expectedSeconds, index) => ({
      index, expectedSeconds, actualSeconds: expectedSeconds + 0.05,
    })) },
  ];
  assert.deepEqual(auditSemanticBeatTiming(good, plan), { passed: true, errors: [], checked: 3 });
  good[0].beats[1].actualSeconds += 0.28;
  assert.equal(auditSemanticBeatTiming(good, plan).passed, false);
  assert.match(auditSemanticBeatTiming(good, plan).errors.join(' '), /VOICE_BEAT_DRIFT/);
  assert.match(auditSemanticBeatTiming([], plan).errors.join(' '), /VOICE_BEAT_MISSING/);
});
