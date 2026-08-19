import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMathProblem } from './math-validation.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { buildPresentationPlan, buildPresentationPlanFromSynchronizedScenes, repairPresentationPlan } from './presentation-engine.service.js';
import { synchronization } from './synchronization.service.js';

test('builds a complete presentation plan from the existing quadratic storyboard', () => {
  const problem = 'x^2 - 5x + 6 = 0';
  const validation = validateMathProblem(problem);
  const scenes = buildQuadraticStoryboard(problem, validation, 'warm_teacher');
  const plan = buildPresentationPlan({ problem, validation, pedagogicalScenes: scenes, aspectRatio: '16:9', quality: 'low' });

  assert.equal(plan.engineVersion, 'math-presentation-engine-v1');
  assert.equal(plan.designVersion, 'math-design-v1');
  assert.equal(plan.scenes.length, 10);
  assert.equal(plan.resolvedLayouts.length, 10);
  assert.ok(plan.solutionHash.length >= 12);
  assert.ok(plan.score.total >= 0 && plan.score.total <= 100);
  assert.equal(plan.scenes.find((scene) => scene.id === 'discriminant-calculate')?.blocks[0]?.semanticRole, 'formula-base');
});

test('builds a real fallback plan without claiming mathematical support', () => {
  const problem = 'f(x) = 2x + 1';
  const validation = validateMathProblem(problem);
  const synchronizedScenes = synchronization.buildSynchronizedScenes(problem, ['Evaluamos f(0)=1', 'Evaluamos f(3)=7']);
  const plan = buildPresentationPlanFromSynchronizedScenes({ problem, validation, synchronizedScenes, aspectRatio: '16:9', quality: 'low' });
  assert.equal(plan.mathematicalSupport.supported, false);
  assert.equal(plan.mathematicalSupport.kind, 'unsupported');
  assert.deepEqual(plan.scenes.map((scene) => scene.id), ['intro', 'step-1', 'step-2', 'conclusion']);
});

test('repairs a plan with a bounded number of attempts', () => {
  const problem = 'x^2 - 5x + 6 = 0';
  const validation = validateMathProblem(problem);
  const scenes = buildQuadraticStoryboard(problem, validation, 'warm_teacher');
  const plan = buildPresentationPlan({ problem, validation, pedagogicalScenes: scenes, aspectRatio: '1:1', quality: 'low' });
  const repaired = repairPresentationPlan({ ...plan, passed: false }, 2);
  assert.equal(repaired.engineVersion, plan.engineVersion);
  assert.equal(repaired.resolvedLayouts.length, plan.resolvedLayouts.length);
});
