import assert from 'node:assert/strict';
import test from 'node:test';
import { getVideoFormatProfile } from './video-format.service.js';
import { createMathDesignTokens, createPresentationCanvas } from './presentation-design.service.js';
import { fitFormula, resolveSceneLayout } from './presentation-layout.service.js';
import type { VisualSceneSpec } from './presentation.types.js';

const fixtures = [
  ['equation-short', 'x + 2 = 5'],
  ['equation-long', 'x = (-b ± √(b² - 4ac)) / (2a)'],
  ['system', 'x + y = 10\\ny - x = 2'],
  ['fractions', '\\frac{3}{4} + \\frac{5}{6} = \\frac{19}{12}'],
  ['roots', '\\sqrt{x + 4} = 6'],
  ['matrices', '\\begin{bmatrix}1 & 2\\3 & 4\\end{bmatrix}'],
  ['derivatives', '\\frac{d}{dx}(x^3 + 2x) = 3x^2 + 2'],
  ['integrals', '\\int_0^1 x^2 dx = \\frac{1}{3}'],
  ['geometry', 'A = \\frac{b \\cdot h}{2}'],
  ['graph', 'y = x^2 - 5x + 6'],
  ['multiple-steps', 'Paso 1: sustituir\\nPaso 2: operar\\nPaso 3: comprobar'],
] as const;

for (const [id, formula] of fixtures) {
  test(`layout fixture: ${id}`, () => {
    const profile = getVideoFormatProfile(id === 'graph' ? '1:1' : '16:9', 'low');
    const canvas = createPresentationCanvas(profile);
    const scene: VisualSceneSpec = {
      id,
      purpose: id === 'graph' ? 'verify' : 'operate',
      canvas: profile,
      safeArea: canvas.safeArea,
      layout: id === 'graph' ? 'chart-explanation' : 'formula-derivation',
      blocks: [{ id: `${id}-block`, semanticRole: id === 'graph' ? 'chart' : 'operation', content: formula, styleToken: 'active', priority: 'primary', alignment: 'center', preferredLayout: 'formula-derivation', canSplit: true, minReadableSize: 0.48 }],
      duration: { min: 4, max: 8, source: 'fixed', seconds: 6 },
      transition: { enter: 'write', exit: 'fade' },
      constraints: ['SAFE_FRAME', 'NO_OVERLAP'],
    };
    const resolved = resolveSceneLayout(scene, canvas, createMathDesignTokens(profile));
    assert.equal(resolved.blocks.length, 1);
    const box = resolved.blocks[0]?.resolved?.bbox;
    assert.ok(box);
    assert.ok(box.x >= canvas.safeArea.x - 0.001);
    assert.ok(box.y >= canvas.safeArea.y - 0.001);
    assert.ok(box.x + box.width <= canvas.safeArea.x + canvas.safeArea.width + 0.001);
    assert.ok(box.y + box.height <= canvas.safeArea.y + canvas.safeArea.height + 0.001);
    const fitting = fitFormula(formula, canvas.safeArea.width, canvas.safeArea.height, createMathDesignTokens(profile));
    assert.ok(fitting.scale > 0);
  });
}
