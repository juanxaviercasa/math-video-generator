import assert from 'node:assert/strict';
import test from 'node:test';
import { isRecoverableVisualFailure, renderWithBoundedVisualRecovery, type VisualRecoveryAttempt } from './visual-render-recovery.service.js';

test('retries a geometry collision exactly once using formula-first layout', async () => {
  const attempts: VisualRecoveryAttempt[] = [];
  const result = await renderWithBoundedVisualRecovery(async (pass) => {
    if (pass === 'standard') throw new Error('VISUAL_QA_FAILED: GEOMETRY_COLLISION: formula overlap');
    return 'repaired.mp4';
  }, attempts);
  assert.equal(result, 'repaired.mp4');
  assert.deepEqual(attempts.map((item) => [item.pass, item.status]), [
    ['standard', 'failed'], ['formula-first', 'passed'],
  ]);
});

test('never retries invalid math, missing infrastructure or voice drift', async () => {
  for (const code of ['SYMPY_DISAGREEMENT', 'VOICE_CUE_DRIFT', 'GEOMETRY_ANCHOR_MISSING', 'MANIM_UNAVAILABLE']) {
    const attempts: VisualRecoveryAttempt[] = [];
    await assert.rejects(
      renderWithBoundedVisualRecovery(async () => { throw new Error(code); }, attempts),
      new RegExp(code),
    );
    assert.equal(attempts.length, 1);
    assert.equal(isRecoverableVisualFailure(new Error(code)), false);
  }
});

test('fails after two unsuccessful visual passes, never loops indefinitely', async () => {
  const attempts: VisualRecoveryAttempt[] = [];
  await assert.rejects(
    renderWithBoundedVisualRecovery(async () => { throw new Error('LAYOUT_STAGE_UNREADABLE'); }, attempts),
    /LAYOUT_STAGE_UNREADABLE/,
  );
  assert.equal(attempts.length, 2);
});
