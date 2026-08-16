import assert from 'node:assert/strict';
import test from 'node:test';
import { createPresentationCanvas } from './presentation-design.service.js';
import { getVideoFormatProfile } from './video-format.service.js';
import { constraintToIssue, geometryIssues } from './visual-qa.service.js';
import type { ConstraintResult, VisualSceneSpec } from './presentation.types.js';

test('converts a failed constraint into actionable structured feedback', () => {
  const constraint: ConstraintResult = {
    code: 'SAFE_FRAME',
    passed: false,
    severity: 'error',
    message: 'El bloque desborda el área segura.',
    blockIds: ['equation-E7'],
    details: { width: 8.2, expectedWidth: 6.9 },
  };
  const issue = constraintToIssue('scene-discriminant', constraint);
  assert.ok(issue);
  assert.equal(issue?.type, 'overflow');
  assert.equal(issue?.severity, 'error');
  assert.equal(issue?.scene, 'scene-discriminant');
  assert.equal(issue?.element, 'equation-E7');
  assert.match(issue?.suggestedRepair || '', /Reduce scale|move/i);
  assert.match(issue?.reason || '', /safe area|clipped/i);
});

test('detects excessive empty space and hierarchy inversion', () => {
  const profile = getVideoFormatProfile('16:9', 'low');
  const canvas = createPresentationCanvas(profile);
  const scene: VisualSceneSpec = {
    id: 'objective-scene',
    purpose: 'operate',
    canvas: profile,
    safeArea: canvas.safeArea,
    layout: 'center',
    blocks: [
      { id: 'primary', semanticRole: 'operation', content: 'Δ = 1', styleToken: 'active', priority: 'primary', alignment: 'center', preferredLayout: 'center', canSplit: false, minReadableSize: 0.56, resolved: { bbox: { x: -0.3, y: -0.2, width: 0.6, height: 0.3 }, scale: 0.56, visibleFrom: 0, visibleUntil: 5 } },
      { id: 'secondary', semanticRole: 'caption', content: 'Explicación larga', styleToken: 'caption', priority: 'secondary', alignment: 'center', preferredLayout: 'bottom', canSplit: false, minReadableSize: 0.42, resolved: { bbox: { x: -0.5, y: 0.3, width: 1, height: 0.5 }, scale: 0.8, visibleFrom: 0, visibleUntil: 5 } },
    ],
    duration: { min: 4, max: 6, source: 'fixed', seconds: 5 },
    transition: { enter: 'fade', exit: 'fade' },
    constraints: [],
  };
  const issues = geometryIssues(scene, canvas.safeArea);
  assert.ok(issues.some((issue) => issue.type === 'excessive-empty-space'));
  assert.ok(issues.some((issue) => issue.type === 'hierarchy-scale'));
  assert.ok(issues.every((issue) => issue.suggestedRepair.length > 20));
});
