import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMathProblem } from './math-validation.service.js';

test('verifies the roots of a quadratic equation', () => {
  const result = validateMathProblem('x^2 - 5x + 6 = 0');

  assert.equal(result.supported, true);
  assert.equal(result.valid, true);
  assert.equal(result.result, 'x₁ = 3, x₂ = 2');
  assert.match(result.steps.at(-1) || '', /x₁ = 3/);
});

test('identifies a quadratic without real roots', () => {
  const result = validateMathProblem('x^2 + 2x + 5 = 0');

  assert.equal(result.supported, true);
  assert.equal(result.valid, true);
  assert.equal(result.result, 'No hay soluciones reales');
});

test('does not pretend to validate unsupported problems', () => {
  const result = validateMathProblem('sin(x) = 1');

  assert.equal(result.supported, false);
  assert.equal(result.valid, false);
  assert.equal(result.steps.length, 0);
  assert.ok(result.warnings.length > 0);
});

test('rejects a zero quadratic coefficient', () => {
  const result = validateMathProblem('0x^2 + 2x + 1 = 0');

  assert.equal(result.supported, true);
  assert.equal(result.valid, false);
});
