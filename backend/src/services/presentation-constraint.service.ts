import type { MathDesignTokens, PresentationCanvas } from './presentation-design.service.js';
import { DEFAULT_VISUAL_SCORE_WEIGHTS, type BoundingBox, type ConstraintResult, type LayoutDiagnostic, type ResolvedSceneLayout, type VisualSceneSpec, type VisualScore, type VisualScoreWeights } from './presentation.types.js';

const intersectionArea = (a: BoundingBox, b: BoundingBox): number => {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
};

const inside = (box: BoundingBox, area: BoundingBox): boolean => {
  const epsilon = 1e-6;
  return box.x >= area.x - epsilon && box.y >= area.y - epsilon && box.x + box.width <= area.x + area.width + epsilon && box.y + box.height <= area.y + area.height + epsilon;
};

export const calculateVisualScore = (
  constraints: ConstraintResult[],
  density: number,
  blockCount: number,
  critical = false,
  configuredWeights: Partial<VisualScoreWeights> = {},
): VisualScore => {
  const weights = { ...DEFAULT_VISUAL_SCORE_WEIGHTS, ...configuredWeights };
  const errors = constraints.filter((constraint) => !constraint.passed && constraint.severity === 'error').length;
  const warnings = constraints.filter((constraint) => !constraint.passed && constraint.severity === 'warning').length;
  const geometry = constraints.filter((constraint) => ['SAFE_FRAME', 'NO_OVERLAP', 'CHART_CONTAINMENT'].includes(constraint.code) && constraint.passed).length >= 3 ? 100 : 68;
  const readability = constraints.some((constraint) => constraint.code === 'MIN_READABLE_SIZE' && !constraint.passed) ? 45 : 96;
  const hierarchy = blockCount > 0 ? 92 : 35;
  const spacing = density > 0.68 ? 52 : density > 0.5 ? 78 : 94;
  const consistency = warnings > 2 ? 78 : 94;
  const densityScore = Math.round(Math.max(0, Math.min(100, 100 - density * 100)));
  const semanticClarity = blockCount <= 8 ? 94 : 72;
  const weightedTotal = (
    geometry * weights.geometry
    + readability * weights.readability
    + hierarchy * weights.hierarchy
    + spacing * weights.spacing
    + consistency * weights.consistency
    + semanticClarity * weights.pedagogicalClarity
  ) / Math.max(1, Object.values(weights).reduce((sum, weight) => sum + Math.max(0, weight), 0));
  const total = Math.max(0, Math.min(100, Math.round(weightedTotal - errors * 8 - warnings * 2)));
  return { total, geometry, readability, hierarchy, spacing, consistency, density: densityScore, semanticClarity, critical: critical || errors > 0 };
};

export const validateSceneConstraints = (scene: VisualSceneSpec, canvas: PresentationCanvas, tokens: MathDesignTokens, configuredWeights: Partial<VisualScoreWeights> = {}): { constraints: ConstraintResult[]; diagnostics: LayoutDiagnostic[]; score: VisualScore } => {
  const constraints: ConstraintResult[] = [];
  const diagnostics: LayoutDiagnostic[] = [];
  const blocks = scene.blocks.filter((block) => block.resolved);
  const safeArea = canvas.safeArea;

  blocks.forEach((block) => {
    const box = block.resolved?.bbox;
    if (!box) return;
    const safe = inside(box, safeArea);
    constraints.push({ code: 'SAFE_FRAME', passed: safe, severity: 'error', message: safe ? 'El bloque permanece dentro del área segura.' : 'El bloque desborda el área segura.', blockIds: [block.id], details: { x: box.x, y: box.y, width: box.width, height: box.height } });
    if (!safe) diagnostics.push({ code: 'OVERFLOW', severity: 'error', sceneId: scene.id, blockIds: [block.id], message: 'El bloque sale del área segura.' });

    const readable = (block.resolved?.scale || 0) >= tokens.minFormulaScale || block.semanticRole === 'caption' || block.semanticRole === 'explanation';
    constraints.push({ code: 'MIN_READABLE_SIZE', passed: readable, severity: 'error', message: readable ? 'El bloque conserva escala legible.' : 'El bloque quedó por debajo de la escala mínima legible.', blockIds: [block.id], details: { scale: block.resolved?.scale || 0 } });
  });

  for (let index = 0; index < blocks.length; index += 1) {
    for (let next = index + 1; next < blocks.length; next += 1) {
      const first = blocks[index];
      const second = blocks[next];
      const firstBox = first.resolved?.bbox;
      const secondBox = second.resolved?.bbox;
      if (!firstBox || !secondBox) continue;
      const overlap = intersectionArea(firstBox, secondBox);
      const allowedOverlay = first.preferredLayout === 'overlay' || second.preferredLayout === 'overlay';
      const passed = overlap === 0 || allowedOverlay;
      constraints.push({ code: 'NO_OVERLAP', passed, severity: 'error', message: passed ? 'No hay colisión entre bloques.' : 'Dos bloques se superponen.', blockIds: [first.id, second.id], details: { overlap } });
      if (!passed) diagnostics.push({ code: 'COLLISION', severity: 'error', sceneId: scene.id, blockIds: [first.id, second.id], message: 'Se detectó una colisión entre bloques.', details: { overlap } });
    }
  }

  blocks.filter((block) => block.semanticRole === 'chart').forEach((block) => {
    const contained = block.resolved ? inside(block.resolved.bbox, safeArea) : false;
    constraints.push({ code: 'CHART_CONTAINMENT', passed: contained, severity: 'error', message: contained ? 'La gráfica permanece dentro de su contenedor.' : 'La gráfica sale de su contenedor.', blockIds: [block.id] });
  });

  const density = scene.density || 0;
  const densityPassed = density <= tokens.maxDensity;
  constraints.push({ code: 'VISUAL_DENSITY', passed: densityPassed, severity: 'warning', message: densityPassed ? 'La densidad visual está dentro del umbral.' : 'La densidad visual supera el umbral recomendado.', details: { density, maxDensity: tokens.maxDensity } });

  const critical = constraints.some((constraint) => !constraint.passed && constraint.severity === 'error');
  const score = calculateVisualScore(constraints, density, blocks.length, critical, configuredWeights);
  return { constraints, diagnostics, score };
};

export const validateResolvedScene = (scene: VisualSceneSpec, layout: ResolvedSceneLayout, canvas: PresentationCanvas, tokens: MathDesignTokens, configuredWeights: Partial<VisualScoreWeights> = {}): { constraints: ConstraintResult[]; diagnostics: LayoutDiagnostic[]; score: VisualScore } => {
  const clone: VisualSceneSpec = { ...scene, blocks: scene.blocks.map((block) => ({ ...block })) };
  clone.blocks.forEach((block) => {
    const resolved = layout.blocks.find((item) => item.blockId === block.id);
    if (resolved) block.resolved = resolved;
  });
  return validateSceneConstraints(clone, canvas, tokens, configuredWeights);
};
