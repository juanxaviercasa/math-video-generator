import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMathProblem } from './math-validation.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { getVideoFormatProfile } from './video-format.service.js';
import { manim } from './manim.service.js';

test('graph uses measured safe bottom instead of to_edge default camera and square x label is readable', () => {
  const problem = 'x^2 - 5x + 6 = 0';
  const graph = buildQuadraticStoryboard(problem, validateMathProblem(problem)).find((scene) => scene.id === 'graph');
  assert.ok(graph);
  for (const ratio of ['16:9', '1:1', '9:16'] as const) {
    const script = manim.generatePythonScript({
      title: 'measured graph labels', content: problem, steps: [], outputDir: '/tmp',
      pedagogicalScenes: [graph], formatProfile: getVideoFormatProfile(ratio, 'low'),
    }, true);
    const expectedXSize = ratio === '1:1' ? 62 : 50;
    assert.ok(script.includes(`get_x_axis_label(MathTex("x", font_size=${expectedXSize}))`));
    assert.match(script, /concavity_lbl_0 = Text\([^\n]*\)\.move_to\(UP \* self\._work_bounds\(\)\["bottom"\]\)/);
    assert.doesNotMatch(script, /concavity_lbl_0 = .*\.to_edge\(DOWN/);
    assert.match(script, /root_2_label_0 = MathTex/);
  }
});
