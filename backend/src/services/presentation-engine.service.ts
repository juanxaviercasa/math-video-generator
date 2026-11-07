import { createHash } from 'node:crypto';
import type { MathValidation } from './math-validation.service.js';
import type { PedagogicalScene } from './pedagogy.service.js';
import type { SynchronizedScene } from './synchronization.service.js';
import { buildMathematicalSolutionStructure } from './math-ast.service.js';
import { createMathDesignTokens, createPresentationCanvas } from './presentation-design.service.js';
import { resolveSceneLayout } from './presentation-layout.service.js';
import { calculateVisualScore, validateSceneConstraints } from './presentation-constraint.service.js';
import type { LayoutDiagnostic, PresentationPlan, VisualBlockRole, VisualLayout, VisualSceneSpec } from './presentation.types.js';
import type { VideoAspectRatio, VideoQuality } from './video-format.service.js';
import { getVideoFormatProfile } from './video-format.service.js';

const hashSolution = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

const scenePurpose = (scene: PedagogicalScene): VisualSceneSpec['purpose'] => {
  if (scene.id === 'hook') return 'hook';
  if (scene.id === 'coefficients') return 'identify';
  if (scene.id.includes('discriminant') || scene.id.includes('formula')) return scene.id.includes('calculate') || scene.id.includes('simplify') ? 'operate' : 'substitute';
  if (scene.id.includes('solution')) return 'solve';
  if (scene.id === 'graph') return 'verify';
  if (scene.id === 'recap') return 'recap';
  return 'operate';
};

const roleForStage = (index: number, total: number, label: string): VisualBlockRole => {
  if (index === 0 || /base|partida|general/i.test(label)) return 'formula-base';
  if (index === total - 1 || /resultado|solución|camino/i.test(label)) return 'result';
  if (/reemplaz|sustitu/i.test(label)) return 'substitution';
  return 'operation';
};

const layoutForScene = (scene: PedagogicalScene): VisualLayout => {
  if (scene.id === 'graph') return 'chart-explanation';
  if (scene.id === 'coefficients') return 'grid';
  if (scene.id === 'solution-branches') return 'comparison';
  if (scene.visualStages && scene.visualStages.length > 0) return scene.visualStages.length >= 4 ? 'formula-derivation' : 'equation-block';
  if (scene.layout === 'split') return 'comparison';
  if (scene.layout === 'card') return 'grid';
  if (scene.layout === 'hero') return 'center';
  if (scene.layout === 'recap') return 'horizontal-stack';
  return 'vertical-stack';
};

const buildBlocks = (scene: PedagogicalScene): VisualSceneSpec['blocks'] => {
  const blocks: VisualSceneSpec['blocks'] = [];
  const stages = scene.visualStages || [];
  if (stages.length) {
    stages.forEach((stage, index) => {
      blocks.push({
        id: `${scene.id}-stage-${index + 1}`,
        semanticRole: roleForStage(index, stages.length, stage.label),
        content: stage.latex,
        styleToken: roleForStage(index, stages.length, stage.label),
        priority: index === stages.length - 1 ? 'primary' : index === 0 ? 'secondary' : 'tertiary',
        alignment: 'center',
        preferredLayout: stages.length >= 4 ? 'formula-derivation' : 'vertical-stack',
        canSplit: true,
        minReadableSize: 0.38,
        relations: index > 0 ? [{ type: 'below', targetId: `${scene.id}-stage-${index}`, gap: 0.22 }] : [],
      });
    });
    return blocks;
  }

  (scene.visualLatex || []).forEach((line, index, lines) => {
    const role: VisualBlockRole = index === 0 ? 'formula-base' : index === lines.length - 1 ? 'result' : 'operation';
    blocks.push({
      id: `${scene.id}-formula-${index + 1}`,
      semanticRole: role,
      content: line,
      styleToken: role,
      priority: role === 'result' ? 'primary' : role === 'formula-base' ? 'secondary' : 'tertiary',
      alignment: 'center',
      preferredLayout: 'vertical-stack',
      canSplit: true,
      minReadableSize: 0.38,
    });
  });

  (scene.visualTextLines || []).forEach((line, index) => {
    blocks.push({
      id: `${scene.id}-caption-${index + 1}`,
      semanticRole: 'caption',
      content: line,
      styleToken: 'caption',
      priority: 'tertiary',
      alignment: 'center',
      preferredLayout: 'bottom',
      canSplit: false,
      minReadableSize: 0.42,
    });
  });
  return blocks;
};

