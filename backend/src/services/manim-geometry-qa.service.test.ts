import assert from 'node:assert/strict';
import test from 'node:test';
import { projectManimBoxToPixels, validateObservedGeometry, type ManimGeometryReport } from './manim-geometry-qa.service.js';

const requirements = { width: 1280, height: 720, sceneIds: ['hook', 'solve'], expectedDurations: { hook: 5, solve: 5 } };
const sample = (x: number, y: number, width: number, height: number) => ({
  time: 2,
  objects: [{ kind: 'MathTex', content: 'x=2', bbox: { x, y, width, height } }],
});
const valid = (): ManimGeometryReport => ({
  version: 1,
  canvas: { pixelWidth: 1280, pixelHeight: 720, frameWidth: 14, frameHeight: 7.875, safeMargin: 0.63 },
  captureErrors: [],
  stages: [
    { id: 'hook', start: 0, end: 5, snapshots: [sample(-1, -0.4, 2, 1)] },
    { id: 'solve', start: 5, end: 10, snapshots: [{ ...sample(-1, -0.4, 2, 1), time: 7 }] },
  ],
});

test('projects Manim units into exact encoded pixels', () => {
  const c = valid().canvas;
  const out = projectManimBoxToPixels({ x: -7, y: -3.9375, width: 14, height: 7.875 }, c);
  assert.equal(out.x, 0);
  assert.equal(out.y, 0);
  assert.equal(out.width, 1280);
  assert.equal(out.height, 720);
});

test('accepts observed text with real margins and ordered scenes', () => {
  const result = validateObservedGeometry(valid(), requirements);
  assert.equal(result.passed, true);
  assert.deepEqual(result.stages.map((stage) => stage.id), ['hook', 'solve']);
  assert.ok((result.stages[0].minMarginPixels ?? 0) > 20);
});

test('rejects actual clipped text instead of trusting estimated layout', () => {
  const report = valid();
  report.stages[0].snapshots[0].objects[0].bbox.x = -6.8;
  const result = validateObservedGeometry(report, requirements);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes('GEOMETRY_CLIPPING')));
});

test('rejects simultaneous overlapping formula blocks', () => {
  const report = valid();
  report.stages[0].snapshots[0].objects.push({
    kind: 'Text', content: 'Colisión', bbox: { x: -0.5, y: -0.2, width: 2, height: 1 },
  });
  const result = validateObservedGeometry(report, requirements);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes('GEOMETRY_COLLISION')));
});

test('rejects missing scenes, blank measurement and mismatched canvas', () => {
  const report = valid();
  report.stages.pop();
  report.stages[0].snapshots = [];
  const result = validateObservedGeometry(report, requirements);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes('GEOMETRY_SCENES')));
  assert.ok(result.errors.some((error) => error.includes('GEOMETRY_EMPTY')));
  report.canvas.pixelWidth = 1920;
  assert.ok(validateObservedGeometry(report, requirements).errors.some((error) => error.includes('GEOMETRY_CANVAS')));
});

test('reports narration timing drift and malformed capture metadata', () => {
  const report = valid();
  report.stages[0].end = 8;
  report.stages[1].start = 8;
  report.stages[1].end = 13;
  report.captureErrors.push('cannot read object bounds');
  const result = validateObservedGeometry(report, requirements);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes('GEOMETRY_CAPTURE')));
  assert.ok(result.warnings.some((warning) => warning.includes('GEOMETRY_SYNC')));
});
