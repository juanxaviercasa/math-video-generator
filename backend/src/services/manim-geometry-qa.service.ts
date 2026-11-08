import fs from 'node:fs';
import path from 'node:path';

export interface ObservedBox { x: number; y: number; width: number; height: number }
export interface ObservedObject { kind: string; content: string; bbox: ObservedBox; role?: string | null }
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
  requirePersistentProblem?: boolean;
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
      if (drift > 0.50) {
        errors.push('GEOMETRY_SYNC: ' + stage.id + ' difiere ' + round(drift) + ' s del reloj audiovisual.');
      } else if (drift > 0.15) {
        warnings.push('GEOMETRY_SYNC: ' + stage.id + ' presenta ' + round(drift) + ' s de diferencia temporal.');
      }
    }
    if (!Array.isArray(stage.snapshots) || stage.snapshots.length === 0) {
      addOnce('GEOMETRY_EMPTY: No hay mediciones visibles para ' + stage.id);
    }
    let objects = 0;
    let margin = Number.POSITIVE_INFINITY;
    let initialAnchor: ObservedBox | null = null;
    for (const [snapshotIndex, snapshot] of (stage.snapshots || []).entries()) {
      if (!Number.isFinite(snapshot.time) || snapshot.time < stage.start - 0.05 || snapshot.time > stage.end + 0.05) {
        addOnce('GEOMETRY_TIMESTAMP: Fotograma lógico fuera de la escena ' + stage.id);
      }
      const boxes: { px: ObservedBox; content: string }[] = [];
      if (requirements.requirePersistentProblem) {
        const anchors = (snapshot.objects || []).filter((object) => object.role === 'problem-anchor');
        if (anchors.length !== 1) addOnce('GEOMETRY_ANCHOR_MISSING: ' + stage.id + ' perdió el enunciado original.');
        if (anchors.length === 1 && finiteBox(anchors[0].bbox)) {
          const anchorPx = projectManimBoxToPixels(anchors[0].bbox, c);
          if (anchorPx.y > c.pixelHeight * 0.24) addOnce('GEOMETRY_ANCHOR_POSITION: ' + stage.id);
          if (initialAnchor && (Math.abs(initialAnchor.x - anchorPx.x) > 3
            || Math.abs(initialAnchor.y - anchorPx.y) > 3
            || Math.abs(initialAnchor.width - anchorPx.width) > 3)) {
            addOnce('GEOMETRY_ANCHOR_MOVED: ' + stage.id + ' desplazó el ejercicio original.');
          }
          initialAnchor = anchorPx;
        }
      }
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
        // Small but technically contained formulas are not production-readable.
        // The threshold scales with the encoded canvas, not abstract Manim units.
        const minimumHeight = object.role === 'problem-anchor'
          ? Math.max(25, c.pixelHeight * 0.027)
          : object.role === 'math-primary'
            ? Math.max(27, c.pixelHeight * 0.031)
            : object.kind === 'Text'
              ? Math.max(9, c.pixelHeight * 0.010)
              : Math.max(12, c.pixelHeight * 0.014);
        if (px.height + 0.2 < minimumHeight) {
          addOnce('GEOMETRY_UNREADABLE: ' + stage.id + ' contiene ' + object.kind
            + ' de ' + round(px.height) + ' px (mínimo ' + round(minimumHeight) + ' px).');
        }
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
