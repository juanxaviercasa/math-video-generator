import type {
  LessonTimeline,
  NarrationSegment,
  PedagogicalRole,
  TimelineBuildInput,
  TimelineValidationReport,
  TimelineIssue,
  VisualEvent,
} from './timeline.types.js';
import type { TimelineSceneInput } from './timeline.types.js';

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));

const roleForScene = (scene: TimelineSceneInput, index: number, total: number): PedagogicalRole => {
  if (scene.kind === 'intro' || index === 0) return 'context';
  if (scene.kind === 'conclusion' || index === total - 1) return 'verification';
  if (scene.kind === 'calculation' || scene.kind === 'formula') return 'operation';
  return 'data';
};

const actionForScene = (scene: TimelineSceneInput, index: number): VisualEvent['action'] => {
  if (scene.kind === 'graph') return 'plot';
  if (index === 0 || scene.kind === 'intro') return 'show';
  if (scene.kind === 'conclusion') return 'hold';
  return 'transform';
};

const durationForScene = (scene: TimelineSceneInput): number => {
  const duration = Number(scene.duration ?? scene.estimatedDuration);
  return Number.isFinite(duration) && duration > 0 ? duration : 3;
};

export const buildLessonTimeline = ({ problem, scenes, narrationStyle = 'warm_teacher' }: TimelineBuildInput): LessonTimeline => {
  const segments: NarrationSegment[] = scenes.map((scene) => ({
    id: `segment-${scene.id}`,
    sceneId: scene.id,
    text: scene.narrationText.trim(),
    durationSeconds: durationForScene(scene),
  }));

  const events: VisualEvent[] = scenes.flatMap((scene, index) => {
    const segmentId = `segment-${scene.id}`;
    const segmentDuration = segments[index].durationSeconds;
    const role = roleForScene(scene, index, scenes.length);
    const stageItems = scene.visualStages?.length
      ? scene.visualStages.map((stage) => ({ targetId: `${scene.id}-${stage.label}`, value: stage.latex, label: stage.label }))
      : scene.visualLatex?.length
        ? scene.visualLatex.map((value, stageIndex) => ({ targetId: `${scene.id}-formula-${stageIndex + 1}`, value, label: scene.visualTextLines?.[stageIndex] || (stageIndex === 0 ? scene.visualText : 'Siguiente transformación') }))
        : [{ targetId: scene.id, value: scene.visualText, label: scene.visualText }];
    const holdAfter = role === 'verification' ? 1.4 : role === 'operation' ? 0.7 : 0.6;
    const transitionBudget = 1.2;
    const availableDuration = Math.max(stageItems.length * 0.35, segmentDuration - transitionBudget - holdAfter * stageItems.length);
    const eventDuration = Math.max(0.35, availableDuration / stageItems.length);

    return stageItems.map((stage, stageIndex) => ({
      id: `event-${scene.id}-${stageIndex + 1}`,
      segmentId,
      action: stageIndex === 0 ? actionForScene(scene, index) : 'transform',
      targetId: stage.targetId,
      from: stageIndex > 0 ? stageItems[stageIndex - 1].value : index > 0 ? scenes[index - 1].visualText : undefined,
      to: stage.value,
      startOffset: Number((stageIndex * (eventDuration + holdAfter)).toFixed(3)),
      duration: Number(eventDuration.toFixed(3)),
      holdAfter,
      pedagogicalRole: role,
      label: stage.label,
    }));
  });

  return {
    id: `lesson-timeline-${scenes.map((scene) => scene.id).join('-')}`,
    version: 'timeline-v1',
    problem,
    narrationStyle,
    segments,
    events,
  };
};

export const validateLessonTimeline = (timeline: LessonTimeline): TimelineValidationReport => {
  const issues: TimelineIssue[] = [];
  const segmentIds = new Set(timeline.segments.map((segment) => segment.id));
  const eventIds = new Set<string>();
  let totalDuration = 0;

  for (const segment of timeline.segments) {
    if (!segment.text.trim()) issues.push({ type: 'empty-segment', severity: 'error', segmentId: segment.id, message: 'El segmento de narración está vacío.' });
    if (!Number.isFinite(segment.durationSeconds) || segment.durationSeconds <= 0) issues.push({ type: 'empty-segment', severity: 'error', segmentId: segment.id, message: 'El segmento debe tener una duración positiva.' });
    totalDuration += Math.max(0, segment.durationSeconds);
  }

  for (const event of timeline.events) {
    if (eventIds.has(event.id)) issues.push({ type: 'non-monotonic', severity: 'error', eventId: event.id, message: 'El ID del evento está duplicado.' });
    eventIds.add(event.id);
    if (!segmentIds.has(event.segmentId)) {
      issues.push({ type: 'missing-segment', severity: 'error', eventId: event.id, segmentId: event.segmentId, message: 'El evento referencia un segmento inexistente.' });
      continue;
    }
    const segment = timeline.segments.find((candidate) => candidate.id === event.segmentId);
    if (!segment) continue;
    if (event.startOffset < 0 || event.duration <= 0 || event.startOffset + event.duration + event.holdAfter > segment.durationSeconds + 0.05) {
      issues.push({ type: 'outside-segment', severity: 'error', eventId: event.id, segmentId: event.segmentId, message: 'El evento visual queda fuera de la duración real del segmento.' });
    }
  }

  for (const segment of timeline.segments) {
    const events = timeline.events.filter((event) => event.segmentId === segment.id).sort((a, b) => a.startOffset - b.startOffset);
    for (let index = 1; index < events.length; index += 1) {
      const previous = events[index - 1];
      const current = events[index];
      if (current.startOffset < previous.startOffset + previous.duration) {
        issues.push({ type: 'overlap', severity: 'error', eventId: current.id, segmentId: segment.id, message: 'Dos eventos visuales se solapan dentro del mismo segmento sin una transición declarada.' });
      }
    }
  }

  return {
    passed: !issues.some((issue) => issue.severity === 'error'),
    issues,
    segmentCount: timeline.segments.length,
    eventCount: timeline.events.length,
    totalDuration: Number(totalDuration.toFixed(3)),
  };
};

export const timeline = { buildLessonTimeline, validateLessonTimeline };
