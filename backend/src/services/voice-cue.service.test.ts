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
  assert.deepEqual(plan.stageDurations, [2.59, 1.33, 3.57]);
  assert.deepEqual(plan.stageStarts, [0.4, 2.99, 4.32]);
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
  stage.duration = CUE_INTRO_SECONDS + stage.visualCueDurations.reduce((sum, seconds) => sum + seconds, 0) + CUE_OUTRO_SECONDS;
  const script = manim.generatePythonScript({
    title: 'Voice aligned',
    outputDir: '/tmp',
    steps: [],
    pedagogicalScenes: [stage],
  }, true);
  assert.equal((script.match(/# Voz neural y resaltado del mismo micro-paso/g) || []).length, 4);
  assert.match(script, /Indicate\(content_0\[0\]\[1\], color=YELLOW/);
  assert.match(script, /Indicate\(content_0\[3\]\[1\], color=YELLOW/);
});

test('narrates both solution branches with individually timed visual equations', () => {
  const exercise = 'x^2 - 5x + 6 = 0';
  const scenes = buildQuadraticStoryboard(exercise, validateMathProblem(exercise));
  const branches = scenes.find((scene) => scene.id === 'solution-branches');
  assert.ok(branches);
  assert.equal(branches.layout, 'equation');
  assert.equal(extractVoiceCues(branches).length, 3);
  branches.visualCueDurations = [2, 3, 3];
  const script = manim.generatePythonScript({
    title: 'Narrated plus minus',
    outputDir: '/tmp',
    content: exercise,
    steps: [],
    pedagogicalScenes: scenes,
  }, true);
  assert.match(script, /focus_7 = self\._arrange_equation_stages\(content_7\)/);
  assert.match(script, /self\._create_problem_anchor/);
  assert.match(script, /Indicate\(content_7\[2\]\[1\]/);
});
