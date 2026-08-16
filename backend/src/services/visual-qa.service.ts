import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { createMathDesignTokens, createPresentationCanvas } from './presentation-design.service.js';
import { validateResolvedScene } from './presentation-constraint.service.js';
import type {
  BoundingBox,
  ConstraintResult,
  LayoutDiagnostic,
  PresentationPlan,
  VisualIssue,
  VisualQAConfig,
  VisualQAReport,
  VisualReviewerResult,
  VisualSceneSpec,
  VisualScore,
  VisualDebugOverlaySpec,
} from './presentation.types.js';

const execFileAsync = promisify(execFile);

export interface AIVisualReview {
  enabled: boolean;
  status: 'skipped' | 'completed' | 'failed';
  diagnostics: Array<{ category: 'clarity' | 'hierarchy' | 'readability' | 'consistency' | 'balance' | 'pedagogy' | 'density'; severity: 'info' | 'warning' | 'error'; message: string; confidence?: number }>;
}

const resolveFfmpeg = (): string => process.env.FFMPEG_PATH || 'ffmpeg';
const resolveFfprobe = (): string => process.env.FFPROBE_PATH || 'ffprobe';
const isDebugEnabled = (config: VisualQAConfig): boolean => config.debug === true || process.env.MPE_DEBUG === 'true';

const sampleFrame = async (videoPath: string, framePath: string, timestamp: number): Promise<void> => {
  fs.mkdirSync(path.dirname(framePath), { recursive: true });
  await execFileAsync(resolveFfmpeg(), ['-hide_banner', '-loglevel', 'error', '-ss', String(Math.max(0, timestamp)), '-i', videoPath, '-frames:v', '1', '-y', framePath], { maxBuffer: 1024 * 1024 * 10 });
};

const detectBlackFrame = async (videoPath: string, timestamp: number): Promise<boolean> => {
  try {
    const result = await execFileAsync(resolveFfmpeg(), ['-hide_banner', '-ss', String(Math.max(0, timestamp)), '-i', videoPath, '-frames:v', '1', '-vf', 'signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'], { maxBuffer: 1024 * 1024 * 10 });
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    const match = output.match(/(?:YAVG|lavfi\.signalstats\.YAVG)=([0-9.]+)/);
    if (!match) return false;
    return Number(match[1]) < 4;
  } catch {
    return false;
  }
};

const intersectionBox = (first: BoundingBox, second: BoundingBox): BoundingBox => ({
  x: Math.max(first.x, second.x),
  y: Math.max(first.y, second.y),
  width: Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x)),
  height: Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y)),
});

const intersectionArea = (first: BoundingBox, second: BoundingBox): number => {
  const box = intersectionBox(first, second);
  return box.width * box.height;
};

const toIssue = (
  type: string,
  severity: VisualIssue['severity'],
  element: string,
  scene: string,
  measuredValue: number | string | boolean,
  expectedValue: number | string | boolean,
  suggestedRepair: string,
  reason: string,
): VisualIssue => ({ type, severity, element, scene, measuredValue, expectedValue, suggestedRepair, reason });

const constraintToIssue = (sceneId: string, constraint: ConstraintResult): VisualIssue | null => {
  if (constraint.passed) return null;
  const element = constraint.blockIds?.join(', ') || 'scene';
  const details = constraint.details || {};
  switch (constraint.code) {
    case 'SAFE_FRAME':
      return toIssue('overflow', 'error', element, sceneId, `${details.x ?? ''},${details.y ?? ''},${details.width ?? ''}x${details.height ?? ''}`, 'inside safe frame', 'Reduce scale or move the block inside the safe frame.', 'The element crosses the configured safe area and may be clipped.');
    case 'MIN_READABLE_SIZE':
      return toIssue('unreadable-size', 'error', element, sceneId, Number(details.scale || 0), '>= configured minimum scale', 'Increase available area, wrap the formula semantically, or split the scene; do not shrink the primary formula further.', 'The element is below the minimum readable scale.');
    case 'NO_OVERLAP':
      return toIssue('collision', 'error', element, sceneId, Number(details.overlap || 0), 0, 'Increase the gap or switch to a non-overlapping scene template.', 'Two visual blocks occupy the same pixels.');
    case 'CHART_CONTAINMENT':
      return toIssue('chart-containment', 'error', element, sceneId, 'outside container', 'inside chart container and safe frame', 'Reduce chart size or move its anchor into the declared container.', 'The chart is not fully contained by its visual region.');
    case 'VISUAL_DENSITY':
      return toIssue('excessive-density', 'warning', element, sceneId, Number(details.density || 0), Number(details.maxDensity || 0), 'Hide secondary content, reduce caption length, or split the scene.', 'The scene contains more visual mass than the design token allows.');
    default:
      return toIssue(constraint.code.toLowerCase(), constraint.severity, element, sceneId, constraint.message, 'constraint passed', 'Apply the constraint-specific repair suggested by the layout engine.', constraint.message);
  }
};

