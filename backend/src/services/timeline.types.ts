import type { SynchronizedScene } from './synchronization.service.js';

export type VisualEventAction = 'show' | 'highlight' | 'transform' | 'write' | 'replace' | 'plot' | 'hold' | 'hide';
export type LessonMode = 'tutorial' | 'intuition' | 'challenge' | 'practice';
export type PedagogicalRole = 'context' | 'data' | 'operation' | 'result' | 'verification' | 'reflection';
export type FormulaPersistence = 'segment' | 'lesson';
export type CheckpointKind = 'predict' | 'practice' | 'reflect';

export interface FormulaAnchor {
  id: string;
  latex: string;
  label?: string;
  persistence: FormulaPersistence;
  position: 'top' | 'side';
}

export interface PedagogicalCheckpoint {
  id: string;
  kind: CheckpointKind;
  prompt: string;
  pauseSeconds: number;
  revealAfterEventId?: string;
}

export interface NarrationSegment {
  id: string;
  sceneId: string;
  text: string;
  durationSeconds: number;
  audioPath?: string;
  emphasis?: string[];
  lessonMode?: LessonMode;
  objective?: string;
}

export interface VisualEvent {
  id: string;
  segmentId: string;
  action: VisualEventAction;
  targetId: string;
  from?: string;
  to?: string;
  startOffset: number;
  duration: number;
  holdAfter: number;
  pedagogicalRole: PedagogicalRole;
  label?: string;
  semanticStep?: string;
  formulaAnchorId?: string;
}

export interface LessonTimeline {
  id: string;
  version: string;
  problem: string;
  narrationStyle: 'warm_teacher' | 'neutral_teacher';
  lessonMode?: LessonMode;
  segments: NarrationSegment[];
  events: VisualEvent[];
  formulaAnchors?: FormulaAnchor[];
  checkpoints?: PedagogicalCheckpoint[];
}

export interface TimelineIssue {
  type:
    | 'missing-segment'
    | 'missing-target'
    | 'overlap'
    | 'outside-segment'
    | 'empty-segment'
    | 'non-monotonic'
    | 'missing-anchor'
    | 'invalid-checkpoint'
    | 'missing-semantic-step';
  severity: 'error' | 'warning';
  segmentId?: string;
  eventId?: string;
  anchorId?: string;
  checkpointId?: string;
  message: string;
}

export interface TimelineValidationReport {
  passed: boolean;
  issues: TimelineIssue[];
  segmentCount: number;
  eventCount: number;
  totalDuration: number;
}

export interface TimelineSceneInput {
  id: string;
  kind: string;
  visualText: string;
  narrationText: string;
  estimatedDuration: number;
  duration?: number;
  lessonMode?: LessonMode;
  objective?: string;
  formulaAnchor?: Omit<FormulaAnchor, 'id'>;
  checkpoints?: Omit<PedagogicalCheckpoint, 'id' | 'revealAfterEventId'>[];
  visualStages?: Array<{
    label: string;
    latex: string;
    detail?: string;
    role?: PedagogicalRole;
    semanticStep?: string;
    formulaAnchorId?: string;
  }>;
  visualLatex?: string[];
  visualTextLines?: string[];
}

export interface TimelineBuildInput {
  problem: string;
  scenes: TimelineSceneInput[];
  narrationStyle?: 'warm_teacher' | 'neutral_teacher';
  lessonMode?: LessonMode;
}

export type TimelineScene = SynchronizedScene & TimelineSceneInput;
