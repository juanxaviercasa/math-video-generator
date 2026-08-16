import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import type { PresentationPlan, VisualQAReport } from './presentation.types.js';

const execFileAsync = promisify(execFile);

export interface AIVisualReview {
  enabled: boolean;
  status: 'skipped' | 'completed' | 'failed';
  diagnostics: Array<{ category: 'clarity' | 'hierarchy' | 'readability' | 'consistency' | 'balance' | 'pedagogy' | 'density'; severity: 'info' | 'warning' | 'error'; message: string; confidence?: number }>;
}

const resolveFfmpeg = (): string => process.env.FFMPEG_PATH || 'ffmpeg';
const resolveFfprobe = (): string => process.env.FFPROBE_PATH || 'ffprobe';

const sampleFrame = async (videoPath: string, framePath: string, timestamp: number): Promise<void> => {
  fs.mkdirSync(path.dirname(framePath), { recursive: true });
  await execFileAsync(resolveFfmpeg(), ['-hide_banner', '-loglevel', 'error', '-ss', String(Math.max(0, timestamp)), '-i', videoPath, '-frames:v', '1', '-y', framePath], { maxBuffer: 1024 * 1024 * 10 });
};

const detectBlackFrame = async (videoPath: string, timestamp: number): Promise<boolean> => {
  try {
    const result = await execFileAsync(resolveFfmpeg(), ['-hide_banner', '-ss', String(Math.max(0, timestamp)), '-i', videoPath, '-frames:v', '1', '-vf', 'signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'], { maxBuffer: 1024 * 1024 * 10 });
    const output = `${result.stdout || ''}\\n${result.stderr || ''}`;
    const match = output.match(/(?:YAVG|lavfi\\.signalstats\\.YAVG)=([0-9.]+)/);
    if (!match) return false;
    return Number(match[1]) < 4;
  } catch {
    return false;
  }
};

export const auditRenderedVideo = async (videoPath: string, plan: PresentationPlan, outputDir: string): Promise<VisualQAReport> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sceneReports: VisualQAReport['sceneReports'] = [];
  if (!fs.existsSync(videoPath)) {
    return { engineVersion: plan.engineVersion, sceneReports: [], aiReviews: [], errors: [`No existe el video para QA: ${videoPath}`], warnings, passed: false };
  }

  let metadata: any = null;
  try {
    const { stdout } = await execFileAsync(resolveFfprobe(), ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', videoPath], { maxBuffer: 1024 * 1024 * 10 });
    metadata = JSON.parse(stdout);
  } catch (error) {
    errors.push(`No se pudo leer metadata del video: ${error instanceof Error ? error.message : String(error)}`);
  }

  const videoStream = metadata?.streams?.find((stream: any) => stream.codec_type === 'video');
  const expectedRatio = plan.canvas.width / plan.canvas.height;
  const actualRatio = videoStream?.width && videoStream?.height ? videoStream.width / videoStream.height : 0;
  if (!videoStream || videoStream.width !== plan.canvas.width || videoStream.height !== plan.canvas.height || Math.abs(actualRatio - expectedRatio) > 0.01) {
    errors.push(`La metadata del video no coincide con el canvas esperado (${plan.canvas.width}x${plan.canvas.height}).`);
  }

  let cursor = 0;
  for (const layout of plan.resolvedLayouts) {
    const scene = plan.scenes.find((candidate) => candidate.id === layout.sceneId);
    const duration = scene?.duration.seconds || 4;
    const timestamp = cursor + Math.min(duration / 2, Math.max(0.2, duration - 0.2));
    const framePath = path.join(outputDir, 'qa-frames', `${layout.sceneId}.jpg`);
    try {
      await sampleFrame(videoPath, framePath, timestamp);
      if (!fs.existsSync(framePath) || fs.statSync(framePath).size === 0) errors.push(`No se pudo crear frame QA para ${layout.sceneId}.`);
    } catch (error) {
      errors.push(`Falló captura QA de ${layout.sceneId}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (await detectBlackFrame(videoPath, timestamp)) warnings.push(`El frame central de ${layout.sceneId} puede estar vacío o casi negro.`);
    sceneReports.push({ sceneId: layout.sceneId, constraints: [], score: layout.score, sampleFrames: [framePath] });
    cursor += duration;
  }

  const planErrors = plan.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  errors.push(...planErrors.map((diagnostic) => `${diagnostic.sceneId || 'plan'}: ${diagnostic.message}`));
  const aiReviews = sceneReports.map((report) => {
    const review = reviewFrameWithOptionalAI();
    return { sceneId: report.sceneId, status: review.status, diagnostics: review.diagnostics };
  });
  return { engineVersion: plan.engineVersion, sceneReports, aiReviews, errors, warnings, passed: errors.length === 0 && plan.passed };
};

export const reviewFrameWithOptionalAI = (): AIVisualReview => ({
  enabled: process.env.AI_VISUAL_REVIEWER === 'true',
  status: 'skipped',
  diagnostics: [{ category: 'clarity', severity: 'info', message: 'El revisor multimodal es opcional y no está habilitado en este entorno.' }],
});
