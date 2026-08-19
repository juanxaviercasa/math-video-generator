import type { VideoFormatProfile } from './video-format.service.js';

export type MathNode =
  | { kind: 'number'; value: number; display: string }
  | { kind: 'variable'; name: string }
  | { kind: 'power'; base: MathNode; exponent: MathNode }
  | { kind: 'sum'; terms: MathNode[] }
  | { kind: 'product'; factors: MathNode[] }
  | { kind: 'fraction'; numerator: MathNode; denominator: MathNode }
  | { kind: 'radical'; radicand: MathNode }
  | { kind: 'equation'; left: MathNode; right: MathNode }
  | { kind: 'text'; value: string };

export type SolutionOperation = 'identify' | 'substitute' | 'expand' | 'multiply' | 'simplify' | 'solve' | 'verify';

export interface SolutionStep {
  id: string;
  operation: SolutionOperation;
  before?: MathNode;
  after?: MathNode;
  substitutions: Array<{ symbol: string; value: MathNode }>;
  explanation: string;
  evidence?: string[];
}

export interface MathematicalSolutionStructure {
  problemId: string;
  parserVersion: string;
  problem: MathNode;
  entities: Record<string, MathNode>;
  equations: MathNode[];
  steps: SolutionStep[];
  results: MathNode[];
  explanations: string[];
  charts: Array<{ id: string; type: 'parabola' | 'cartesian'; expression: string; roots?: number[] }>;
  conclusion?: string;
  supported: boolean;
  warnings: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type VisualPriority = 'primary' | 'secondary' | 'tertiary';
export type VisualLayout = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'grid' | 'vertical-stack' | 'horizontal-stack' | 'overlay' | 'equation-block' | 'comparison' | 'step-by-step' | 'chart-explanation' | 'formula-derivation';
export type VisualBlockRole = 'problem' | 'formula-base' | 'substitution' | 'operation' | 'result' | 'caption' | 'chart' | 'badge' | 'explanation';

export interface VisualBlockSpec {
  id: string;
  semanticRole: VisualBlockRole;
  content: string;
  styleToken: string;
  priority: VisualPriority;
  alignment: 'left' | 'center' | 'right';
  preferredLayout: VisualLayout;
  canSplit: boolean;
  minReadableSize: number;
  maxLines?: number;
  relations?: Array<{ type: 'above' | 'below' | 'left-of' | 'right-of' | 'align-with' | 'inside'; targetId: string; gap?: number }>;
  measured?: BoundingBox;
  resolved?: { bbox: BoundingBox; scale: number; visibleFrom: number; visibleUntil: number };
}

export interface VisualSceneSpec {
  id: string;
  purpose: 'hook' | 'identify' | 'substitute' | 'operate' | 'simplify' | 'solve' | 'verify' | 'recap';
  canvas: VideoFormatProfile;
  safeArea: BoundingBox;
  layout: VisualLayout;
  blocks: VisualBlockSpec[];
  duration: { min: number; max: number; source: 'tts' | 'fixed' | 'hybrid'; seconds: number };
  transition: { enter: 'fade' | 'write' | 'create' | 'grow'; exit: 'fade' | 'unwrite' };
  constraints: string[];
  density?: number;
}

export interface LayoutDiagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  sceneId?: string;
  blockIds?: string[];
  message: string;
  details?: Record<string, number | string | boolean>;
}

export interface ResolvedSceneLayout {
  sceneId: string;
  blocks: Array<{ blockId: string; bbox: BoundingBox; scale: number; visibleFrom: number; visibleUntil: number }>;
  diagnostics: LayoutDiagnostic[];
  score: VisualScore;
}

export interface VisualScore {
  total: number;
  geometry: number;
  readability: number;
  hierarchy: number;
  spacing: number;
  consistency: number;
  density: number;
  semanticClarity: number;
  critical: boolean;
}

export interface MathematicalSupportStatus {
  supported: boolean;
  valid: boolean;
  kind: string;
  warnings: string[];
}

export interface PresentationPlan {
  engineVersion: string;
  designVersion: string;
  solutionHash: string;
  mathematicalSupport: MathematicalSupportStatus;
  canvas: VideoFormatProfile;
  scenes: VisualSceneSpec[];
  resolvedLayouts: ResolvedSceneLayout[];
  diagnostics: LayoutDiagnostic[];
  score: VisualScore;
  passed: boolean;
}

export interface ConstraintResult {
  code: string;
  passed: boolean;
  severity: 'warning' | 'error';
  message: string;
  blockIds?: string[];
  details?: Record<string, number | string | boolean>;
}

export interface VisualQAReport {
  engineVersion: string;
  sceneReports: Array<{ sceneId: string; constraints: ConstraintResult[]; score: VisualScore; sampleFrames?: string[] }>;
  aiReviews?: Array<{ sceneId: string; status: 'skipped' | 'completed' | 'failed'; diagnostics: Array<{ category: string; severity: 'info' | 'warning' | 'error'; message: string; confidence?: number }> }>;
  issues?: VisualIssue[];
  score?: VisualScore;
  debugOverlays?: VisualDebugOverlaySpec[];
  repairIterations?: number;
  mathematicalSupport?: MathematicalSupportStatus;
  productionReady?: boolean;
  errors: string[];
  warnings: string[];
  passed: boolean;
}

export interface RepairAction {
  type: 'reduce-scale' | 'change-template' | 'increase-gap' | 'split-scene' | 'move-anchor' | 'reduce-caption' | 'hide-secondary';
  sceneId: string;
  blockIds?: string[];
  parameters?: Record<string, number | string | boolean>;
  reason: string;
}


export type VisualIssueSeverity = 'info' | 'warning' | 'error';

export interface VisualIssue {
  type: string;
  severity: VisualIssueSeverity;
  element: string;
  scene: string;
  measuredValue: number | string | boolean;
  expectedValue: number | string | boolean;
  suggestedRepair: string;
  reason: string;
  repairAction?: RepairAction;
}

export interface VisualScoreWeights {
  geometry: number;
  readability: number;
  hierarchy: number;
  spacing: number;
  consistency: number;
  pedagogicalClarity: number;
}

export const DEFAULT_VISUAL_SCORE_WEIGHTS: VisualScoreWeights = {
  geometry: 25,
  readability: 20,
  hierarchy: 20,
  spacing: 15,
  consistency: 10,
  pedagogicalClarity: 10,
};

export interface VisualReviewerContext {
  screenshotPath: string;
  scene: VisualSceneSpec;
  plan: PresentationPlan;
  pedagogicalObjective: string;
  solutionContext: string;
}

export interface VisualReviewerResult {
  score: Partial<VisualScore>;
  issues: VisualIssue[];
  summary: string;
}

export interface VisualReviewer {
  readonly name: string;
  review(context: VisualReviewerContext): Promise<VisualReviewerResult>;
}

export interface VisualDebugOverlaySpec {
  enabled: boolean;
  sceneId: string;
  safeArea: BoundingBox;
  guides: BoundingBox[];
  elements: Array<{ id: string; bbox: BoundingBox; priority: VisualPriority; role: VisualBlockRole }>;
  collisions: Array<{ firstId: string; secondId: string; bbox: BoundingBox }>;
  overflows: string[];
  visualScore: VisualScore;
  repairIteration: number;
}

export interface VisualQAConfig {
  scoreWeights?: Partial<VisualScoreWeights>;
  reviewer?: VisualReviewer;
  debug?: boolean;
  maxRepairIterations?: number;
}