const diagnosticToIssue = (diagnostic: LayoutDiagnostic): VisualIssue => toIssue(
  diagnostic.code.toLowerCase(),
  diagnostic.severity,
  diagnostic.blockIds?.join(', ') || 'scene',
  diagnostic.sceneId || 'plan',
  diagnostic.message,
  'diagnostic resolved',
  diagnostic.code === 'FORMULA_REQUIRES_SCENE_SPLIT' ? 'Split the expression into semantic scenes before rendering.' : 'Apply the layout diagnostic repair and revalidate.',
  diagnostic.message,
);

const geometryIssues = (scene: VisualSceneSpec, safeArea: BoundingBox): VisualIssue[] => {
  const resolved = scene.blocks.filter((block) => block.resolved).map((block) => ({ block, bbox: block.resolved?.bbox as BoundingBox }));
  const issues: VisualIssue[] = [];
  const safeAreaArea = Math.max(0.001, safeArea.width * safeArea.height);
  const occupiedArea = resolved.reduce((sum, item) => sum + item.bbox.width * item.bbox.height, 0);
  const occupancy = occupiedArea / safeAreaArea;

  if (resolved.length > 0 && occupancy < 0.08) {
    issues.push(toIssue('excessive-empty-space', 'warning', 'scene', scene.id, Number(occupancy.toFixed(3)), '>= 0.08 occupied safe-area ratio', 'Scale the primary content up or use a balanced composition template while preserving safe margins.', 'The scene leaves excessive unused space relative to its available canvas.'));
  }

  const margins = resolved.map(({ bbox }) => ({ left: bbox.x - safeArea.x, top: bbox.y - safeArea.y, right: safeArea.x + safeArea.width - bbox.x - bbox.width, bottom: safeArea.y + safeArea.height - bbox.y - bbox.height }));
  if (margins.length > 1) {
    const horizontalSpread = Math.max(...margins.map((margin) => Math.abs(margin.left - margin.right)));
    if (horizontalSpread > safeArea.width * 0.18) {
      issues.push(toIssue('inconsistent-margins', 'warning', 'scene', scene.id, Number(horizontalSpread.toFixed(3)), `<= ${(safeArea.width * 0.18).toFixed(3)}`, 'Align the block group to the same safe-area anchor and preserve a consistent outer margin.', 'The visual group is noticeably off-balance horizontally.'));
    }
  }

  for (let index = 0; index < resolved.length; index += 1) {
    const first = resolved[index];
    for (let next = index + 1; next < resolved.length; next += 1) {
      const second = resolved[next];
      if (intersectionArea(first.bbox, second.bbox) > 0) continue;
      const horizontalGap = Math.max(second.bbox.x - (first.bbox.x + first.bbox.width), first.bbox.x - (second.bbox.x + second.bbox.width), 0);
      const verticalGap = Math.max(second.bbox.y - (first.bbox.y + first.bbox.height), first.bbox.y - (second.bbox.y + second.bbox.height), 0);
      const gap = Math.max(horizontalGap, verticalGap);
      if (gap > safeArea.height * 0.4) {
        issues.push(toIssue('excessive-distance', 'warning', `${first.block.id},${second.block.id}`, scene.id, Number(gap.toFixed(3)), `<= ${(safeArea.height * 0.4).toFixed(3)}`, 'Use a closer group arrangement or add an intentional connector/label between the blocks.', 'Related elements are separated by a distance that weakens their semantic relationship.'));
      }
    }
  }

  const primary = resolved.filter(({ block }) => block.priority === 'primary');
  const secondary = resolved.filter(({ block }) => block.priority === 'secondary');
  if (primary.length && secondary.length) {
    const primaryScale = Math.min(...primary.map(({ block }) => block.resolved?.scale || 0));
    const secondaryScale = Math.max(...secondary.map(({ block }) => block.resolved?.scale || 0));
    if (primaryScale + 0.02 < secondaryScale) {
      issues.push(toIssue('hierarchy-scale', 'warning', primary.map(({ block }) => block.id).join(', '), scene.id, Number(primaryScale.toFixed(3)), `>= secondary max scale ${secondaryScale.toFixed(3)}`, 'Increase the primary block scale or reduce secondary content so the intended hierarchy is visually obvious.', 'A secondary element is larger than the primary mathematical object.'));
    }
  }

  return issues;
};

