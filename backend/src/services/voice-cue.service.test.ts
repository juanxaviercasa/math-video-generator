import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCueTimingPlan, extractVoiceCues, CUE_INTRO_SECONDS, CUE_OUTRO_SECONDS } from './voice-cue.service.js';
import { validateMathProblem } from './math-validation.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { manim } from './manim.service.js';

test('the verified quadratic discriminant has one spoken cue for each mathematical visual', () => {
  const input = 'x^2 - 5x + 6 = 0';
  const scene = buildQuadraticStoryboard(input, validateMathProblem(input)).find((item) => item.id === 'discriminant-calculate');
  assert.ok(scene);
  const cues = extractVoiceCues(scene);
  assert.equal(cues.length, 4);
  assert.ok(cues.every((value) => value.length > 10));
  assert.match(cues.at(-1) || '', /discriminante vale uno/i);
});

test('cue timing is based on decoded neural audio and is contiguous', () => {
  const plan = buildCueTimingPlan([2.27, 1.01, 3.25]);
  assert.deepEqual(plan.stageDurations, [2.9, 1.64, 3.88]);
  assert.deepEqual(plan.stageStarts, [1.2, 4.1, 5.74]);
  assert.ok(Math.abs(plan.sceneDuration - (CUE_INTRO_SECONDS + plan.stageDurations.reduce((sum, seconds) => sum + seconds, 0) + CUE_OUTRO_SECONDS)) < 1e-9);
});

test('invalid and missing cue audio durations are blocked', () => {
  for (const input of [[], [0], [Number.NaN], [Infinity], [-1]]) {
    assert.throws(() => buildCueTimingPlan(input), /VOICE_CUES_INVALID/);
  }
});

test('generates sequential highlights in Manim without changing the mathematical formula', () => {
  const input = 'x^2 - 5x + 6 = 0';
  const scenes = buildQuadraticStoryboard(input, validateMathProblem(input));
  const stage = scenes.find((item) => item.id === 'discriminant-calculate');
  assert.ok(stage);
  stage.visualCueDurations = [2, 2, 2, 2];
  stage.duration = 1.2 + stage.visualCueDurations.reduce((sum, seconds) => sum + seconds, 0) + 1;
  const script = manim.generatePythonScript({
    title: 'Voice aligned',
    outputDir: '/tmp',
    steps: [],
    pedagogicalScenes: [stage],
  }, true);
  assert.equal((script.match(/# Voz neural y resaltado del mismo micro-paso/g) || []).length, 4);
  assert.match(script, /Indicate\(content_0\[0\]\[1\], color=YELLOW/);
  assert.match(script, /Indicate\(content_0\[1\]\[2\]\[1\], color=YELLOW/);
  assert.match(script, /self\.wait\(1\.150\)/);
});
