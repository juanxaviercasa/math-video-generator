import fs from 'node:fs';
import path from 'node:path';

export interface ObservedBox { x: number; y: number; width: number; height: number }
export interface ObservedObject { kind: string; content: string; bbox: ObservedBox }
export interface GeometrySnapshot { time: number; objects: ObservedObject[] }
export interface GeometryStage {
  id: string;
  start: number;
  end: number;
  snapshots: GeometrySnapshot[];
}
export interface ManimGeometryReport {
  version: number;
  canvas: {
    pixelWidth: number; pixelHeight: number;
    frameWidth: number; frameHeight: number; safeMargin: number;
  };
  stages: GeometryStage[];
  captureErrors: string[];
}
export interface StageGeometryAssessment {
  id: string;
  durationSeconds: number;
  sampleCount: number;
  textObjects: number;
  minMarginPixels: number | null;
}
export interface GeometryAssessment {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stages: StageGeometryAssessment[];
}
export interface GeometryRequirements {
  sceneIds: string[];
  width: number;
  height: number;
  expectedDurations?: Record<string, number>;
  tolerancePixels?: number;
}

export function projectManimBoxToPixels(box: ObservedBox, canvas: ManimGeometryReport['canvas']): ObservedBox {
  const x0 = (box.x + canvas.frameWidth / 2) / canvas.frameWidth * canvas.pixelWidth;
  const y0 = (canvas.frameHeight / 2 - box.y - box.height) / canvas.frameHeight * canvas.pixelHeight;
  return {
    x: x0,
    y: y0,
    width: box.width / canvas.frameWidth * canvas.pixelWidth,
    height: box.height / canvas.frameHeight * canvas.pixelHeight,
  };
}

const intersect = (a: ObservedBox, b: ObservedBox): { width: number; height: number } => ({
  width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)),
  height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)),
});

const finiteBox = (box: ObservedBox): boolean => (
  [box.x, box.y, box.width, box.height].every(Number.isFinite) && box.width > 0 && box.height > 0
);

const round = (value: number): number => Math.round(value * 100) / 100;

export function validateObservedGeometry(report: ManimGeometryReport, requirements: GeometryRequirements): GeometryAssessment {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stages: StageGeometryAssessment[] = [];
  if (report.version !== 1) errors.push('GEOMETRY_SCHEMA: Versión de medición desconocida.');
  const c = report.canvas;
  if (!c || ![c.frameWidth, c.frameHeight, c.pixelWidth, c.pixelHeight, c.safeMargin].every(Number.isFinite)
      || c.frameWidth <= 0 || c.frameHeight <= 0 || c.pixelWidth !== requirements.width || c.pixelHeight !== requirements.height
      || c.safeMargin < 0 || c.safeMargin * 2 >= Math.min(c.frameWidth, c.frameHeight)) {
    return { passed: false, errors: [...errors, 'GEOMETRY_CANVAS: La medición no coincide con el video final.'], warnings, stages };
  }
  for (const issue of report.captureErrors || []) errors.push('GEOMETRY_CAPTURE: ' + issue);
  if (!Array.isArray(report.stages)) return { passed: false, errors: [...errors, 'GEOMETRY_STAGES: No existen escenas observadas.'], warnings, stages };
  const foundIds = report.stages.map((stage) => stage.id);
  if (JSON.stringify(foundIds) !== JSON.stringify(requirements.sceneIds)) {
    errors.push('GEOMETRY_SCENES: Las escenas medidas no coinciden en número u orden con el storyboard.');
  }
  const pixelSafe = {
    left: c.safeMargin / c.frameWidth * c.pixelWidth,
    right: c.pixelWidth - c.safeMargin / c.frameWidth * c.pixelWidth,
    top: c.safeMargin / c.frameHeight * c.pixelHeight,
    bottom: c.pixelHeight - c.safeMargin / c.frameHeight * c.pixelHeight,
  };
  const epsilon = requirements.tolerancePixels ?? 2;
  const seenErrors = new Set<string>();
  const addOnce = (message: string) => { if (!seenErrors.has(message)) { errors.push(message); seenErrors.add(message); } };

  for (const stage of report.stages) {
    const duration = stage.end - stage.start;
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(stage.start) || !Number.isFinite(stage.end)) {
      addOnce('GEOMETRY_TIMING: Duración inválida para ' + stage.id);
    }
    const expected = requirements.expectedDurations?.[stage.id];
    if (expected !== undefined && Number.isFinite(expected) && expected > 0 && duration > 0) {
      const drift = Math.abs(duration - expected);
      if (drift > Math.max(1, 0.1 * expected)) {
        warnings.push('GEOMETRY_SYNC: ' + stage.id + ' difiere ' + round(drift) + ' s del audio planificado.');
      }
    }
    if (!Array.isArray(stage.snapshots) || stage.snapshots.length === 0) {
      addOnce('GEOMETRY_EMPTY: No hay mediciones visibles para ' + stage.id);
    }
    let objects = 0;
    let margin = Number.POSITIVE_INFINITY;
    for (const [snapshotIndex, snapshot] of (stage.snapshots || []).entries()) {
      if (!Number.isFinite(snapshot.time) || snapshot.time < stage.start - 0.05 || snapshot.time > stage.end + 0.05) {
        addOnce('GEOMETRY_TIMESTAMP: Fotograma lógico fuera de la escena ' + stage.id);
      }
      const boxes: { px: ObservedBox; content: string }[] = [];
      for (const object of snapshot.objects || []) {
        if (!finiteBox(object.bbox)) {
          addOnce('GEOMETRY_BBOX_INVALID: ' + stage.id);
          continue;
        }
        const px = projectManimBoxToPixels(object.bbox, c);
        const m = Math.min(px.x - pixelSafe.left, px.y - pixelSafe.top,
          pixelSafe.right - (px.x + px.width), pixelSafe.bottom - (px.y + px.height));
        margin = Math.min(margin, m);
        objects++;
        if (m < -epsilon) {
          addOnce('GEOMETRY_CLIPPING: ' + stage.id + ' contiene texto/fórmula fuera del área segura (' + round(m) + ' px).');
        }
        boxes.push({ px, content: object.content });
      }
      // Evaluate simultaneous text/formula objects, not boxes from different timestamps.
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const crossing = intersect(boxes[i].px, boxes[j].px);
          if (crossing.width > epsilon && crossing.height > epsilon) {
            addOnce('GEOMETRY_COLLISION: ' + stage.id + ' presenta texto/fórmulas superpuestos en la muestra ' + snapshotIndex + '.');
          }
        }
      }
    }
    stages.push({
      id: stage.id,
      durationSeconds: round(duration),
      sampleCount: stage.snapshots?.length ?? 0,
      textObjects: objects,
      minMarginPixels: Number.isFinite(margin) ? round(margin) : null,
    });
  }
  return { passed: errors.length === 0, errors, warnings, stages };
}

export function readAndValidateGeometry(filePath: string, requirements: GeometryRequirements): GeometryAssessment {
  if (!fs.existsSync(filePath)) return {
    passed: false, errors: ['GEOMETRY_MISSING: Falta el archivo de mediciones de Manim.'], warnings: [], stages: [],
  };
  try {
    const report = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8')) as ManimGeometryReport;
    return validateObservedGeometry(report, requirements);
  } catch (error) {
    return {
      passed: false,
      errors: ['GEOMETRY_PARSE: ' + (error instanceof Error ? error.message : String(error))],
      warnings: [],
      stages: [],
    };
  }
}