const aggregateScores = (scores: VisualScore[]): VisualScore => {
  if (!scores.length) return { total: 0, geometry: 0, readability: 0, hierarchy: 0, spacing: 0, consistency: 0, density: 0, semanticClarity: 0, critical: true };
  const average = (key: keyof Omit<VisualScore, 'critical'>): number => Math.round(scores.reduce((sum, score) => sum + Number(score[key]), 0) / scores.length);
  return {
    total: average('total'),
    geometry: average('geometry'),
    readability: average('readability'),
    hierarchy: average('hierarchy'),
    spacing: average('spacing'),
    consistency: average('consistency'),
    density: average('density'),
    semanticClarity: average('semanticClarity'),
    critical: scores.some((score) => score.critical),
  };
};

const buildDebugOverlay = (scene: VisualSceneSpec, safeArea: BoundingBox, score: VisualScore, iteration: number): VisualDebugOverlaySpec => {
  const blocks = scene.blocks.filter((block) => block.resolved && block.resolved.bbox);
  const collisions: VisualDebugOverlaySpec['collisions'] = [];
  const overflows: string[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const first = blocks[index];
    const firstBox = first.resolved?.bbox;
    if (!firstBox) continue;
    const inside = firstBox.x >= safeArea.x && firstBox.y >= safeArea.y && firstBox.x + firstBox.width <= safeArea.x + safeArea.width && firstBox.y + firstBox.height <= safeArea.y + safeArea.height;
    if (!inside) overflows.push(first.id);
    for (let next = index + 1; next < blocks.length; next += 1) {
      const second = blocks[next];
      const secondBox = second.resolved?.bbox;
      if (!secondBox || first.preferredLayout === 'overlay' || second.preferredLayout === 'overlay') continue;
      const overlap = intersectionBox(firstBox, secondBox);
      if (overlap.width > 0 && overlap.height > 0) collisions.push({ firstId: first.id, secondId: second.id, bbox: overlap });
    }
  }
  return {
    enabled: true,
    sceneId: scene.id,
    safeArea,
    guides: [safeArea, { x: safeArea.x, y: 0, width: safeArea.width, height: 0 }, { x: 0, y: safeArea.y, width: 0, height: safeArea.height }],
    elements: blocks.map((block) => ({ id: block.id, bbox: block.resolved?.bbox as BoundingBox, priority: block.priority, role: block.semanticRole })),
    collisions,
    overflows,
    visualScore: score,
    repairIteration: iteration,
  };
};

const diagnosticsFromReviewer = (result: VisualReviewerResult): AIVisualReview['diagnostics'] => result.issues.map((issue) => ({
  category: issue.type.includes('read') ? 'readability' : issue.type.includes('hierarchy') ? 'hierarchy' : issue.type.includes('density') ? 'density' : 'clarity',
  severity: issue.severity,
  message: `${issue.element}: ${issue.reason} Repair: ${issue.suggestedRepair}`,
}));

