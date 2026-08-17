import type {
  FormulaAnchor,
  LessonMode,
  LessonTimeline,
  NarrationSegment,
  PedagogicalCheckpoint,
  PedagogicalRole,
  TimelineBuildInput,
  TimelineSceneInput,
  TimelineValidationReport,
  TimelineIssue,
  PedagogicalContract,
  PedagogicalStep,
  VisualEvent,
} from './timeline.types.js';

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

const pedagogicalStepForScene = (scene: TimelineSceneInput, index: number): PedagogicalStep => {
  if (scene.pedagogicalStep) return scene.pedagogicalStep;
  if (index === 0 || scene.kind === 'intro') return 'hook';
  if (scene.kind === 'conclusion') return 'interpret';
  if (scene.kind === 'calculation') return 'compute';
  if (scene.kind === 'formula') return 'substitute';
  return 'context';
};

const durationForScene = (scene: TimelineSceneInput): number => {
  const duration = Number(scene.duration ?? scene.estimatedDuration);
  return Number.isFinite(duration) && duration > 0 ? duration : 3;
};

const formulaAnchorsForScenes = (scenes: TimelineSceneInput[]): FormulaAnchor[] => scenes.flatMap((scene) => {
  if (!scene.formulaAnchor?.latex?.trim()) return [];
  return [{
    id: `anchor-${scene.id}`,
    latex: scene.formulaAnchor.latex.trim(),
    label: scene.formulaAnchor.label,
    persistence: scene.formulaAnchor.persistence,
    position: scene.formulaAnchor.position,
  }];
});

const sceneStageItems = (scene: TimelineSceneInput, index: number) => {
  const fallbackRole = roleForScene(scene, index, 1);
  const fallbackStep = pedagogicalStepForScene(scene, index);
  const anchorId = scene.formulaAnchor ? `anchor-${scene.id}` : undefined;
  if (scene.visualStages?.length) {
    return scene.visualStages.map((stage) => ({
      targetId: `${scene.id}-${stage.label}`,
      value: stage.latex,
      label: stage.label,
      role: stage.role ?? fallbackRole,
      semanticStep: stage.semanticStep ?? stage.label,
      pedagogicalStep: stage.pedagogicalStep ?? scene.pedagogicalStep ?? fallbackStep,
      formulaAnchorId: stage.formulaAnchorId ?? anchorId,
    }));
  }
  if (scene.visualLatex?.length) {
    return scene.visualLatex.map((value, stageIndex) => ({
      targetId: `${scene.id}-formula-${stageIndex + 1}`,
      value,
      label: scene.visualTextLines?.[stageIndex] || (stageIndex === 0 ? scene.visualText : 'Siguiente transformación'),
      role: fallbackRole,
      semanticStep: scene.visualTextLines?.[stageIndex] || (stageIndex === 0 ? scene.visualText : 'Siguiente transformación'),
      pedagogicalStep: scene.pedagogicalStep ?? fallbackStep,
      formulaAnchorId: anchorId,
    }));
  }
  return [{
    targetId: scene.id,
    value: scene.visualText,
    label: scene.visualText,
    role: fallbackRole,
    semanticStep: scene.visualText,
    pedagogicalStep: scene.pedagogicalStep ?? fallbackStep,
    formulaAnchorId: anchorId,
  }];
};

