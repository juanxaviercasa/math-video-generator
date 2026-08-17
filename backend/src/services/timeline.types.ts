import type { SynchronizedScene } from './synchronization.service.js';

export type VisualEventAction = 'show' | 'highlight' | 'transform' | 'write' | 'replace' | 'plot' | 'hold' | 'hide';
export type PedagogicalRole = 'context' | 'data' | 'operation' | 'result' | 'verification';

export interface NarrationSegment {
  id: string;
  sceneId: string;
  text: string;
  durationSeconds: number;
  audioPath?: string;
  emphasis?: string[];
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
}

export interface LessonTimeline {
  id: string;
  version: string;
  problem: string;
  narrationStyle: 'warm_teacher' | 'neutral_teacher';
  segments: NarrationSegment[];
  events: VisualEvent[];
}

export interface TimelineIssue {
  type: 'missing-segment' | 'missing-target' | 'overlap' | 'outside-segment' | 'empty-segment' | 'non-monotonic';
  severity: 'error' | 'warning';
  segmentId?: string;
  eventId?: string;
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
  visualStages?: Array<{ label: string; latex: string; detail?: string }>;
  visualLatex?: string[];
  visualTextLines?: string[];
}

export interface TimelineBuildInput {
  problem: string;
  scenes: TimelineSceneInput[];
  narrationStyle?: 'warm_teacher' | 'neutral_teacher';
}
