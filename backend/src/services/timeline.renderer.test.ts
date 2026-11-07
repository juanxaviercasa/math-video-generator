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
