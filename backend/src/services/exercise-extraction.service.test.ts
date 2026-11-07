import assert from 'node:assert/strict';
import test from 'node:test';
import { parseExerciseVisionResult, verifyExerciseSource, validatePdfPage, ExerciseExtractionError } from './exercise-extraction.service.js';

const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from('fake')]);

test('accepts signature-verified image input', () => {
  assert.equal(verifyExerciseSource(png, 'image/png'), 'image/png');
  assert.equal(verifyExerciseSource(Buffer.from('%PDF-1.6'), 'application/pdf'), 'application/pdf');
});

test('rejects spoofed MIME and oversized images', () => {
  assert.throws(() => verifyExerciseSource(png, 'application/pdf'), /contenido no corresponde/);
  assert.throws(() => verifyExerciseSource(Buffer.alloc(10 * 1024 * 1024 + 1), 'image/png'), /hasta 10 MB/);
  assert.throws(() => verifyExerciseSource(png, 'text/html'), ExerciseExtractionError);
});

test('rejects nonexistent and invalid PDF page selections', () => {
  assert.equal(validatePdfPage(undefined), 1);
  assert.equal(validatePdfPage('12'), 12);
  for (const value of [0, 51, 1.5, 'nan', -1]) {
    assert.throws(() => validatePdfPage(value), /página de PDF/);
  }
});

test('recognizes a handwritten-style solved quadratic but does not trust solution steps', () => {
  const read = parseExerciseVisionResult(JSON.stringify({
    problem: 'x² - 5x + 6 = 0',
    observedSolutionSteps: ['x = 100', 'x = 200'],
    confidence: 'high', warnings: [],
  }), 'image/png');
  assert.equal(read.validation.supported, true);
  assert.equal(read.validation.result, 'x₁ = 3, x₂ = 2');
  assert.deepEqual(read.observedSolutionSteps, ['x = 100', 'x = 200']);
  assert.equal(read.requiresConfirmation, true);
  assert.ok(read.warnings.some((warning) => /no sustituyen/i.test(warning)));
});

test('does not advertise a solver for an unsupported image problem', () => {
  const read = parseExerciseVisionResult(`\x60\x60\x60json
{"problem":"\\\\int x^2 dx","confidence":"medium","observedSolutionSteps":[],"warnings":[]}
\x60\x60\x60`, 'application/pdf');
  assert.equal(read.validation.supported, false);
  assert.ok(read.warnings.some((warning) => /solver determinista/i.test(warning)));
});

test('rejects unreadable or non-JSON vision output', () => {
  assert.throws(() => parseExerciseVisionResult('bad', 'image/png'), /transcripción estructurada/);
  assert.throws(() => parseExerciseVisionResult('{"problem":"?","confidence":"low"}', 'image/png'), /suficiente claridad/);
});
