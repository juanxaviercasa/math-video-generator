import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { buildAdaptiveManimHelpers, selectProblemAnchor } from './adaptive-math-layout.service.js';
import { getVideoFormatProfile } from './video-format.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { validateMathProblem } from './math-validation.service.js';
import { manim } from './manim.service.js';

const exercise = 'x^2 - 5x + 6 = 0';
const scenes = buildQuadraticStoryboard(exercise, validateMathProblem(exercise));

test('selects exactly the original exercise, not the changing discriminant', () => {
  assert.equal(selectProblemAnchor({ content: exercise, pedagogicalScenes: scenes }), exercise);
  assert.equal(selectProblemAnchor({ content: exercise, pedagogicalScenes: [scenes[3]] }), exercise);
  assert.equal(selectProblemAnchor({ content: 'unverified prose' }), null);
  assert.equal(selectProblemAnchor({ content: 'x^2 = \\input{secret}' }), null);
});

test('measures actual LaTeX boxes and divides long derivations into focused steps', () => {
  for (const ratio of ['16:9', '1:1', '9:16'] as const) {
    const code = buildAdaptiveManimHelpers(getVideoFormatProfile(ratio, 'high'));
    assert.match(code, /def _create_problem_anchor/);
    assert.match(code, /def _work_bounds/);
    assert.match(code, /def _arrange_equation_stages/);
    assert.match(code, /stages\.arrange\(DOWN, aligned_edge=LEFT/);
    assert.match(code, /if factor >= 0\.78/);
    assert.match(code, /LAYOUT_UNREADABLE/);
    assert.doesNotMatch(code, /@@FRAMEHEIGHT@@|@@CONTENTWIDTH@@/);
  }
});

test('stable renderer never removes original problem during calculation or recap', () => {
  const script = manim.generatePythonScript({
    title: 'Persistent board',
    content: exercise,
    steps: [],
    outputDir: '/tmp',
    pedagogicalScenes: scenes,
    formatProfile: getVideoFormatProfile('16:9', 'high'),
  }, true);
  assert.match(script, /self\._create_problem_anchor\("x\^2 - 5x \+ 6 = 0"\)/);
  assert.match(script, /focus_3 = self\._arrange_equation_stages\(content_3\)/);
  assert.match(script, /content_3 = VGroup\(VGroup\(/);
  assert.match(script, /self\._fit_work\(pair, max_upscale=1\.65, min_scale=0\.70\)/);
  assert.match(script, /LAYOUT_RECAP_UNREADABLE/);
  assert.match(script, /for pair in content_10:/);
  assert.doesNotMatch(script, /self\._fit_work\(content_10,/);
  assert.doesNotMatch(script, /FadeOut\(.*problem_anchor/);
  assert.doesNotMatch(script, /\.arrange\(RIGHT, buff=0\.28/);
  // Python parser is independent of Manim/LaTeX availability.
  const command = process.platform === 'win32' ? 'py' : 'python3';
  const args = process.platform === 'win32' ? ['-3', '-c', 'import ast,sys; ast.parse(sys.stdin.read())'] : ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'];
  execFileSync(command, args, { input: script, encoding: 'utf8', timeout: 10000 });
});

test('prioritizes original math over decorative caption and measures pixel legibility', () => {
  for (const ratio of ['16:9', '1:1', '9:16'] as const) {
    const code = buildAdaptiveManimHelpers(getVideoFormatProfile(ratio, 'high'));
    assert.match(code, /decorated_scale/);
    assert.match(code, /group = VGroup\(formula\)/);
    assert.match(code, /formula\.height \* factor \* pixels_per_unit < min_pixels/);
    assert.match(code, /readable_together = all\(/);
    assert.match(code, /LAYOUT_STAGE_UNREADABLE/);
  }
});

test('focused stages can enlarge real formula glyphs before declaring layout unreadable', () => {
  for (const ratio of ['16:9', '1:1', '9:16'] as const) {
    const helper = buildAdaptiveManimHelpers(getVideoFormatProfile(ratio, 'high'));
    assert.match(helper, /required_scale = min_formula_pixels/);
    assert.match(helper, /max_upscale=max\(1\.14, min\(2\.60, required_scale \* 1\.02\)\)/);
    assert.match(helper, /stage\[1\]\.height \* pixel_ratio < min_formula_pixels/);
  }
});