export const buildPresentationPlan = ({
  problem,
  validation,
  pedagogicalScenes,
  aspectRatio = '16:9',
  quality = 'medium',
  density = 'comfortable',
}: {
  problem: string;
  validation: MathValidation;
  pedagogicalScenes: PedagogicalScene[];
  aspectRatio?: VideoAspectRatio;
  quality?: VideoQuality;
  density?: 'comfortable' | 'compact';
}): PresentationPlan => {
  const profile = getVideoFormatProfile(aspectRatio, quality);
  const canvas = createPresentationCanvas(profile);
  const tokens = createMathDesignTokens(profile, density);
  const solution = buildMathematicalSolutionStructure(problem, validation);
  const scenes: VisualSceneSpec[] = pedagogicalScenes.map((pedScene) => ({
    id: pedScene.id,
    purpose: scenePurpose(pedScene),
    canvas: profile,
    safeArea: canvas.safeArea,
    layout: layoutForScene(pedScene),
    blocks: buildBlocks(pedScene),
    duration: { min: 4, max: Math.max(4, pedScene.estimatedDuration), source: pedScene.duration ? 'tts' : 'hybrid', seconds: pedScene.duration || pedScene.estimatedDuration },
    transition: { enter: pedScene.kind === 'formula' ? 'write' : 'fade', exit: 'fade' },
    constraints: ['SAFE_FRAME', 'NO_OVERLAP', 'MIN_READABLE_SIZE', 'VISUAL_DENSITY'],
  }));

  const resolvedLayouts = scenes.map((scene) => {
    const resolved = resolveSceneLayout(scene, canvas, tokens);
    scene.blocks = resolved.blocks;
    const checked = validateSceneConstraints(scene, canvas, tokens);
    const constraintDiagnostics = checked.constraints.filter((constraint) => !constraint.passed).map((constraint) => ({
      code: constraint.code,
      severity: constraint.severity === 'error' ? 'error' as const : 'warning' as const,
      sceneId: scene.id,
      blockIds: constraint.blockIds,
      message: constraint.message,
      details: constraint.details,
    }));
    return {
      sceneId: scene.id,
      blocks: scene.blocks.flatMap((block) => block.resolved ? [{ blockId: block.id, ...block.resolved }] : []),
      diagnostics: [...resolved.diagnostics, ...checked.diagnostics, ...constraintDiagnostics],
      score: checked.score,
    };
  });

  const diagnostics: LayoutDiagnostic[] = resolvedLayouts.flatMap((layout) => layout.diagnostics);
  const score = calculateVisualScore(
    resolvedLayouts.flatMap((layout) => layout.diagnostics.map((diagnostic) => ({ code: diagnostic.code, passed: diagnostic.severity !== 'error', severity: diagnostic.severity === 'error' ? 'error' : 'warning', message: diagnostic.message }))),
    scenes.reduce((sum, scene) => sum + (scene.density || 0), 0) / Math.max(1, scenes.length),
    scenes.reduce((sum, scene) => sum + scene.blocks.length, 0),
    diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
  );
  const hardErrors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');

  return {
    engineVersion: 'math-presentation-engine-v1',
    designVersion: tokens.version,
    solutionHash: hashSolution(solution),
    mathematicalSupport: { supported: validation.supported, valid: validation.valid, kind: validation.kind, warnings: validation.warnings },
    canvas: profile,
    scenes,
    resolvedLayouts,
    diagnostics,
    score,
    passed: hardErrors.length === 0,
  };
};

export const buildPresentationPlanFromSynchronizedScenes = ({
  problem,
  validation,
  synchronizedScenes,
  aspectRatio = '16:9',
  quality = 'medium',
  density = 'comfortable',
}: {
  problem: string;
  validation: MathValidation;
  synchronizedScenes: SynchronizedScene[];
  aspectRatio?: VideoAspectRatio;
  quality?: VideoQuality;
  density?: 'comfortable' | 'compact';
}): PresentationPlan => {
  const pedagogicalScenes: PedagogicalScene[] = synchronizedScenes.map((scene) => ({
    id: scene.id,
    kind: scene.kind,
    visualText: scene.visualText,
    visualTextLines: scene.visualText ? [scene.visualText] : [],
    visualLatex: scene.kind === 'formula' ? [scene.visualText] : [],
    narrationText: scene.narrationText,
    estimatedDuration: scene.estimatedDuration,
    duration: scene.duration,
    emphasis: scene.visualText,
    layout: scene.kind === 'formula' ? 'equation' : scene.kind === 'graph' ? 'graph' : scene.kind === 'conclusion' ? 'recap' : scene.kind === 'intro' ? 'hero' : 'card',
  }));
  return buildPresentationPlan({ problem, validation, pedagogicalScenes, aspectRatio, quality, density });
};

export const repairPresentationPlan = (plan: PresentationPlan, maxIterations = 3): PresentationPlan => {
  let current = plan;
  for (let iteration = 0; iteration < maxIterations && !current.passed; iteration += 1) {
    const repairedScenes = current.scenes.map((scene) => ({
      ...scene,
      blocks: scene.blocks.map((block) => ({ ...block, minReadableSize: Math.max(0.38, block.minReadableSize - 0.02) })),
    }));
    const canvas = createPresentationCanvas(current.canvas);
    const tokens = createMathDesignTokens(current.canvas, current.canvas.orientation === 'portrait' ? 'compact' : 'comfortable');
    const resolvedLayouts = repairedScenes.map((scene) => {
      const resolved = resolveSceneLayout(scene, canvas, tokens);
      scene.blocks = resolved.blocks;
      const checked = validateSceneConstraints(scene, canvas, tokens);
      const constraintDiagnostics = checked.constraints.filter((constraint) => !constraint.passed).map((constraint) => ({ code: constraint.code, severity: constraint.severity === 'error' ? 'error' as const : 'warning' as const, sceneId: scene.id, blockIds: constraint.blockIds, message: constraint.message, details: constraint.details }));
      return { sceneId: scene.id, blocks: scene.blocks.flatMap((block) => block.resolved ? [{ blockId: block.id, ...block.resolved }] : []), diagnostics: [...resolved.diagnostics, ...checked.diagnostics, ...constraintDiagnostics], score: checked.score };
    });
    const diagnostics = resolvedLayouts.flatMap((layout) => layout.diagnostics);
    current = { ...current, scenes: repairedScenes, resolvedLayouts, diagnostics, passed: !diagnostics.some((diagnostic) => diagnostic.severity === 'error') };
  }
  return current;
};
