import assert from 'node:assert/strict';
import test from 'node:test';
import { cardinalSpanish, prepareSpanishMathNarration } from './spanish-math-speech.service.js';
import { synchronization } from './synchronization.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { validateMathProblem } from './math-validation.service.js';

test('Spanish cardinal pronunciation never reads a multi-digit coefficient digit by digit', () => {
  const examples: Array<[number, string]> = [
    [0, 'cero'], [2, 'dos'], [12, 'doce'], [15, 'quince'],
    [20, 'veinte'], [21, 'veintiuno'], [25, 'veinticinco'], [32, 'treinta y dos'],
    [100, 'cien'], [101, 'ciento uno'], [112, 'ciento doce'],
    [1000, 'mil'], [1012, 'mil doce'], [2012, 'dos mil doce'],
    [1000000, 'un millón'],
  ];
  for (const [value, expected] of examples) {
    assert.equal(cardinalSpanish(value), expected, String(value));
  }
  assert.throws(() => cardinalSpanish(Infinity), /SPEECH_NUMBER_UNSUPPORTED/);
});

test('speak a quadratic as equis al cuadrado menos siete equis mas doce', () => {
  const spoken = synchronization.oralizeMath('x^2 - 7x + 12 = 0');
  assert.equal(spoken, 'equis al cuadrado menos siete equis más doce igual a cero');
  assert.doesNotMatch(spoken, /uno dos|\b12\b|elevado a la potencia dos/);
  assert.equal(synchronization.oralizeMath('x² + 5x + 6 = 0'),
    'equis al cuadrado más cinco equis más seis igual a cero');
});

test('prepare TTS narration clarifies be labial and is idempotent', () => {
  const original = 'A es 1, B es -7 y c es 12. Reemplazamos b por 12 en x^2.';
  const spoken = prepareSpanishMathNarration(original);
  assert.match(spoken, /A es uno, be labial es menos siete y ce es doce/);
  assert.match(spoken, /Reemplazamos be labial por doce en equis al cuadrado/);
  assert.equal(prepareSpanishMathNarration(spoken), spoken);
  assert.doesNotMatch(spoken, /\b(?:12|b|be)\b(?!\s+labial\b)/i);
});

test('decimal coefficients keep fraction digits, including leading zeros', () => {
  assert.equal(prepareSpanishMathNarration('0.25, 2.5 y 3.005'),
    'cero coma dos cinco, dos coma cinco y tres coma cero cero cinco');
});

test('all eight pilot equations use correct spoken cardinals and disambiguated coefficients', () => {
  const problems = [
    'x^2 - 7x + 12 = 0',
    'x^2 + 5x + 6 = 0',
    '2x^2 - 7x + 3 = 0',
    'x^2 - 2x + 1 = 0',
    'x^2 - 2x - 1 = 0',
    'x^2 + 2x + 5 = 0',
    '-x^2 + 5x - 6 = 0',
    'x^2 + 3x - 10 = 0',
  ];
  for (const problem of problems) {
    const validation = validateMathProblem(problem);
    assert.ok(validation.supported && validation.valid, problem);
    const storyboard = buildQuadraticStoryboard(problem, validation);
    assert.ok(storyboard.length >= 4, problem);
    const narrations = storyboard.flatMap((scene) => [
      scene.narrationText, ...(scene.visualStages || []).map((stage) => stage.voiceText || '').filter(Boolean),
    ]);
    assert.ok(narrations.length > 2, problem);
    for (const spoken of narrations) {
      assert.doesNotMatch(spoken, /\b\d+\b/, problem + ' ' + spoken);
      assert.doesNotMatch(spoken, /\b(?:b|be)\b(?!\s+labial\b)/i, problem + ' ' + spoken);
    }
    const coeff = storyboard.find((scene) => scene.id === 'coefficients');
    assert.ok(coeff);
    assert.match(coeff.narrationText, /be labial es/i);
    assert.ok(coeff.visualBeatPhrases?.includes('be labial es'));
  }
});
