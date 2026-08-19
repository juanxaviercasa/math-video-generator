import { z } from 'zod';

export type AnimatedSlideKind = 'hook' | 'concept' | 'worked_step' | 'checkpoint' | 'graph' | 'verification' | 'summary';
export type SlideCueKind = 'enter' | 'write' | 'highlight' | 'transform' | 'hold' | 'reveal' | 'exit';

export interface TimelineLike {
  id: string;
  problem: string;
  narrationStyle: 'warm_teacher' | 'neutral_teacher';
  lessonMode?: 'tutorial' | 'intuition' | 'challenge' | 'practice' | 'context';
  segments: Array<{
    id: string;
    sceneId: string;
    text: string;
    durationSeconds: number;
    objective?: string;
    pedagogicalStep?: string;
  }>;
  events: Array<{
    id: string;
    segmentId: string;
    action: string;
    targetId: string;
    from?: string;
    to?: string;
    startOffset: number;
    duration: number;
    label?: string;
    pedagogicalStep?: string;
    formulaAnchorId?: string;
  }>;
  formulaAnchors?: Array<{
    id: string;
    latex: string;
    label?: string;
    persistence: 'segment' | 'lesson';
    position: 'top' | 'side';
  }>;
  checkpoints?: Array<{
    id: string;
    kind: 'predict' | 'practice' | 'reflect';
    prompt: string;
    pauseSeconds: number;
  }>;
}

export interface AnimatedDeck {
  id: string;
  problem: string;
  format: '16:9' | '1:1' | '9:16';
  narrationStyle: TimelineLike['narrationStyle'];
  slides: AnimatedSlide[];
  sourceTimelineId: string;
  totalDurationSeconds: number;
}

export interface AnimatedSlide {
  id: string;
  index: number;
  kind: AnimatedSlideKind;
  title: string;
  objective?: string;
  durationSeconds: number;
  audioSrc?: string;
  narrationSegmentId: string;
  formulaAnchorIds: string[];
  visualBlocks: Array<{
    id: string;
    type: 'formula' | 'text' | 'badge' | 'graph' | 'callout' | 'progress';
    content: string;
    latex?: string;
    role?: 'context' | 'data' | 'operation' | 'result' | 'verification' | 'reflection';
    position: 'top' | 'center' | 'side' | 'bottom';
  }>;
  cues: Array<{
    id: string;
    kind: SlideCueKind;
    targetId: string;
    startSeconds: number;
    durationSeconds: number;
    from?: string;
    to?: string;
    narrationEventId?: string;
  }>;
  checkpointId?: string;
  transition: 'cut' | 'crossfade' | 'push' | 'morph';
}

export const animatedDeckSchema = z.object({
  id: z.string(),
  problem: z.string(),
  format: z.enum(['16:9', '1:1', '9:16']),
  narrationStyle: z.enum(['warm_teacher', 'neutral_teacher']),
  slides: z.array(z.object({ id: z.string(), index: z.number(), durationSeconds: z.number() })).min(1),
  sourceTimelineId: z.string(),
  totalDurationSeconds: z.number(),
});

const stepKind: Record<string, AnimatedSlideKind> = {
  hook: 'hook',
  context: 'concept',
  identify: 'concept',
  substitute: 'worked_step',
  compute: 'worked_step',
  simplify: 'worked_step',
  solve: 'worked_step',
  verify: 'verification',
  interpret: 'summary',
};

const cueKind: Record<string, SlideCueKind> = {
  show: 'enter',
  write: 'write',
  highlight: 'highlight',
  transform: 'transform',
  replace: 'transform',
  hold: 'hold',
  plot: 'reveal',
  hide: 'exit',
};

