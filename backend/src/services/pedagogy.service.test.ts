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

  const discriminantSetup = scenes.find((scene) => scene.id === 'discriminant-setup');
  assert.equal(discriminantSetup?.visualLatex?.[1], '\\Delta = (-5)^2 - 4(1)(6)');

  const calculation = scenes.find((scene) => scene.id === 'discriminant-calculate');
  assert.match(calculation?.narrationText ?? '', /veinticinco/);
  assert.match(calculation?.narrationText ?? '', /veinticuatro/);
  assert.doesNotMatch(calculation?.narrationText ?? '', /dos cinco|dos cuatro/);

  assert.match(scenes.find((scene) => scene.id === 'hook')?.narrationText ?? '', /Muy bien/);
  const neutralScenes = buildQuadraticStoryboard('x^2 - 5x + 6 = 0', validation, 'neutral_teacher');
  assert.doesNotMatch(neutralScenes.find((scene) => scene.id === 'hook')?.narrationText ?? '', /Muy bien/);

  const discriminant = scenes.find((scene) => scene.id === 'discriminant-calculate');
  const negativeScenes = buildQuadraticStoryboard('3x^2 + 2x - 8 = 0', validateMathProblem('3x^2 + 2x - 8 = 0'));
  const negativeDiscriminant = negativeScenes.find((scene) => scene.id === 'discriminant-calculate');
  assert.match(negativeDiscriminant?.narrationText ?? '', /menos noventa y seis/);
  assert.doesNotMatch(negativeDiscriminant?.narrationText ?? '', /definet|undefined/i);
  assert.deepEqual(discriminant?.visualStages?.map((stage) => stage.label), ['Fórmula base', 'Reemplazamos', 'Operamos', 'Resultado']);
  assert.match(discriminant?.visualStages?.[1]?.latex ?? '', /\(-5\)\^2/);

  const substitution = scenes.find((scene) => scene.id === 'formula-substitution');
  assert.deepEqual(substitution?.visualStages?.map((stage) => stage.label), ['Fórmula de partida', 'Sustituimos a, b y Δ']);

  const branches = scenes.find((scene) => scene.id === 'solution-branches');
  const negativeBranches = negativeScenes.find((scene) => scene.id === 'solution-branches');
  assert.match(negativeBranches?.narrationText ?? '', /uno punto tres tres/);
  assert.doesNotMatch(negativeBranches?.narrationText ?? '', /tres tres tres tres tres tres/);
  assert.equal(branches?.visualLatex?.length, 2);
  const graph = scenes.find((scene) => scene.id === 'graph');
  assert.equal(graph?.layout, 'graph');
  assert.deepEqual(graph?.graphSpec, { a: 1, b: -5, c: 6, roots: [2, 3] });
});
