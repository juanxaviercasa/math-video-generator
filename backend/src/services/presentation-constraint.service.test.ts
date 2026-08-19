import assert from 'node:assert/strict';
import test from 'node:test';
import { getVideoFormatProfile } from './video-format.service.js';
import { createMathDesignTokens, createPresentationCanvas } from './presentation-design.service.js';
import { validateSceneConstraints } from './presentation-constraint.service.js';
import type { VisualSceneSpec } from './presentation.types.js';

test('detects collision and overflow as critical errors', () => {
  const profile = getVideoFormatProfile('16:9', 'low');
  const canvas = createPresentationCanvas(profile);
  const scene: VisualSceneSpec = {
    id: 'constraint-test',
    purpose: 'operate',
    canvas: profile,
    safeArea: canvas.safeArea,
    layout: 'overlay',
    blocks: [
      { id: 'first', semanticRole: 'operation', content: 'Δ = 25', styleToken: 'active', priority: 'primary', alignment: 'center', preferredLayout: 'vertical-stack', canSplit: false, minReadableSize: 0.56, resolved: { bbox: { x: canvas.safeArea.x, y: canvas.safeArea.y, width: 4, height: 1 }, scale: 1, visibleFrom: 0, visibleUntil: 5 } },
      { id: 'second', semanticRole: 'result', content: 'Δ = 1', styleToken: 'result', priority: 'primary', alignment: 'center', preferredLayout: 'vertical-stack', canSplit: false, minReadableSize: 0.56, resolved: { bbox: { x: canvas.safeArea.x + 1, y: canvas.safeArea.y, width: 4, height: 1 }, scale: 1, visibleFrom: 0, visibleUntil: 5 } },
      { id: 'overflow', semanticRole: 'caption', content: 'fuera', styleToken: 'caption', priority: 'tertiary', alignment: 'center', preferredLayout: 'bottom', canSplit: false, minReadableSize: 0.42, resolved: { bbox: { x: canvas.safeArea.x + canvas.safeArea.width - 0.2, y: canvas.safeArea.y, width: 2, height: 1 }, scale: 1, visibleFrom: 0, visibleUntil: 5 } },
    ],
    duration: { min: 4, max: 6, source: 'fixed', seconds: 5 },
    transition: { enter: 'fade', exit: 'fade' },
    constraints: ['SAFE_FRAME', 'NO_OVERLAP'],
  };
  const result = validateSceneConstraints(scene, canvas, createMathDesignTokens(profile));
  assert.ok(result.constraints.some((constraint) => constraint.code === 'SAFE_FRAME' && !constraint.passed));
  assert.ok(result.constraints.some((constraint) => constraint.code === 'NO_OVERLAP' && !constraint.passed));
  assert.equal(result.score.critical, true);
  assert.ok(result.score.total < 100);
});

test('accepts a contained chart block', () => {
  const profile = getVideoFormatProfile('1:1', 'low');
  const canvas = createPresentationCanvas(profile);
  const scene: VisualSceneSpec = {
    id: 'chart-test',
    purpose: 'verify',
    canvas: profile,
    safeArea: canvas.safeArea,
    layout: 'chart-explanation',
    blocks: [{ id: 'chart', semanticRole: 'chart', content: 'parabola', styleToken: 'chart', priority: 'primary', alignment: 'center', preferredLayout: 'chart-explanation', canSplit: false, minReadableSize: 0.56, resolved: { bbox: { x: canvas.safeArea.x + 0.2, y: canvas.safeArea.y + 0.2, width: canvas.safeArea.width - 0.4, height: canvas.safeArea.height - 0.4 }, scale: 1, visibleFrom: 0, visibleUntil: 5 } }],
    duration: { min: 4, max: 6, source: 'fixed', seconds: 5 },
    transition: { enter: 'create', exit: 'fade' },
    constraints: ['CHART_CONTAINMENT'],
  };
  const result = validateSceneConstraints(scene, canvas, createMathDesignTokens(profile));
  assert.equal(result.constraints.find((constraint) => constraint.code === 'CHART_CONTAINMENT')?.passed, true);
  assert.equal(result.score.critical, false);
});