export function timelineToAnimatedDeck(timeline: TimelineLike, format: AnimatedDeck['format'] = '16:9'): AnimatedDeck {
  const anchors = timeline.formulaAnchors ?? [];
  const slides = timeline.segments.map((segment, index) => {
    const events = timeline.events.filter((event) => event.segmentId === segment.id).sort((a, b) => a.startOffset - b.startOffset);
    const anchorIds = [...new Set(events.map((event) => event.formulaAnchorId).filter((id): id is string => Boolean(id)))];
    const checkpoint = timeline.checkpoints?.find((candidate) => (segment.id === 'substitute' && candidate.kind === 'predict') || events.some((event) => event.id === candidate.id || event.label === candidate.prompt));
    const firstEvent = events[0];
    const pedagogicalStep = segment.pedagogicalStep ?? firstEvent?.pedagogicalStep ?? 'context';
    const formulaAnchor = anchorIds.map((id) => anchors.find((anchor) => anchor.id === id)).find(Boolean);
    const formulaEvent = events.find((event) => event.to || event.from);
    const formula = formulaEvent?.to ?? formulaEvent?.from ?? formulaAnchor?.latex ?? segment.text;
    const title = segment.objective ?? firstEvent?.label ?? segment.pedagogicalStep ?? 'Siguiente paso';
    const isGraph = events.some((event) => event.action === 'plot');
    const blocks: AnimatedSlide['visualBlocks'] = [
      ...(formulaAnchor ? [{ id: formulaAnchor.id, type: 'formula' as const, content: formulaAnchor.label ?? 'Fórmula de referencia', latex: formulaAnchor.latex, role: 'context' as const, position: formulaAnchor.position }] : []),
      { id: `${segment.id}-main`, type: isGraph ? 'graph' : 'formula', content: formula, latex: formula, role: pedagogicalStep === 'verify' ? 'verification' : 'operation', position: 'center' },
      { id: `${segment.id}-detail`, type: 'text', content: segment.text, role: 'reflection', position: 'bottom' },
    ];
    return {
      id: `slide-${segment.id}`,
      index,
      kind: isGraph ? 'graph' : (stepKind[pedagogicalStep] ?? 'worked_step'),
      title,
      objective: segment.objective,
      durationSeconds: segment.durationSeconds,
      audioSrc: (segment as TimelineLike['segments'][number] & { audioSrc?: string }).audioSrc,
      narrationSegmentId: segment.id,
      formulaAnchorIds: anchorIds,
      visualBlocks: blocks,
      cues: events.map((event) => ({
        id: `cue-${event.id}`,
        kind: cueKind[event.action] ?? 'hold',
        targetId: event.targetId,
        startSeconds: event.startOffset,
        durationSeconds: event.duration,
        from: event.from,
        to: event.to,
        narrationEventId: event.id,
      })),
      checkpointId: checkpoint?.id,
      transition: index === 0 ? 'cut' : 'crossfade',
    } satisfies AnimatedSlide;
  });

  return {
    id: `deck-${timeline.id}`,
    problem: timeline.problem,
    format,
    narrationStyle: timeline.narrationStyle,
    slides,
    sourceTimelineId: timeline.id,
    totalDurationSeconds: slides.reduce((sum, slide) => sum + slide.durationSeconds, 0),
  };
}

export function deckToEditorialStages(deck: AnimatedDeck) {
  return deck.slides.map((slide) => {
    const primary = slide.visualBlocks.find((block) => block.position === 'center' && (block.type === 'formula' || block.type === 'graph')) ?? slide.visualBlocks.find((block) => block.type === 'formula' || block.type === 'graph');
    const reference = slide.visualBlocks.find((block) => block.position === 'top' || block.position === 'side');
    const accentByKind: Record<AnimatedSlideKind, string> = {
      hook: '#f7c948', concept: '#6ee7b7', worked_step: '#93c5fd', checkpoint: '#f7c948', graph: '#fb7185', verification: '#fb7185', summary: '#c4b5fd',
    };
    return {
      id: slide.narrationSegmentId,
      durationFrames: Math.max(30, Math.round(slide.durationSeconds * 30)),
      label: slide.title,
      latex: primary?.latex ?? primary?.content ?? slide.title,
      referenceLatex: reference?.latex,
      detail: slide.visualBlocks.find((block) => block.type === 'text')?.content ?? slide.objective ?? '',
      accent: accentByKind[slide.kind],
    };
  });
}

