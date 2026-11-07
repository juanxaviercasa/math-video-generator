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

test('negative discriminant never yields fictitious roots or a real-intercept graph', () => {
  const validation = validateMathProblem('x^2 + 2x + 5 = 0');
  const scenes = buildQuadraticStoryboard('x^2 + 2x + 5 = 0', validation);

  assert.equal(validation.valid, true);
  assert.equal(validation.result, 'No hay soluciones reales');
  assert.equal(scenes.some((scene) => scene.layout === 'graph'), false);
  assert.equal(scenes.some((scene) => scene.id === 'solution-branches'), false);
  assert.ok(scenes.some((scene) => scene.visualLatex?.some((latex) => latex.includes('-16') && latex.includes('< 0'))));
  assert.deepEqual(scenes[0]?.pedagogicalContract?.requiredSteps, ['hook', 'identify', 'compute', 'interpret']);
  assert.match(scenes.at(-1)?.narrationText ?? '', /no tiene soluciones reales/i);
});

test('irrational roots retain exact radicals and use approximate equality for decimals', () => {
  const input = 'x^2 - 2x - 1 = 0';
  const scenes = buildQuadraticStoryboard(input, validateMathProblem(input));
  const simplify = scenes.find((scene) => scene.id === 'formula-simplify');
  const branches = scenes.find((scene) => scene.id === 'solution-branches');

  assert.match(simplify?.visualLatex?.[0] ?? '', /\\sqrt\{8\}/);
  assert.match(branches?.visualLatex?.[0] ?? '', /\\approx/);
  assert.match(branches?.narrationText ?? '', /aproximadamente/);
});

test('repeated quadratic roots are mathematically exact', () => {
  const input = 'x^2 - 2x + 1 = 0';
  const scenes = buildQuadraticStoryboard(input, validateMathProblem(input));
  const branches = scenes.find((scene) => scene.id === 'solution-branches');
  assert.deepEqual(scenes.find((scene) => scene.id === 'graph')?.graphSpec?.roots, [1, 1]);
  assert.ok(branches?.visualLatex?.every((latex) => !latex.includes('\\approx')));
});

test('small nonzero decimal coefficients are never rounded to zero in displayed equations', () => {
  const problem = '0.0001x^2 + 0.02x - 1 = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));
  const coefficients = scenes.find((scene) => scene.id === 'coefficients');
  const discriminant = scenes.find((scene) => scene.id === 'discriminant-calculate');
  assert.ok(coefficients?.visualLatex?.includes('a = 0.0001'));
  assert.ok(discriminant?.visualLatex?.some((formula) => formula.includes('0.0001')));
  assert.ok(discriminant?.visualLatex?.some((formula) => formula.includes('0.0008')));
});

test('rounded roots use approximate relation even in the recap', () => {
  const problem = '3x^2 + 2x - 8 = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));
  const recap = scenes.find((scene) => scene.id === 'recap');
  assert.ok(recap?.visualLatex?.some((formula) => formula.includes('\\approx')));
});
