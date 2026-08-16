import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMathProblem } from './math-validation.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';

test('builds a complete quadratic teaching storyboard', () => {
  const validation = validateMathProblem('x^2 - 5x + 6 = 0');
  const scenes = buildQuadraticStoryboard('x^2 - 5x + 6 = 0', validation);

  assert.deepEqual(scenes.map((scene) => scene.id), [
    'hook',
    'coefficients',
    'discriminant-setup',
    'discriminant-calculate',
    'formula-symbolic',
    'formula-substitution',
    'formula-simplify',
    'solution-branches',
    'graph',
    'recap',
  ]);

  const coefficients = scenes.find((scene) => scene.id === 'coefficients');
  assert.deepEqual(coefficients?.visualLatex, ['a = 1', 'b = -5', 'c = 6']);

  const substitution = scenes.find((scene) => scene.id === 'discriminant-setup');
  assert.ok(substitution?.visualLatex?.some((line) => line.includes('(-5)^2')));

  const calculation = scenes.find((scene) => scene.id === 'discriminant-calculate');
  assert.match(calculation?.narrationText ?? '', /veinticinco/);
  assert.match(calculation?.narrationText ?? '', /veinticuatro/);
  assert.doesNotMatch(calculation?.narrationText ?? '', /dos cinco|dos cuatro/);

  const branches = scenes.find((scene) => scene.id === 'solution-branches');
  assert.equal(branches?.visualLatex?.length, 2);
  assert.equal(scenes.find((scene) => scene.id === 'graph')?.layout, 'graph');
});
