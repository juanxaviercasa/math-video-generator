import assert from 'node:assert/strict';
import test from 'node:test';
import { buildQuadraticStoryboard } from './pedagogy.service.js';
import { validateMathProblem } from './math-validation.service.js';
import { getVideoFormatProfile } from './video-format.service.js';
import { manim } from './manim.service.js';

const input = 'x^2 - 5x + 6 = 0';

test('generated Manim waits until the real cue word before highlighting', () => {
  const scenes = buildQuadraticStoryboard(input, validateMathProblem(input));
  const calculate = scenes.find((scene) => scene.id === 'discriminant-calculate');
  assert.ok(calculate);
  calculate.visualCueDurations = [2, 2, 2, 2];
  calculate.visualCueHighlightOffsets = [0.61, 0.55, 0.75, 0.66];
  calculate.duration = 8.7;
  const script = manim.generatePythonScript({
    title: 'Voice word boundaries', content: input, steps: [], outputDir: '/tmp',
    pedagogicalScenes: scenes, formatProfile: getVideoFormatProfile('16:9', 'medium'),
  }, true);
  assert.match(script, /self\.wait\(0\.360\)\s*self\.play\(Indicate\(content_3\[0\]\[1\]/);
  assert.match(script, /self\.wait\(0\.300\)\s*self\.play\(Indicate\(content_3\[1\]\[1\]/);
  assert.match(script, /self\.wait\(0\.500\)\s*self\.play\(Indicate\(content_3\[2\]\[1\]/);
  assert.match(script, /self\._create_problem_anchor\("x\^2 - 5x \+ 6 = 0"\)/);
});

test('formula-first fallback preserves every mathematical expression', () => {
  const scenes = buildQuadraticStoryboard(input, validateMathProblem(input));
  const options = {
    title: 'Visual recovery', content: input, steps: [], outputDir: '/tmp',
    pedagogicalScenes: scenes, formatProfile: getVideoFormatProfile('9:16', 'high'),
  };
  const normal = manim.generatePythonScript(options, true);
  const simplified = manim.generatePythonScript({ ...options, formulaFirst: true }, true);
  assert.match(normal, /font_size=23/);
  assert.match(simplified, /font_size=18/);
  for (const latex of scenes.flatMap((scene) => scene.visualStages?.map((stage) => stage.latex) || [])) {
    assert.ok(simplified.includes(JSON.stringify(latex)), 'No mathematical expression may be removed: ' + latex);
  }
  assert.match(simplified, /self\._create_problem_anchor\("x\^2 - 5x \+ 6 = 0"\)/);
});
