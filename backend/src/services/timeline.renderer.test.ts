import assert from 'node:assert/strict';
import test from 'node:test';
import { manim } from './manim.service.js';
import { timeline } from './timeline.service.js';

const pedagogicalScenes = [{
  id: 'discriminant-calculate',
  kind: 'calculation' as const,
  visualText: 'Discriminante = 1',
  narrationText: 'Calculamos la discriminante.',
  estimatedDuration: 8,
  layout: 'equation' as const,
  emphasis: 'Discriminante = 1',
  visualLatex: ['\\Delta = 1'],
  visualTextLines: ['Resultado'],
  visualStages: [
    { label: 'Fórmula base', latex: '\\Delta = b^2 - 4ac' },
    { label: 'Resultado', latex: '\\Delta = 1' },
  ],
  formulaAnchor: {
    latex: '\\Delta = b^2 - 4ac',
    label: 'Referencia',
    persistence: 'segment' as const,
    position: 'top' as const,
  },
  checkpoints: [{ kind: 'predict' as const, prompt: '¿Qué valor obtenemos?', pauseSeconds: 1.2 }],
}];

test('keeps the stable renderer when narration timeline is disabled', () => {
  const lessonTimeline = timeline.buildLessonTimeline({ problem: 'x^2 - 5x + 6 = 0', scenes: pedagogicalScenes });
  const script = manim.generatePythonScript({
    title: 'Timeline disabled',
    steps: ['Calculamos la discriminante.'],
    outputDir: '/tmp',
    pedagogicalScenes,
    lessonTimeline,
    narrationTimeline: false,
  }, true);

  assert.match(script, /Storyboard pedagógico/);
  assert.doesNotMatch(script, /Timeline pedagógico: microeventos/);
});

test('uses timeline micro-events only when explicitly enabled', () => {
  const lessonTimeline = timeline.buildLessonTimeline({ problem: 'x^2 - 5x + 6 = 0', scenes: pedagogicalScenes });
  const script = manim.generatePythonScript({
    title: 'Timeline enabled',
    steps: ['Calculamos la discriminante.'],
    outputDir: '/tmp',
    pedagogicalScenes,
    lessonTimeline,
    narrationTimeline: true,
  }, true);

  assert.match(script, /Timeline pedagógico: microeventos/);
  assert.match(script, /Fórmula base/);
  assert.match(script, /reference_0 = MathTex/);
  assert.match(script, /checkpoint_0 = Text/);
  assert.match(script, /FadeOut\(timeline_0_0\), run_time=/);
  assert.match(script, /FadeIn\(timeline_0_1\), run_time=/);
});

test('legacy graph uses actual quadratic coefficients and roots, never the demo parabola', async () => {
  const { validateMathProblem } = await import('./math-validation.service.js');
  const { buildQuadraticStoryboard } = await import('./pedagogy.service.js');
  const input = '3x^2 + 2x - 8 = 0';
  const scenes = buildQuadraticStoryboard(input, validateMathProblem(input));
  const script = manim.generatePythonScript({
    title: 'Graph validation',
    content: input,
    steps: [],
    outputDir: '/tmp',
    pedagogicalScenes: scenes,
    narrationTimeline: false,
  }, true);

  assert.match(script, /lambda x: 3 \* x\*\*2 \+ \(2\) \* x \+ \(-8\)/);
  assert.ok(script.includes('x\\\\approx1.333'));
  assert.match(script, /x=-2/);
  assert.doesNotMatch(script, /lambda x: \(x - 2\) \* \(x - 3\)/);
});

test('rejects graphs without validated coefficients instead of drawing demonstration roots', () => {
  assert.throws(() => manim.generatePythonScript({
    title: 'Unverified graph',
    content: 'y=x^2+100',
    steps: [],
    outputDir: '/tmp',
    synchronizedScenes: [
      { id: 'intro', kind: 'intro', visualText: 'y=x^2+100', narrationText: 'Veamos.', estimatedDuration: 5 },
      { id: 'graph', kind: 'graph', visualText: 'Grafica', narrationText: 'Analizamos.', estimatedDuration: 5 },
    ],
  }, true), /GRAPH_SPEC_MISSING/);
});

test('does not fabricate a graph in a steps-only fallback', () => {
  const script = manim.generatePythonScript({
    title: 'Legacy equation',
    content: 'x^2 + 100 = 0',
    steps: ['No hay soluciones reales'],
    outputDir: '/tmp',
  }, true);
  assert.doesNotMatch(script, /lambda x: \(x - 2\) \* \(x - 3\)/);
  assert.doesNotMatch(script, /root_2 = Dot/);
});

test('renders a single marker for a repeated quadratic root', async () => {
  const { validateMathProblem } = await import('./math-validation.service.js');
  const { buildQuadraticStoryboard } = await import('./pedagogy.service.js');
  const problem = 'x^2 - 2x + 1 = 0';
  const script = manim.generatePythonScript({
    title: 'Repeated root',
    content: problem,
    steps: [],
    outputDir: '/tmp',
    pedagogicalScenes: buildQuadraticStoryboard(problem, validateMathProblem(problem)),
  }, true);
  assert.match(script, /root_2_9 = Dot/);
  assert.doesNotMatch(script, /root_3_9 = Dot/);
  assert.doesNotMatch(script, /root_3_label_9 = MathTex/);
});

test('refuses to plot coefficients with mathematically incorrect roots', async () => {
  const { validateMathProblem } = await import('./math-validation.service.js');
  const { buildQuadraticStoryboard } = await import('./pedagogy.service.js');
  const problem = 'x^2 - 5x + 6 = 0';
  const scenes = buildQuadraticStoryboard(problem, validateMathProblem(problem));
  const invalidScenes = scenes.map((scene) => scene.id === 'graph'
    ? { ...scene, graphSpec: { a: 1, b: -5, c: 6, roots: [4, 5] as [number, number] } }
    : scene);

  assert.throws(() => manim.generatePythonScript({
    title: 'Invalid graph',
    content: problem,
    steps: [],
    outputDir: '/tmp',
    pedagogicalScenes: invalidScenes,
  }, true), /GRAPH_SPEC_INVALID/);
});
