import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMathProblem } from './math-validation.service.js';
import { buildMathematicalSolutionStructure } from './math-ast.service.js';

test('builds a deterministic quadratic AST with entities and transformations', () => {
  const validation = validateMathProblem('x^2 - 5x + 6 = 0');
  const first = buildMathematicalSolutionStructure('x^2 - 5x + 6 = 0', validation);
  const second = buildMathematicalSolutionStructure('x^2 - 5x + 6 = 0', validation);

  assert.equal(first.supported, true);
  assert.equal(first.problemId, second.problemId);
  assert.equal(first.parserVersion, 'quadratic-ast-v1');
  assert.deepEqual(first.entities.a, { kind: 'number', value: 1, display: '1' });
  assert.deepEqual(first.entities.b, { kind: 'number', value: -5, display: '-5' });
  assert.equal(first.steps.map((step) => step.operation).join(','), 'identify,substitute,multiply,solve,verify');
  assert.equal(first.charts[0]?.type, 'parabola');
});

test('returns an explicit unsupported structure instead of inventing a solution', () => {
  const validation = validateMathProblem('integral de x^2');
  const structure = buildMathematicalSolutionStructure('integral de x^2', validation);
  assert.equal(structure.supported, false);
  assert.equal(structure.steps.length, 0);
  assert.equal(structure.charts.length, 0);
  assert.ok(structure.warnings.length > 0);
});