export const auditRenderedVideo = async (
  videoPath: string,
  plan: PresentationPlan,
  outputDir: string,
  config: VisualQAConfig = {},
): Promise<VisualQAReport> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const issues: VisualIssue[] = [];
  const sceneReports: VisualQAReport['sceneReports'] = [];
  const debugOverlays: VisualDebugOverlaySpec[] = [];
  const canvas = createPresentationCanvas(plan.canvas);
  const tokens = createMathDesignTokens(plan.canvas);

  if (!fs.existsSync(videoPath)) {
    return { engineVersion: plan.engineVersion, sceneReports: [], aiReviews: [], issues: [toIssue('missing-video', 'error', 'video', 'plan', false, true, 'Render the video before running Visual QA.', 'The output video does not exist.')], score: plan.score, errors: [`No existe el video para QA: ${videoPath}`], warnings, passed: false };
  }

  let metadata: any = null;
  try {
    const { stdout } = await execFileAsync(resolveFfprobe(), ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', videoPath], { maxBuffer: 1024 * 1024 * 10 });
    metadata = JSON.parse(stdout);
  } catch (error) {
    const message = `No se pudo leer metadata del video: ${error instanceof Error ? error.message : String(error)}`;
    errors.push(message);
    issues.push(toIssue('metadata-unavailable', 'error', 'video', 'plan', false, true, 'Regenerate the final media and verify FFprobe access.', message));
  }

  const videoStream = metadata?.streams?.find((stream: any) => stream.codec_type === 'video');
  const expectedRatio = plan.canvas.width / plan.canvas.height;
  const actualRatio = videoStream?.width && videoStream?.height ? videoStream.width / videoStream.height : 0;
  if (!videoStream || videoStream.width !== plan.canvas.width || videoStream.height !== plan.canvas.height || Math.abs(actualRatio - expectedRatio) > 0.01) {
    const message = `La metadata del video no coincide con el canvas esperado (${plan.canvas.width}x${plan.canvas.height}).`;
    errors.push(message);
    issues.push(toIssue('aspect-ratio', 'error', 'video', 'plan', actualRatio || 'unknown', expectedRatio, 'Render with the selected format profile and reject any resize that changes its aspect ratio.', message));
  }

  let cursor = 0;
  for (const layout of plan.resolvedLayouts) {
    const scene = plan.scenes.find((candidate) => candidate.id === layout.sceneId);
    if (!scene) continue;
    const validation = validateResolvedScene(scene, layout, canvas, tokens, config.scoreWeights);
    const sceneIssues = validation.constraints.map((constraint) => constraintToIssue(scene.id, constraint)).filter((issue): issue is VisualIssue => Boolean(issue));
    sceneIssues.push(...validation.diagnostics.map(diagnosticToIssue));
    sceneIssues.push(...geometryIssues(scene, canvas.safeArea));
    issues.push(...sceneIssues);
    const duration = scene.duration.seconds || 4;
    const timestamp = cursor + Math.min(duration / 2, Math.max(0.2, duration - 0.2));
    const framePath = path.join(outputDir, 'qa-frames', `${layout.sceneId}.jpg`);
    try {
      await sampleFrame(videoPath, framePath, timestamp);
      if (!fs.existsSync(framePath) || fs.statSync(framePath).size === 0) {
        errors.push(`No se pudo crear frame QA para ${layout.sceneId}.`);
        issues.push(toIssue('frame-capture', 'error', 'scene-frame', scene.id, false, true, 'Capture a representative frame after the render is complete.', 'The QA frame could not be created.'));
      }
    } catch (error) {
      const message = `Falló captura QA de ${layout.sceneId}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(message);
      issues.push(toIssue('frame-capture', 'error', 'scene-frame', scene.id, false, true, 'Capture a representative frame after the render is complete.', message));
    }
    if (await detectBlackFrame(videoPath, timestamp)) {
      const message = `El frame central de ${layout.sceneId} puede estar vacío o casi negro.`;
      warnings.push(message);
      issues.push(toIssue('black-frame', 'warning', 'scene-frame', scene.id, '< 4 YAVG', 'visible scene content', 'Inspect the scene timing and ensure the visual objects are shown while narration is active.', message));
    }
    sceneReports.push({ sceneId: layout.sceneId, constraints: validation.constraints, score: validation.score, sampleFrames: [framePath] });
    if (isDebugEnabled(config)) debugOverlays.push(buildDebugOverlay(scene, canvas.safeArea, validation.score, 0));
    cursor += duration;
  }

  const planDiagnostics = plan.diagnostics.map(diagnosticToIssue);
  issues.push(...planDiagnostics);
  const aiReviews: NonNullable<VisualQAReport['aiReviews']> = [];
  if (config.reviewer) {
    for (const report of sceneReports) {
      const scene = plan.scenes.find((candidate) => candidate.id === report.sceneId);
      if (!scene || !report.sampleFrames?.[0]) continue;
      try {
        const result = await config.reviewer.review({ screenshotPath: report.sampleFrames[0], scene, plan, pedagogicalObjective: scene.purpose, solutionContext: scene.blocks.map((block) => block.content).join(' → ') });
        issues.push(...result.issues);
        aiReviews.push({ sceneId: scene.id, status: 'completed', diagnostics: diagnosticsFromReviewer(result) });
      } catch (error) {
        aiReviews.push({ sceneId: scene.id, status: 'failed', diagnostics: [{ category: 'clarity', severity: 'warning', message: `El reviewer multimodal falló: ${error instanceof Error ? error.message : String(error)}` }] });
      }
    }
  } else {
    aiReviews.push(...sceneReports.map((report) => ({ sceneId: report.sceneId, status: 'skipped' as const, diagnostics: [{ category: 'clarity', severity: 'info' as const, message: 'El reviewer multimodal es opcional y no está habilitado en este entorno.' }] })));
  }

  const score = aggregateScores(sceneReports.map((report) => report.score));
  return {
    engineVersion: plan.engineVersion,
    sceneReports,
    aiReviews,
    issues,
    score,
    debugOverlays: isDebugEnabled(config) ? debugOverlays : undefined,
    repairIterations: 0,
    errors,
    warnings,
    passed: errors.length === 0 && !issues.some((issue) => issue.severity === 'error') && plan.passed,
  };
};

export const reviewFrameWithOptionalAI = (): AIVisualReview => ({
  enabled: process.env.AI_VISUAL_REVIEWER === 'true',
  status: 'skipped',
  diagnostics: [{ category: 'clarity', severity: 'info', message: 'El revisor multimodal es opcional y no está habilitado en este entorno.' }],
});
