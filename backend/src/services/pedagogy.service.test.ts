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
    'verification',
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
  const verification = scenes.find((scene) => scene.id === 'verification');
  assert.equal(verification?.layout, 'split');
  assert.match(verification?.visualLatex?.[0] ?? '', /\(3\)\^2 - 5\(3\) \+ 6 = 9 - 15 \+ 6 = 0/);
  assert.match(verification?.visualLatex?.[1] ?? '', /\(2\)\^2 - 5\(2\) \+ 6 = 4 - 10 \+ 6 = 0/);
  assert.match(verification?.narrationText ?? '', /Comprobamos ambas soluciones/);
  const graph = scenes.find((scene) => scene.id === 'graph');
  assert.equal(graph?.layout, 'graph');
  assert.deepEqual(graph?.graphSpec, { a: 1, b: -5, c: 6, roots: [2, 3], vertex: [2.5, -0.25], axisOfSymmetry: 2.5, concavity: 'up' });
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
  assert.match(simplify?.narrationText ?? '', /raíz exacta de ocho/i);
  assert.doesNotMatch(simplify?.narrationText ?? '', /dos punto ocho dos/i);
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

test('rounded irrational roots never masquerade as exact polynomial substitutions', () => {
  const problem = 'x^2 - 2x - 1 = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));
  const verification = scenes.find((scene) => scene.id === 'verification');
  const recap = scenes.find((scene) => scene.id === 'recap');
  assert.ok(verification?.visualLatex?.every((value) => value.includes('\\approx')));
  assert.ok(verification?.visualLatex?.every((value) => !value.endsWith('= 0')));
  assert.match(verification?.narrationText || '', /no necesariamente cero exacto/);
  assert.match(recap?.narrationText || '', /residuo numérico/);
  assert.ok(recap?.visualLatex?.some((value) => value.includes('\\approx')));
});

test('repeated non-terminating rational root is also a numerical approximation', () => {
  const problem = '9x^2 + 6x + 1 = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));
  const verification = scenes.find((scene) => scene.id === 'verification');
  assert.match(verification?.narrationText || '', /no necesariamente cero exacto/);
  assert.ok(verification?.visualLatex?.[0]?.includes('\\approx'));
});

test('Pizarra 2.2 recap includes general formula and 5 semantic beat phrases', () => {
  const validation = validateMathProblem('x^2 - 5x + 6 = 0');
  const scenes = buildQuadraticStoryboard('x^2 - 5x + 6 = 0', validation);
  const recap = scenes.find((scene) => scene.id === 'recap');
  assert.ok(recap);
  assert.deepEqual(recap.visualBeatPhrases, ['Recapitulamos', 'identificamos', 'calculamos', 'aplicamos', 'obtuvimos']);
  assert.equal(recap.visualLatex?.length, 6);
  assert.equal(recap.visualLatex?.[3], 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}');
  assert.deepEqual(recap.visualTextLines, ['Ecuación original', 'Coeficientes', 'Discriminante', 'Fórmula general', 'Raíces', 'Comprobado']);
});


test('incomplete mixed quadratic x^2 - 6x = 0 factors by common monomial and zero product property without discriminant', () => {
  const problem = 'x^2 - 6x = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));

  assert.deepEqual(scenes.map((s) => s.id), [
    'hook',
    'coefficients',
    'factorization',
    'zero-product-property',
    'solution-branches',
    'solution-set',
    'verification',
    'graph',
    'recap',
  ]);

  // NEVER use discriminant or general formula for incomplete mixed
  assert.equal(scenes.some((s) => s.id === 'discriminant-setup' || s.id === 'discriminant-calculate' || s.id === 'formula-symbolic'), false);
  assert.equal(scenes.some((s) => s.visualLatex?.some((l) => l.includes('\\Delta'))), false);

  const factorization = scenes.find((s) => s.id === 'factorization');
  assert.ok(factorization?.visualLatex?.includes('x(x - 6) = 0'));

  const zeroProduct = scenes.find((s) => s.id === 'zero-product-property');
  assert.ok(zeroProduct?.visualLatex?.some((l) => l.includes('A \\cdot B = 0')));
  assert.ok(zeroProduct?.visualLatex?.some((l) => l.includes('x = 0') && l.includes('x - 6 = 0')));

  const branches = scenes.find((s) => s.id === 'solution-branches');
  assert.ok(branches?.visualLatex?.includes('x_1 = 0'));
  assert.ok(branches?.visualLatex?.includes('x_2 = 6'));

  const solutionSet = scenes.find((s) => s.id === 'solution-set');
  assert.deepEqual(solutionSet?.visualLatex, ['C.S. = \\{0,\\; 6\\}']);

  const recap = scenes.find((s) => s.id === 'recap');
  assert.ok(recap?.visualLatex?.includes('C.S. = \\{0,\\; 6\\}'));
  assert.deepEqual(recap?.visualBeatPhrases, ['Recapitulamos', 'identificamos', 'factorizamos', 'aplicamos', 'obtuvimos']);
});

test('incomplete mixed no monica 3x^2 + 12x = 0 factors 3x(x + 4) = 0', () => {
  const problem = '3x^2 + 12x = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));

  const factorization = scenes.find((s) => s.id === 'factorization');
  assert.ok(factorization?.visualLatex?.includes('3x(x + 4) = 0'));

  const solutionSet = scenes.find((s) => s.id === 'solution-set');
  assert.deepEqual(solutionSet?.visualLatex, ['C.S. = \\{-4,\\; 0\\}']);
});

test('incomplete pure quadratic x^2 - 25 = 0 isolates x^2 = 25 and extracts +-5 without discriminant', () => {
  const problem = 'x^2 - 25 = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));

  assert.deepEqual(scenes.map((s) => s.id), [
    'hook',
    'coefficients',
    'transposition',
    'square-root-extraction',
    'solution-branches',
    'solution-set',
    'verification',
    'graph',
    'recap',
  ]);

  // NEVER use discriminant or general formula for incomplete pure
  assert.equal(scenes.some((s) => s.id === 'discriminant-setup' || s.id === 'discriminant-calculate' || s.id === 'formula-symbolic'), false);
  assert.equal(scenes.some((s) => s.visualLatex?.some((l) => l.includes('\\Delta'))), false);

  const transposition = scenes.find((s) => s.id === 'transposition');
  assert.ok(transposition?.visualLatex?.includes('x^2 = 25'));

  const extraction = scenes.find((s) => s.id === 'square-root-extraction');
  assert.ok(extraction?.visualLatex?.includes('x = \\pm 5'));

  const solutionSet = scenes.find((s) => s.id === 'solution-set');
  assert.deepEqual(solutionSet?.visualLatex, ['C.S. = \\{-5,\\; 5\\}']);

  const recap = scenes.find((s) => s.id === 'recap');
  assert.ok(recap?.visualLatex?.includes('C.S. = \\{-5,\\; 5\\}'));
  assert.deepEqual(recap?.visualBeatPhrases, ['Recapitulamos', 'identificamos', 'despejamos', 'extrajimos', 'obtuvimos']);
});
