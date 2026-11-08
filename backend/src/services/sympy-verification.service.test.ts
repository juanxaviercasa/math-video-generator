import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMathProblem } from './math-validation.service.js';
import { extractBoundedQuadraticCoefficients, assertSympyAgreement, verifyQuadraticSymbolically } from './sympy-verification.service.js';

const quadratic = validateMathProblem('x^2 - 5x + 6 = 0');

test('extracts only bounded numeric coefficients already validated', () => {
  assert.deepEqual(extractBoundedQuadraticCoefficients(quadratic), { a: '1', b: '-5', c: '6' });
  assert.deepEqual(extractBoundedQuadraticCoefficients(validateMathProblem('0.5x^2 + 2x - 1 = 0')),
    { a: '0.5', b: '2', c: '-1' });
  assert.throws(() => extractBoundedQuadraticCoefficients(validateMathProblem('sin(x)=1')), /SYMPY_UNSUPPORTED/);
  assert.throws(() => extractBoundedQuadraticCoefficients(validateMathProblem('1000001x^2 + 2x + 1 = 0')), /SYMPY_COEFFICIENT_RANGE/);
});

test('independent proof must match the original discriminant and both roots', () => {
  const expected = { verified: true, discriminant: '1', discriminantValue: 1,
    equationLatex: 'x^{2} - 5 x + 6 = 0', roots: [2, 3], rootsLatex: ['2', '3'], domain: 'real' };
  assert.doesNotThrow(() => assertSympyAgreement({ a: '1', b: '-5', c: '6' }, expected));
  assert.throws(() => assertSympyAgreement({ a: '1', b: '-5', c: '6' }, { ...expected, roots: [2, 4] }), /SYMPY_DISAGREEMENT/);
  assert.throws(() => assertSympyAgreement({ a: '1', b: '-5', c: '6' }, { ...expected, discriminantValue: 9 }), /SYMPY_DISAGREEMENT/);
  assert.doesNotThrow(() => assertSympyAgreement({ a: '1', b: '2', c: '5' },
    { ...expected, discriminantValue: -16, discriminant: '-16', roots: [], rootsLatex: [] }));
});

test('symbolic verification can explicitly be disabled for local development only', async () => {
  const before = process.env.SYMPY_VERIFY_MODE;
  process.env.SYMPY_VERIFY_MODE = 'off';
  try { assert.equal((await verifyQuadraticSymbolically(quadratic)).status, 'off'); }
  finally {
    if (before === undefined) delete process.env.SYMPY_VERIFY_MODE;
    else process.env.SYMPY_VERIFY_MODE = before;
  }
});
