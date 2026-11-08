import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { buildAdaptiveManimHelpers, selectProblemAnchor } from './adaptive-math-layout.service.js';
import { getMinimumReadablePixels } from './manim-geometry-qa.service.js';
import { getVideoFormatProfile } from './video-format.service.js';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { validateMathProblem } from './math-validation.service.js';
import { manim } from './manim.service.js';

const exercise = 'x^2 - 5x + 6 = 0';
const scenes = buildQuadraticStoryboard(exercise, validateMathProblem(exercise));

const runPython = (script: string, stdin?: string): string => {
  const candidates: Array<[string, string[]]> = process.platform === 'win32'
    ? [['python', ['-c', script]], ['py', ['-3', '-c', script]], ['python3', ['-c', script]]]
    : [['python3', ['-c', script]], ['python', ['-c', script]]];
  let lastError: unknown;
  for (const [command, args] of candidates) {
    try {
      return execFileSync(command, args, { input: stdin, encoding: 'utf8', timeout: 10000 });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      const status = (error as { status?: number })?.status;
      if (code === 'ENOENT' || status === 9009) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

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
    assert.match(code, /def _arrange_card_pairs/);
    assert.match(code, /def _fit_recap_pair/);
    assert.match(code, /def _sanitize_graph_labels/);
    assert.match(code, /stages\.arrange\(DOWN, aligned_edge=LEFT/);
    assert.match(code, /if factor >= 0\.78/);
    assert.match(code, /LAYOUT_UNREADABLE/);
    assert.doesNotMatch(code, /@@FRAMEHEIGHT@@|@@CONTENTWIDTH@@|@@MINFORMULAPX@@|@@MINANCHORPX@@/);
  }
});

test('stable renderer never removes original problem during calculation or recap and parses valid Python', () => {
  for (const problem of ['x^2 - 5x + 6 = 0', 'x^2 - 2x - 1 = 0', 'x^2 - 2x + 1 = 0', 'x^2 + 2x + 5 = 0']) {
    const problemScenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));
    for (const ratio of ['16:9', '1:1', '9:16'] as const) {
      const script = manim.generatePythonScript({
        title: 'Persistent board',
        content: problem,
        steps: [],
        outputDir: '/tmp',
        pedagogicalScenes: problemScenes,
        formatProfile: getVideoFormatProfile(ratio, 'low'),
      }, true);
      assert.match(script, /self\._create_problem_anchor\(/);
      assert.doesNotMatch(script, /FadeOut\(.*problem_anchor/);
      runPython('import ast, sys; ast.parse(sys.stdin.read())', script);
    }
  }

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
  assert.match(script, /self\._fit_recap_pair\(pair\)/);
  assert.match(script, /LAYOUT_RECAP_UNREADABLE/);
  assert.match(script, /for pair in content_10\[:-2\]:/);
  assert.doesNotMatch(script, /self\._fit_work\(content_10,/);
  assert.doesNotMatch(script, /\.arrange\(RIGHT, buff=0\.28/);
});

test('compositor uses exact same minimum readability pixel thresholds as geometry QA', () => {
  for (const quality of ['low', 'medium', 'high'] as const) {
    for (const ratio of ['16:9', '1:1', '9:16'] as const) {
      const profile = getVideoFormatProfile(ratio, quality);
      const code = buildAdaptiveManimHelpers(profile);
      const expectedFormulaMin = getMinimumReadablePixels('math-primary', 'MathTex', profile.height);
      const expectedAnchorMin = getMinimumReadablePixels('problem-anchor', 'MathTex', profile.height);

      const formulaMatch = code.match(/min_formula_pixels = ([0-9.]+)/);
      const anchorMatch = code.match(/min_pixels = ([0-9.]+)/);
      assert.ok(formulaMatch, `Missing min_formula_pixels for ${ratio} ${quality}`);
      assert.ok(anchorMatch, `Missing min_pixels for ${ratio} ${quality}`);
      assert.ok(Number(formulaMatch[1]) >= expectedFormulaMin,
        `Compositor formula floor ${formulaMatch[1]} < QA floor ${expectedFormulaMin} for ${ratio} ${quality}`);
      assert.ok(Number(anchorMatch[1]) >= expectedAnchorMin,
        `Compositor anchor floor ${anchorMatch[1]} < QA floor ${expectedAnchorMin} for ${ratio} ${quality}`);
      assert.ok(Number(formulaMatch[1]) >= 27);
    }
  }
});

test('prioritizes original math over decorative caption and measures pixel legibility', () => {
  for (const ratio of ['16:9', '1:1', '9:16'] as const) {
    const code = buildAdaptiveManimHelpers(getVideoFormatProfile(ratio, 'high'));
    assert.match(code, /decorated_scale/);
    assert.match(code, /group = VGroup\(formula\)/);
    assert.match(code, /decorated_scale \* pixels_per_unit >= min_pixels/);
    assert.match(code, /readable_together = all\(/);
    assert.match(code, /LAYOUT_STAGE_UNREADABLE/);
  }
});

test('focused stages enlarge and coherently wrap real formulas before declaring layout unreadable', () => {
  for (const ratio of ['16:9', '1:1', '9:16'] as const) {
    const helper = buildAdaptiveManimHelpers(getVideoFormatProfile(ratio, 'low'));
    assert.match(helper, /required_scale = min_formula_pixels/);
    assert.match(helper, /max_upscale=max\(1\.14, min\(2\.80, required_scale \* 1\.05\)\)/);
    assert.match(helper, /_math_min_height\(stage\[1\]\) \* pixel_ratio < min_formula_pixels/);
    assert.match(helper, /ReplacementTransform\(previous\[1\]\.copy\(\), current\[1\]\)/);
  }
});

test('coherent LaTeX splitter breaks chained equalities and text labels without splitting inside braces', () => {
  const helper = buildAdaptiveManimHelpers(getVideoFormatProfile('9:16', 'low'));
  const probe = `
WHITE = "#FFFFFF"
class Dummy:
${helper}

d = Dummy()
import json
out = {
  "verify": d._split_latex_candidates("(3)^2 - 5(3) + 6 = 9 - 15 + 6 = 0"),
  "approx": d._split_latex_candidates(r"P(2.414) \\approx -0.000604"),
  "coeffs": d._split_latex_candidates(r"a = 1,\\; b = -5,\\; c = 6"),
  "recap_num": d._split_latex_candidates(r"\\text{Comprobación numérica: } P(x) \\approx 0"),
  "irrational_branch": d._split_latex_candidates(r"x_1 = \\frac{2 + \\sqrt{8}}{2} \\approx 2.414"),
}
print(json.dumps(out))
`;
  const parsed = JSON.parse(runPython(probe)) as Record<string, string[][]>;
  assert.ok(parsed.verify.some((c) => c[0] === '(3)^2 - 5(3) + 6' && c[1] === '= 9 - 15 + 6 = 0'));
  assert.ok(parsed.approx.some((c) => c[0] === 'P(2.414)' && c[1] === '\\approx -0.000604'));
  assert.ok(parsed.coeffs.some((c) => c.length === 3 && c[0] === 'a = 1' && c[2] === 'c = 6'));
  assert.ok(parsed.recap_num.some((c) => c[0].startsWith('\\text{') && c[1] === 'P(x) \\approx 0'));
  assert.ok(parsed.irrational_branch.some((c) => c[0] === 'x_1 = \\frac{2 + \\sqrt{8}}{2}' && c[1] === '\\approx 2.414'));
});

test('pedagogical render reveals mathematical steps, graph landmarks and ends with a persistent answer', () => {
  const supported = [
    'x^2 - 5x + 6 = 0',
    'x^2 - 2x - 1 = 0',
    'x^2 - 2x + 1 = 0',
    'x^2 + 2x + 5 = 0',
  ];
  for (const problem of supported) {
    const storyboard = buildQuadraticStoryboard(problem, validateMathProblem(problem));
    for (const aspectRatio of ['16:9', '1:1', '9:16'] as const) {
      const python = manim.generatePythonScript({
        title: 'Active math blackboard',
        content: problem,
        steps: [],
        outputDir: '/tmp',
        pedagogicalScenes: storyboard,
        formatProfile: getVideoFormatProfile(aspectRatio, 'low'),
      }, true);
      assert.match(python, /self\._focus_math\(content_\d+\[step_index\]\[1\]/);
      assert.match(python, /card_slot_\d+ = /);
      assert.match(python, /self\._make_final_recap_formula\(/);
      assert.match(python, /self\._fit_final_recap\(final_answer_\d+\)/);
      assert.match(python, /self\.play\(FadeIn\(final_answer_\d+\), run_time=0\.45\)/);
      assert.doesNotMatch(python, /FadeOut\(final_answer_\d+\)/);
      assert.match(python, /self\._create_problem_anchor\(/);
      if (problem !== 'x^2 + 2x + 5 = 0') {
        assert.match(python, /Indicate\(vertex_pt_\d+/);
        assert.match(python, /Indicate\(root_2_\d+/);
      } else {
        assert.doesNotMatch(python, /Indicate\(root_2_\d+/);
        assert.match(python, /No hay raices reales/);
      }
      runPython('import ast, sys; ast.parse(sys.stdin.read())', python);
    }
  }
});

test('adaptive helpers preserve certified minimum pixels on the final blackboard', () => {
  for (const aspectRatio of ['16:9', '1:1', '9:16'] as const) {
    const profile = getVideoFormatProfile(aspectRatio, 'low');
    const helper = buildAdaptiveManimHelpers(profile);
    assert.match(helper, /def _make_final_recap_formula/);
    assert.match(helper, /def _fit_final_recap/);
    assert.match(helper, /def _focus_math/);
    assert.match(helper, /formula_min_px = 27\.000/);
    assert.match(helper, /LAYOUT_FINAL_RECAP_UNREADABLE/);
  }
});
