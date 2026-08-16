import assert from 'node:assert/strict';
import test from 'node:test';
import { getVideoFormatProfile } from './video-format.service.js';
import { createMathDesignTokens, createPresentationCanvas } from './presentation-design.service.js';
import { fitFormula, resolveSceneLayout } from './presentation-layout.service.js';
import type { VisualSceneSpec } from './presentation.types.js';

const scene = (layout: VisualSceneSpec['layout'], content: string): VisualSceneSpec => {
  const profile = getVideoFormatProfile('16:9', 'low');
  const canvas = createPresentationCanvas(profile);
  return {
    id: 'layout-test',
    purpose: 'operate',
    canvas: profile,
    safeArea: canvas.safeArea,
    layout,
    blocks: [{ id: 'formula', semanticRole: 'operation', content, styleToken: 'active', priority: 'primary', alignment: 'center', preferredLayout: layout, canSplit: true, minReadableSize: 0.56 }],
    duration: { min: 4, max: 8, source: 'fixed', seconds: 6 },
    transition: { enter: 'write', exit: 'fade' },
    constraints: ['SAFE_FRAME'],
  };
};

test('fits a short formula at normal scale', () => {
  const profile = getVideoFormatProfile('16:9', 'low');
  const result = fitFormula('Δ = 1', profile.contentWidth, profile.contentHeight, createMathDesignTokens(profile));
  assert.equal(result.mode, 'normal');
  assert.equal(result.scale, 1);
});

test('uses structural wrapping or split instead of unreadable shrinking', () => {
  const profile = getVideoFormatProfile('1:1', 'low');
  const result = fitFormula('x = (-b ± √Δ) / (2a) y además comprobamos cada raíz', profile.contentWidth / 3, profile.contentHeight / 4, createMathDesignTokens(profile));
  assert.ok(['wrapped', 'split-scene'].includes(result.mode));
  assert.ok(result.scale >= 0.48);
});

test('resolves equation blocks inside the safe frame', () => {
  const profile = getVideoFormatProfile('9:16', 'low');
  const canvas = createPresentationCanvas(profile);
  const tokens = createMathDesignTokens(profile);
  const resolved = resolveSceneLayout(scene('equation-block', 'x = (-5 ± √1) / (2(1))'), canvas, tokens);
  const block = resolved.blocks[0]?.resolved?.bbox;
  assert.ok(block);
  assert.ok(block.x >= canvas.safeArea.x);
  assert.ok(block.y >= canvas.safeArea.y);
  assert.ok(block.x + block.width <= canvas.safeArea.x + canvas.safeArea.width);
  assert.ok(block.y + block.height <= canvas.safeArea.y + canvas.safeArea.height);
});