export const demoTimeline: TimelineLike = {
  id: 'quadratic-demo-timeline',
  problem: '3x^2 + 2x - 8 = 0',
  narrationStyle: 'warm_teacher',
  lessonMode: 'tutorial',
  segments: [
    { id: 'hook', sceneId: 'hook', text: 'Vamos a resolverla sin saltarnos ningún paso.', durationSeconds: 4.44, objective: 'Primero, mira la ruta', pedagogicalStep: 'hook' },
    { id: 'identify', sceneId: 'identify', text: 'Aquí tenemos a igual a 3, b igual a 2 y c igual a menos 8.', durationSeconds: 8.04, objective: 'Identificamos los tres valores', pedagogicalStep: 'identify' },
    { id: 'reference', sceneId: 'reference', text: 'La discriminante se calcula con b al cuadrado menos 4 por a por c. Esta fórmula será nuestro mapa.', durationSeconds: 7.992, objective: 'La fórmula queda arriba como mapa', pedagogicalStep: 'context' },
    { id: 'substitute', sceneId: 'substitute', text: 'Antes de calcular, reemplazamos cada valor dentro de la fórmula: dos al cuadrado, menos cuatro por tres por menos ocho.', durationSeconds: 8.544, objective: 'Sustituimos antes de calcular', pedagogicalStep: 'substitute' },
    { id: 'compute', sceneId: 'compute', text: 'Ahora operamos en orden. Dos al cuadrado es cuatro; cuatro por tres por menos ocho produce menos noventa y seis, y al restarlo obtenemos una discriminante igual a cien.', durationSeconds: 12.264, objective: 'Operamos en tres movimientos', pedagogicalStep: 'compute' },
    { id: 'solve', sceneId: 'solve', text: 'Aplicamos la fórmula general y obtenemos dos soluciones: x uno es aproximadamente uno punto tres tres tres y x dos es menos dos.', durationSeconds: 9.792, objective: 'Llegamos a las dos raíces', pedagogicalStep: 'solve' },
    { id: 'verify', sceneId: 'verify', text: 'Finalmente comprobamos la respuesta. En la gráfica, las dos raíces vuelven a tocar el eje x; por eso la solución queda verificada.', durationSeconds: 10.344, objective: 'Comprobamos la respuesta', pedagogicalStep: 'verify' },
  ],
  formulaAnchors: [
    { id: 'quadratic-formula', latex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', label: 'Fórmula general', persistence: 'lesson', position: 'top' },
    { id: 'discriminant-formula', latex: '\\Delta = b^2 - 4ac', label: 'Fórmula de la discriminante', persistence: 'lesson', position: 'top' },
  ],
  events: [
    { id: 'hook-show', segmentId: 'hook', action: 'show', targetId: 'problem', to: '3x^2 + 2x - 8 = 0', startOffset: 0, duration: 0.4, label: 'Primero, mira la ruta', pedagogicalStep: 'hook' },
    { id: 'identify-write', segmentId: 'identify', action: 'write', targetId: 'coefficients', to: 'a = 3,\\quad b = 2,\\quad c = -8', startOffset: 0, duration: 0.9, label: 'Identificamos los tres valores', pedagogicalStep: 'identify' },
    { id: 'reference-show', segmentId: 'reference', action: 'show', targetId: 'delta-anchor', to: '\\Delta = b^2 - 4ac', startOffset: 0, duration: 0.4, label: 'Fórmula de referencia', pedagogicalStep: 'context', formulaAnchorId: 'discriminant-formula' },
    { id: 'substitute-replace', segmentId: 'substitute', action: 'replace', targetId: 'delta', from: '\\Delta = b^2 - 4ac', to: '\\Delta = (2)^2 - 4(3)(-8)', startOffset: 0.5, duration: 1.0, label: 'Sustitución completa', pedagogicalStep: 'substitute', formulaAnchorId: 'discriminant-formula' },
    { id: 'compute-highlight', segmentId: 'compute', action: 'transform', targetId: 'delta', from: '\\Delta = (2)^2 - 4(3)(-8)', to: '\\Delta = 4 + 96 = 100', startOffset: 0.6, duration: 1.0, label: 'Cálculo de la discriminante', pedagogicalStep: 'compute', formulaAnchorId: 'discriminant-formula' },
    { id: 'solve-show', segmentId: 'solve', action: 'write', targetId: 'roots', to: 'x_1 = 1.333,\\quad x_2 = -2', startOffset: 0.7, duration: 1.0, label: 'Dos raíces', pedagogicalStep: 'solve', formulaAnchorId: 'quadratic-formula' },
    { id: 'verify-plot', segmentId: 'verify', action: 'plot', targetId: 'graph', to: 'x_1 = 1.333,\\quad x_2 = -2', startOffset: 0.5, duration: 1.0, label: 'Comprobación gráfica', pedagogicalStep: 'verify' },
  ],
  checkpoints: [
    { id: 'predict-substitution', kind: 'predict', prompt: '¿Qué valores reemplazan a, b y c?', pauseSeconds: 1.2 },
  ],
};