export const buildLessonTimeline = ({ problem, scenes, narrationStyle = 'warm_teacher', lessonMode = 'tutorial', pedagogicalContract }: TimelineBuildInput): LessonTimeline => {
  const segments: NarrationSegment[] = scenes.map((scene) => ({
    id: `segment-${scene.id}`,
    sceneId: scene.id,
    text: scene.narrationText.trim(),
    durationSeconds: durationForScene(scene),
    lessonMode: scene.lessonMode ?? lessonMode,
    objective: scene.objective,
  }));

  const eventBatches = scenes.map((scene, index) => {
    const segmentId = `segment-${scene.id}`;
    const segmentDuration = segments[index].durationSeconds;
    const sceneItems = sceneStageItems(scene, index);
    const holdAfter = roleForScene(scene, index, scenes.length) === 'verification' ? 1.4 : 0.7;
    const checkpointPauseBudget = (scene.checkpoints ?? []).reduce((sum, checkpoint) => sum + clamp(Number(checkpoint.pauseSeconds), 0.5, 8), 0);
    const transitionBudget = 1.2;
    const availableDuration = Math.max(sceneItems.length * 0.35, segmentDuration - transitionBudget - holdAfter * sceneItems.length - checkpointPauseBudget);
    const eventDuration = Math.max(0.35, availableDuration / sceneItems.length);

    return sceneItems.map((stage, stageIndex): VisualEvent => ({
      id: `event-${scene.id}-${stageIndex + 1}`,
      segmentId,
      action: stageIndex === 0 ? actionForScene(scene, index) : 'transform',
      targetId: stage.targetId,
      from: stageIndex > 0 ? sceneItems[stageIndex - 1].value : index > 0 ? scenes[index - 1].visualText : undefined,
      to: stage.value,
      startOffset: Number((stageIndex * (eventDuration + holdAfter) + (stageIndex > 0 ? checkpointPauseBudget : 0)).toFixed(3)),
      duration: Number(eventDuration.toFixed(3)),
      holdAfter: holdAfter + (stageIndex === 0 ? checkpointPauseBudget : 0),
      pedagogicalRole: stage.role,
      label: stage.label,
      semanticStep: stage.semanticStep,
      pedagogicalStep: stage.pedagogicalStep,
      formulaAnchorId: stage.formulaAnchorId,
    }));
  });

  const events = eventBatches.flat();
  const checkpoints: PedagogicalCheckpoint[] = scenes.flatMap((scene, sceneIndex) => (scene.checkpoints ?? []).map((checkpoint, checkpointIndex) => {
    const sceneEvents = eventBatches[sceneIndex] ?? [];
    const lastEvent = sceneEvents[sceneEvents.length - 1];
    return {
      id: `checkpoint-${scene.id}-${checkpointIndex + 1}`,
      kind: checkpoint.kind,
      prompt: checkpoint.prompt.trim(),
      pauseSeconds: clamp(Number(checkpoint.pauseSeconds), 0.5, 8),
      revealAfterEventId: lastEvent?.id,
    };
  }));

  return {
    id: `lesson-timeline-${scenes.map((scene) => scene.id).join('-')}`,
    version: 'timeline-v2',
    problem,
    narrationStyle,
    lessonMode,
    pedagogicalContract,
    segments,
    events,
    formulaAnchors: formulaAnchorsForScenes(scenes),
    checkpoints,
  };
};

export const validateLessonTimeline = (timeline: LessonTimeline): TimelineValidationReport => {
  const issues: TimelineIssue[] = [];
  const segmentIds = new Set(timeline.segments.map((segment) => segment.id));
  const eventIds = new Set<string>();
  const anchorIds = new Set((timeline.formulaAnchors ?? []).map((anchor) => anchor.id));
  const requiredSteps = timeline.pedagogicalContract?.requiredSteps ?? [];
  const observedSteps = new Set(timeline.events.map((event) => event.pedagogicalStep).filter(Boolean));
  let totalDuration = 0;

  for (const segment of timeline.segments) {
    if (!segment.text.trim()) issues.push({ type: 'empty-segment', severity: 'error', segmentId: segment.id, message: 'El segmento de narración está vacío.' });
    if (!Number.isFinite(segment.durationSeconds) || segment.durationSeconds <= 0) issues.push({ type: 'empty-segment', severity: 'error', segmentId: segment.id, message: 'El segmento debe tener una duración positiva.' });
    totalDuration += Math.max(0, segment.durationSeconds);
  }

  for (const anchor of timeline.formulaAnchors ?? []) {
    if (!anchor.id.trim() || !anchor.latex.trim()) {
      issues.push({ type: 'missing-anchor', severity: 'error', anchorId: anchor.id, message: 'El ancla de fórmula debe tener identificador y LaTeX.' });
    }
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
    if (event.formulaAnchorId && !anchorIds.has(event.formulaAnchorId)) {
      issues.push({ type: 'missing-anchor', severity: 'error', eventId: event.id, anchorId: event.formulaAnchorId, message: 'El evento referencia un ancla de fórmula inexistente.' });
    }
    if (!event.semanticStep?.trim()) {
      issues.push({ type: 'missing-semantic-step', severity: 'warning', eventId: event.id, message: 'El evento no declara el paso semántico que representa.' });
    }
  }

  for (const requiredStep of requiredSteps) {
    if (!observedSteps.has(requiredStep)) {
      issues.push({ type: 'missing-required-step', severity: 'error', message: `La lección no contiene el paso pedagógico requerido: ${requiredStep}.` });
    }
  }

  for (const checkpoint of timeline.checkpoints ?? []) {
    if (!checkpoint.prompt.trim() || !Number.isFinite(checkpoint.pauseSeconds) || checkpoint.pauseSeconds <= 0) {
      issues.push({ type: 'invalid-checkpoint', severity: 'error', checkpointId: checkpoint.id, message: 'El checkpoint debe tener una pregunta y una pausa positiva.' });
    }
    if (checkpoint.revealAfterEventId && !eventIds.has(checkpoint.revealAfterEventId)) {
      issues.push({ type: 'invalid-checkpoint', severity: 'error', checkpointId: checkpoint.id, message: 'El checkpoint referencia un evento de revelación inexistente.' });
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
