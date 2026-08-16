import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMathProblem } from './math-validation.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { buildPresentationPlan, repairPresentationPlan } from './presentation-engine.service.js';

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

test('repairs a plan with a bounded number of attempts', () => {
  const problem = 'x^2 - 5x + 6 = 0';
  const validation = validateMathProblem(problem);
  const scenes = buildQuadraticStoryboard(problem, validation, 'warm_teacher');
  const plan = buildPresentationPlan({ problem, validation, pedagogicalScenes: scenes, aspectRatio: '1:1', quality: 'low' });
  const repaired = repairPresentationPlan({ ...plan, passed: false }, 2);
  assert.equal(repaired.engineVersion, plan.engineVersion);
  assert.equal(repaired.resolvedLayouts.length, plan.resolvedLayouts.length);
});
