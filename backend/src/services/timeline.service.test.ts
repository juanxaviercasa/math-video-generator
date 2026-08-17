import assert from 'node:assert/strict';
import test from 'node:test';
import { timeline } from './timeline.service.js';
import type { LessonTimeline } from './timeline.types.js';

const scenes = [
  { id: 'hook', kind: 'intro' as const, visualText: 'x^2 - 5x + 6 = 0', narrationText: 'Presentamos la ecuación.', estimatedDuration: 4 },
  { id: 'coefficients', kind: 'step' as const, visualText: 'a=1, b=-5, c=6', narrationText: 'Identificamos los coeficientes.', estimatedDuration: 4 },
  { id: 'result', kind: 'conclusion' as const, visualText: 'x_1=3, x_2=2', narrationText: 'Comprobamos las soluciones.', estimatedDuration: 5 },
];

test('builds one narration segment and one visual event per scene', () => {
  const lessonTimeline = timeline.buildLessonTimeline({ problem: 'x^2 - 5x + 6 = 0', scenes, narrationStyle: 'warm_teacher' });
  const report = timeline.validateLessonTimeline(lessonTimeline);

  assert.equal(lessonTimeline.segments.length, 3);
  assert.equal(lessonTimeline.events.length, 3);
  assert.equal(report.passed, true);
  assert.equal(report.segmentCount, 3);
  assert.equal(report.eventCount, 3);
  assert.ok(lessonTimeline.events.every((event) => event.duration > 0));
  assert.equal(lessonTimeline.events.at(-1)?.pedagogicalRole, 'verification');
});

test('expands visual stages into ordered labeled micro-events', () => {
  const lessonTimeline = timeline.buildLessonTimeline({
    problem: 'x^2 - 5x + 6 = 0',
    scenes: [{
      ...scenes[1],
      id: 'discriminant',
      kind: 'calculation',
      visualStages: [
        { label: 'Fórmula base', latex: '\\Delta = b^2 - 4ac' },
        { label: 'Reemplazamos', latex: '\\Delta = (-5)^2 - 4(1)(6)' },
        { label: 'Resultado', latex: '\\Delta = 1' },
      ],
    }],
  });

  assert.equal(lessonTimeline.events.length, 3);
  assert.deepEqual(lessonTimeline.events.map((event) => event.label), ['Fórmula base', 'Reemplazamos', 'Resultado']);
  assert.deepEqual(lessonTimeline.events.map((event) => event.action), ['show', 'transform', 'transform']);
  assert.equal(timeline.validateLessonTimeline(lessonTimeline).passed, true);
});

test('uses real scene duration when it is available', () => {
  const lessonTimeline = timeline.buildLessonTimeline({
    problem: 'x^2 - 5x + 6 = 0',
    scenes: [{ ...scenes[0], duration: 7.25 }],
  });

  assert.equal(lessonTimeline.segments[0].durationSeconds, 7.25);
  assert.ok(lessonTimeline.events[0].holdAfter >= 0.6);
});

test('rejects events outside their narration segment', () => {
  const lessonTimeline: LessonTimeline = {
    id: 'invalid',
    version: 'timeline-v1',
    problem: 'x = 1',
    narrationStyle: 'warm_teacher',
    segments: [{ id: 'segment-1', sceneId: 'scene-1', text: 'Un paso.', durationSeconds: 2 }],
    events: [{ id: 'event-1', segmentId: 'segment-1', action: 'show', targetId: 'scene-1', startOffset: 1.5, duration: 1, holdAfter: 1, pedagogicalRole: 'operation' }],
  };

  const report = timeline.validateLessonTimeline(lessonTimeline);
  assert.equal(report.passed, false);
  assert.equal(report.issues[0].type, 'outside-segment');
});

test('rejects overlapping events in the same segment', () => {
  const lessonTimeline: LessonTimeline = {
    id: 'invalid-overlap',
    version: 'timeline-v1',
    problem: 'x = 1',
    narrationStyle: 'neutral_teacher',
    segments: [{ id: 'segment-1', sceneId: 'scene-1', text: 'Dos pasos.', durationSeconds: 5 }],
    events: [
      { id: 'event-1', segmentId: 'segment-1', action: 'show', targetId: 'a', startOffset: 0, duration: 2, holdAfter: 0, pedagogicalRole: 'context' },
      { id: 'event-2', segmentId: 'segment-1', action: 'transform', targetId: 'b', startOffset: 1, duration: 2, holdAfter: 0, pedagogicalRole: 'operation' },
    ],
  };

  const report = timeline.validateLessonTimeline(lessonTimeline);
  assert.equal(report.passed, false);
  assert.ok(report.issues.some((issue) => issue.type === 'overlap'));
});
