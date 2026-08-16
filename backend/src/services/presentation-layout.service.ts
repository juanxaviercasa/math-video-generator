import type { MathDesignTokens, PresentationCanvas } from './presentation-design.service.js';
import type { BoundingBox, LayoutDiagnostic, VisualBlockSpec, VisualSceneSpec } from './presentation.types.js';

export interface FormulaFitResult {
  scale: number;
  mode: 'normal' | 'reduced' | 'fit-width' | 'wrapped' | 'split-scene';
  lines: string[];
  width: number;
  height: number;
  diagnostics: LayoutDiagnostic[];
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const estimateTextWidth = (content: string, fontSize: number): number => {
  const normalized = content.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2').replace(/\\sqrt\{([^{}]*)\}/g, '√$1');
  const wideSymbols = (normalized.match(/[=±√Δ]/g) || []).length;
  return Math.max(0.45, normalized.length * fontSize * 0.018 + wideSymbols * 0.12);
};

const estimateTextHeight = (content: string, fontSize: number): number => {
  const lines = Math.max(1, content.split(/\\n|\n/).length);
  return Math.max(0.28, lines * fontSize * 0.035);
};

export const measureBlock = (block: VisualBlockSpec, tokens: MathDesignTokens): BoundingBox => {
  const baseSize = block.semanticRole === 'result' ? tokens.typography.result : block.semanticRole === 'formula-base' ? tokens.typography.reference : block.semanticRole === 'caption' || block.semanticRole === 'explanation' ? tokens.typography.caption : tokens.typography.active;
  const width = estimateTextWidth(block.content, baseSize);
  const height = estimateTextHeight(block.content, baseSize);
  return { x: 0, y: 0, width, height };
};

export const fitFormula = (content: string, availableWidth: number, availableHeight: number, tokens: MathDesignTokens): FormulaFitResult => {
  const normalWidth = estimateTextWidth(content, tokens.typography.active);
  const normalHeight = estimateTextHeight(content, tokens.typography.active);
  const diagnostics: LayoutDiagnostic[] = [];
  if (normalWidth <= availableWidth && normalHeight <= availableHeight) {
    return { scale: 1, mode: 'normal', lines: [content], width: normalWidth, height: normalHeight, diagnostics };
  }

  const reducedScale = Math.min(0.86, availableWidth / normalWidth, availableHeight / normalHeight);
  if (reducedScale >= tokens.minFormulaScale) {
    return { scale: reducedScale, mode: 'reduced', lines: [content], width: normalWidth * reducedScale, height: normalHeight * reducedScale, diagnostics };
  }

  const widthScale = availableWidth / normalWidth;
  if (widthScale >= tokens.minFormulaScale) {
    return { scale: widthScale, mode: 'fit-width', lines: [content], width: availableWidth, height: normalHeight * widthScale, diagnostics };
  }

  const tokensBySpace = content.split(/\s+/).filter(Boolean);
  if (tokensBySpace.length >= 4) {
    const midpoint = Math.ceil(tokensBySpace.length / 2);
    const lines = [tokensBySpace.slice(0, midpoint).join(' '), tokensBySpace.slice(midpoint).join(' ')];
    const wrappedWidth = Math.max(...lines.map((line) => estimateTextWidth(line, tokens.typography.active)));
    const wrappedHeight = normalHeight * 1.9;
    const wrappedScale = Math.min(1, availableWidth / wrappedWidth, availableHeight / wrappedHeight);
    if (wrappedScale >= tokens.minFormulaScale) {
      diagnostics.push({ code: 'FORMULA_WRAPPED', severity: 'warning', message: 'La fórmula se dividió en líneas estructurales.' });
      return { scale: wrappedScale, mode: 'wrapped', lines, width: wrappedWidth * wrappedScale, height: wrappedHeight * wrappedScale, diagnostics };
    }
  }

  diagnostics.push({ code: 'FORMULA_REQUIRES_SCENE_SPLIT', severity: 'error', message: 'La fórmula no conserva un tamaño legible dentro del área disponible.' });
  return { scale: tokens.minFormulaScale, mode: 'split-scene', lines: [content], width: normalWidth * tokens.minFormulaScale, height: normalHeight * tokens.minFormulaScale, diagnostics };
};

const arrangeVertical = (blocks: VisualBlockSpec[], area: BoundingBox, gap: number): VisualBlockSpec[] => {
  const totalHeight = blocks.reduce((sum, block) => sum + (block.measured?.height || 0), 0) + Math.max(0, blocks.length - 1) * gap;
  const maxWidth = Math.max(0.01, ...blocks.map((block) => block.measured?.width || 0));
  const scale = clamp(Math.min(1, area.height / Math.max(0.01, totalHeight), area.width / maxWidth), 0.01, 1);
  const scaledGap = gap * scale;
  const scaledHeight = totalHeight * scale;
  let cursor = area.y + (area.height - scaledHeight) / 2;
  return blocks.map((block) => {
    const measured = block.measured || { x: 0, y: 0, width: 0, height: 0 };
    const width = measured.width * scale;
    const height = measured.height * scale;
    const resolved = { x: area.x + (area.width - width) / 2, y: cursor, width, height };
    cursor += height + scaledGap;
    block.resolved = { bbox: resolved, scale, visibleFrom: 0, visibleUntil: Number.POSITIVE_INFINITY };
    return block;
  });
};

const arrangeHorizontal = (blocks: VisualBlockSpec[], area: BoundingBox, gap: number): VisualBlockSpec[] => {
  const totalWidth = blocks.reduce((sum, block) => sum + (block.measured?.width || 0), 0) + Math.max(0, blocks.length - 1) * gap;
  const maxHeight = Math.max(0.01, ...blocks.map((block) => block.measured?.height || 0));
  const scale = clamp(Math.min(1, area.width / Math.max(0.01, totalWidth), area.height / maxHeight), 0.01, 1);
  const scaledGap = gap * scale;
  const scaledWidth = totalWidth * scale;
  let cursor = area.x + (area.width - scaledWidth) / 2;
  return blocks.map((block) => {
    const measured = block.measured || { x: 0, y: 0, width: 0, height: 0 };
    const width = measured.width * scale;
    const height = measured.height * scale;
    const resolved = { x: cursor, y: area.y + (area.height - height) / 2, width, height };
    cursor += width + scaledGap;
    block.resolved = { bbox: resolved, scale, visibleFrom: 0, visibleUntil: Number.POSITIVE_INFINITY };
    return block;
  });
};

const arrangeGrid = (blocks: VisualBlockSpec[], area: BoundingBox, gap: number): VisualBlockSpec[] => {
  const columns = Math.max(1, Math.ceil(Math.sqrt(blocks.length)));
  const rows = Math.ceil(blocks.length / columns);
  const cellWidth = (area.width - gap * (columns - 1)) / columns;
  const cellHeight = (area.height - gap * (rows - 1)) / rows;
  return blocks.map((block, index) => {
    const measured = block.measured || { x: 0, y: 0, width: 0, height: 0 };
    const column = index % columns;
    const row = Math.floor(index / columns);
    const scale = clamp(Math.min(cellWidth / measured.width, cellHeight / measured.height, 1), 0.01, 1);
    const width = measured.width * scale;
    const height = measured.height * scale;
    const resolved = { x: area.x + column * (cellWidth + gap) + (cellWidth - width) / 2, y: area.y + row * (cellHeight + gap) + (cellHeight - height) / 2, width, height };
    block.resolved = { bbox: resolved, scale, visibleFrom: 0, visibleUntil: Number.POSITIVE_INFINITY };
    return block;
  });
};

export const resolveSceneLayout = (scene: VisualSceneSpec, canvas: PresentationCanvas, tokens: MathDesignTokens): { blocks: VisualBlockSpec[]; diagnostics: LayoutDiagnostic[] } => {
  const diagnostics: LayoutDiagnostic[] = [];
  const blocks = scene.blocks.map((block) => ({ ...block, measured: measureBlock(block, tokens) }));
  const formulaBlocks = blocks.filter((block) => ['formula-base', 'substitution', 'operation', 'result'].includes(block.semanticRole));
  const formulaArea = { ...canvas.safeArea, y: canvas.safeArea.y + 0.45, height: Math.max(0.5, canvas.safeArea.height - 0.9) };

  for (const block of formulaBlocks) {
    const fitted = fitFormula(block.content, formulaArea.width, formulaArea.height / Math.max(1, formulaBlocks.length), tokens);
    const measured = block.measured || { x: 0, y: 0, width: 0, height: 0 };
    block.measured = { ...measured, width: fitted.width, height: fitted.height };
    diagnostics.push(...fitted.diagnostics.map((diagnostic) => ({ ...diagnostic, sceneId: scene.id, blockIds: [block.id] })));
    if (fitted.mode === 'split-scene') block.canSplit = true;
  }

  switch (scene.layout) {
    case 'horizontal-stack':
    case 'comparison':
      arrangeHorizontal(blocks, formulaArea, tokens.spacing.row);
      break;
    case 'grid':
      arrangeGrid(blocks, formulaArea, tokens.spacing.row);
      break;
    case 'left':
    case 'right':
      arrangeVertical(blocks, formulaArea, tokens.spacing.block);
      blocks.forEach((block) => {
        if (block.resolved) block.resolved.bbox.x = scene.layout === 'left' ? formulaArea.x : formulaArea.x + formulaArea.width - block.resolved.bbox.width;
      });
      break;
    case 'top':
    case 'bottom':
    case 'center':
    case 'overlay':
    case 'vertical-stack':
    case 'equation-block':
    case 'step-by-step':
    case 'chart-explanation':
    case 'formula-derivation':
    default:
      arrangeVertical(blocks, formulaArea, tokens.spacing.stage);
      break;
  }

  const density = blocks.reduce((sum, block) => sum + ((block.resolved?.bbox.width || 0) * (block.resolved?.bbox.height || 0)), 0) / (canvas.safeArea.width * canvas.safeArea.height);
  scene.density = density;
  if (density > tokens.maxDensity) {
    diagnostics.push({ code: 'DENSITY_HIGH', severity: 'warning', sceneId: scene.id, message: 'La escena supera la densidad visual recomendada.', details: { density } });
  }

  return { blocks, diagnostics };
};
