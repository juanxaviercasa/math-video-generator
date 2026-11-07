import { repairPresentationPlan } from './presentation-engine.service.js';
import type { PresentationPlan, RepairAction, VisualIssue, VisualLayout } from './presentation.types.js';

export interface VisualRepairPlan {
  iteration: number;
  actions: RepairAction[];
  rationale: string[];
}

const actionForIssue = (issue: VisualIssue): RepairAction | null => {
  if (issue.repairAction) return issue.repairAction;
  const blockIds = issue.element === 'scene' || issue.element === 'video' || issue.element === 'scene-frame' ? undefined : issue.element.split(',').map((id) => id.trim()).filter(Boolean);
  switch (issue.type) {
    case 'overflow':
    case 'aspect-ratio':
    case 'chart-containment':
      return { type: 'reduce-scale', sceneId: issue.scene, blockIds, parameters: { factor: 0.88 }, reason: issue.suggestedRepair };
    case 'collision':
      return { type: 'change-template', sceneId: issue.scene, blockIds, parameters: { layout: 'vertical-stack' }, reason: issue.suggestedRepair };
    case 'unreadable-size':
      return { type: 'split-scene', sceneId: issue.scene, blockIds, reason: issue.suggestedRepair };
    case 'excessive-density':
    case 'excessive-empty-space':
      return { type: 'reduce-caption', sceneId: issue.scene, blockIds, parameters: { maxCharacters: 110 }, reason: issue.suggestedRepair };
    case 'excessive-distance':
    case 'inconsistent-margins':
      return { type: 'move-anchor', sceneId: issue.scene, blockIds, parameters: { layout: 'center' }, reason: issue.suggestedRepair };
    case 'hierarchy-scale':
      return { type: 'hide-secondary', sceneId: issue.scene, blockIds, reason: issue.suggestedRepair };
    default:
      return null;
  }
};

const dedupeActions = (actions: RepairAction[]): RepairAction[] => {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.type}:${action.sceneId}:${(action.blockIds || []).join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildVisualRepairPlan = (issues: VisualIssue[], iteration: number, maxActions = 8): VisualRepairPlan => {
  const sorted = [...issues].sort((first, second) => {
    const severity = { error: 0, warning: 1, info: 2 } as const;
    return severity[first.severity] - severity[second.severity];
  });
  const actions = dedupeActions(sorted.map(actionForIssue).filter((action): action is RepairAction => Boolean(action))).slice(0, maxActions);
  return {
    iteration,
    actions,
    rationale: sorted.slice(0, maxActions).map((issue) => `${issue.scene}/${issue.element}: ${issue.reason} Repair: ${issue.suggestedRepair}`),
  };
};

const selectedBlocks = (scene: PresentationPlan['scenes'][number], action: RepairAction) => {
  const ids = new Set(action.blockIds || scene.blocks.map((block) => block.id));
  return scene.blocks.filter((block) => ids.has(block.id));
};

const applyLayout = (scene: PresentationPlan['scenes'][number], layout: string): void => {
  const allowed: VisualLayout[] = ['top', 'bottom', 'left', 'right', 'center', 'grid', 'vertical-stack', 'horizontal-stack', 'overlay', 'equation-block', 'comparison', 'step-by-step', 'chart-explanation', 'formula-derivation'];
  if (allowed.includes(layout as VisualLayout)) scene.layout = layout as VisualLayout;
};

export const applyVisualRepairPlan = (plan: PresentationPlan, repairPlan: VisualRepairPlan): PresentationPlan => {
  if (!repairPlan.actions.length) return plan;
  const scenes = plan.scenes.map((sourceScene) => ({
    ...sourceScene,
    blocks: sourceScene.blocks.map((block) => ({ ...block, relations: block.relations?.map((relation) => ({ ...relation })) })),
  }));

  for (const action of repairPlan.actions) {
    const scene = scenes.find((candidate) => candidate.id === action.sceneId);
    if (!scene) continue;
    const blocks = selectedBlocks(scene, action);
    switch (action.type) {
      case 'reduce-scale':
        blocks.forEach((block) => {
          if (block.resolved) {
            const factor = Number(action.parameters?.factor || 0.88);
            block.resolved = { ...block.resolved, scale: block.resolved.scale * factor, bbox: { ...block.resolved.bbox, width: block.resolved.bbox.width * factor, height: block.resolved.bbox.height * factor } };
          }
        });
        break;
      case 'change-template':
        applyLayout(scene, String(action.parameters?.layout || 'vertical-stack'));
        break;
      case 'increase-gap':
        scene.blocks.forEach((block) => {
          block.relations = block.relations?.map((relation) => ({ ...relation, gap: Math.max(0.2, (relation.gap || 0.2) * 1.25) }));
        });
        applyLayout(scene, 'vertical-stack');
        break;
      case 'split-scene':
        applyLayout(scene, 'vertical-stack');
        blocks.forEach((block) => { block.canSplit = true; });
        break;
      case 'move-anchor':
        applyLayout(scene, String(action.parameters?.layout || 'center'));
        break;
      case 'reduce-caption':
        blocks.filter((block) => block.semanticRole === 'caption' || block.semanticRole === 'explanation').forEach((block) => {
          const maxCharacters = Number(action.parameters?.maxCharacters || 110);
          if (block.content.length > maxCharacters) block.content = `${block.content.slice(0, maxCharacters - 1).trim()}…`;
        });
        break;
      case 'hide-secondary':
        scene.blocks = scene.blocks.filter((block) => block.priority !== 'secondary' || !blocks.includes(block));
        break;
    }
  }

  const candidate: PresentationPlan = { ...plan, scenes, passed: false };
  return repairPresentationPlan(candidate, 1);
};
