import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMathProblem } from './math-validation.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { buildPresentationPlan } from './presentation-engine.service.js';
import { applyVisualRepairPlan, buildVisualRepairPlan } from './visual-repair.service.js';
import type { VisualIssue } from './presentation.types.js';

test('builds an actionable repair plan from a measured overflow issue', () => {
  const issue: VisualIssue = {
    type: 'overflow',
    severity: 'error',
    element: 'equation-primary',
    scene: 'scene-1',
    measuredValue: 'outside safe frame',
    expectedValue: 'inside safe frame',
    suggestedRepair: 'Reduce scale and preserve the minimum readable size.',
    reason: 'The equation exceeds the safe frame by 18%.',
  };
  const repairPlan = buildVisualRepairPlan([issue], 1);
  assert.equal(repairPlan.actions.length, 1);
  assert.equal(repairPlan.actions[0]?.type, 'reduce-scale');
  assert.deepEqual(repairPlan.actions[0]?.blockIds, ['equation-primary']);
  assert.match(repairPlan.rationale[0] || '', /Reduce scale/);
});

test('re-resolves the presentation plan after a template repair', () => {
  const validation = validateMathProblem('x^2 - 5x + 6 = 0');
  const scenes = buildQuadraticStoryboard('x^2 - 5x + 6 = 0', validation, 'warm_teacher');
  const original = buildPresentationPlan({ problem: 'x^2 - 5x + 6 = 0', validation, pedagogicalScenes: scenes, aspectRatio: '16:9', quality: 'low', density: 'comfortable' });
  const sceneId = original.scenes[0]?.id;
  assert.ok(sceneId);
  const repaired = applyVisualRepairPlan(original, {
    iteration: 1,
    rationale: ['The original template is too dense for the scene.'],
    actions: [{ type: 'change-template', sceneId, parameters: { layout: 'vertical-stack' }, reason: 'Use a vertical stack.' }],
  });
  assert.equal(repaired.scenes.length, original.scenes.length);
  assert.equal(repaired.resolvedLayouts.length, original.resolvedLayouts.length);
  assert.equal(repaired.scenes[0]?.layout, 'vertical-stack');
  assert.ok(repaired.resolvedLayouts.every((layout) => layout.blocks.length > 0));
});
