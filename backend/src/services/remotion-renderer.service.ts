import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LessonTimeline, PedagogicalStep } from './timeline.types.js';
import type { VideoAspectRatio } from './video-format.service.js';

export interface AnimatedDeckRenderRequest {
  id: string;
  timeline: LessonTimeline;
  format: VideoAspectRatio;
  outputDir: string;
}

interface AnimatedDeck {
  id: string;
  problem: string;
  format: VideoAspectRatio;
  narrationStyle: LessonTimeline['narrationStyle'];
  slides: Array<{
    id: string;
    index: number;
    kind: string;
    title: string;
    objective?: string;
    durationSeconds: number;
    audioSrc?: string;
    narrationSegmentId: string;
    formulaAnchorIds: string[];
    visualBlocks: Array<{ id: string; type: 'formula' | 'text' | 'graph'; content: string; latex?: string; role?: string; position: 'top' | 'center' | 'bottom' }>;
    cues: Array<{ id: string; kind: string; targetId: string; startSeconds: number; durationSeconds: number; from?: string; to?: string; narrationEventId?: string }>;
    checkpointId?: string;
    transition: 'cut' | 'crossfade';
  }>;
  sourceTimelineId: string;
  totalDurationSeconds: number;
}

const resolveProjectDir = async () => {
  const configured = process.env.REMOTION_PROJECT_DIR;
  const candidates = configured
    ? [path.resolve(configured)]
    : [path.resolve(process.cwd(), 'tools/remotion-pilot'), path.resolve(process.cwd(), '..', 'tools/remotion-pilot')];
  for (const candidate of candidates) {
    try {
      await fs.access(path.join(candidate, 'package.json'));
      return candidate;
    } catch {
      // Try the next supported working-directory layout.
    }
  }
  throw new Error(`No se encontró REMOTION_PROJECT_DIR. Rutas intentadas: ${candidates.join(', ')}`);
};

const compositionFor = (format: VideoAspectRatio) => ({
  '16:9': { id: 'LessonTimelineEditorial', width: 1280, height: 720 },
  '1:1': { id: 'LessonTimelineEditorialSquare', width: 720, height: 720 },
  '9:16': { id: 'LessonTimelineEditorialPortrait', width: 720, height: 1280 },
}[format]);

const slideKind = (step?: string, graph = false) => {
  if (graph) return 'graph';
  if (step === 'hook') return 'hook';
  if (step === 'verify') return 'verification';
  if (step === 'interpret') return 'summary';
  if (step === 'identify' || step === 'context') return 'concept';
  return 'worked_step';
};

const cueKind = (action: string) => ({ show: 'enter', write: 'write', highlight: 'highlight', transform: 'transform', replace: 'transform', plot: 'reveal', hide: 'exit', hold: 'hold' }[action] || 'hold');

const buildDeck = (timeline: LessonTimeline, format: VideoAspectRatio, audioNames: Map<string, string>): AnimatedDeck => {
  const anchors = timeline.formulaAnchors || [];
  const slides = timeline.segments.map((segment, index) => {
    const events = timeline.events.filter((event) => event.segmentId === segment.id).sort((a, b) => a.startOffset - b.startOffset);
    const anchorIds = [...new Set(events.map((event) => event.formulaAnchorId).filter((value): value is string => Boolean(value)))];
    const anchor = anchorIds.map((id) => anchors.find((candidate) => candidate.id === id)).find(Boolean);
    const first = events[0];
    const step = (first?.pedagogicalStep || 'context') as PedagogicalStep;
    const graph = events.some((event) => event.action === 'plot');
    const main = first?.to || first?.from || anchor?.latex || segment.text;
    const checkpoint = timeline.checkpoints?.find((candidate) => candidate.id === segment.id || events.some((event) => event.id === candidate.revealAfterEventId));
    return {
      id: `slide-${segment.id}`,
      index,
      kind: slideKind(step, graph),
      title: segment.objective || first?.label || step,
      objective: segment.objective,
      durationSeconds: segment.durationSeconds,
      audioSrc: audioNames.get(segment.id),
      narrationSegmentId: segment.id,
      formulaAnchorIds: anchorIds,
      visualBlocks: [
        ...(anchor ? [{ id: anchor.id, type: 'formula' as const, content: anchor.label || 'Fórmula de referencia', latex: anchor.latex, role: 'context', position: anchor.position === 'side' ? 'top' as const : anchor.position as 'top' }] : []),
        { id: `${segment.id}-main`, type: graph ? 'graph' as const : 'formula' as const, content: main, latex: main, role: step === 'verify' ? 'verification' : 'operation', position: 'center' as const },
        { id: `${segment.id}-detail`, type: 'text' as const, content: segment.text, role: 'reflection', position: 'bottom' as const },
      ],
      cues: events.map((event) => ({ id: `cue-${event.id}`, kind: cueKind(event.action), targetId: event.targetId, startSeconds: event.startOffset, durationSeconds: event.duration, from: event.from, to: event.to, narrationEventId: event.id })),
      checkpointId: checkpoint?.id,
      transition: index === 0 ? 'cut' as const : 'crossfade' as const,
    };
  });
  return { id: `deck-${timeline.id}`, problem: timeline.problem, format, narrationStyle: timeline.narrationStyle, slides, sourceTimelineId: timeline.id, totalDurationSeconds: slides.reduce((sum, slide) => sum + slide.durationSeconds, 0) };
};

const run = (command: string, args: string[], cwd: string): Promise<void> => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  child.on('error', reject);
  child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Remotion terminó con código ${code}: ${stderr.slice(-4000)}`)));
});

export async function renderRemotionDeck(request: AnimatedDeckRenderRequest): Promise<string> {
  if (process.env.REMOTION_ENABLED !== 'true') throw new Error('Remotion está desactivado. Define REMOTION_ENABLED=true solo después de validar el entorno.');
  const projectDir = await resolveProjectDir();
  const publicDir = path.join(projectDir, 'public');
  const propsPath = path.join(request.outputDir, `${request.id}-remotion-props.json`);
  const outputPath = path.join(request.outputDir, `${request.id}-remotion.mp4`);
  const copiedFiles: string[] = [];
  const audioNames = new Map<string, string>();

  await fs.mkdir(publicDir, { recursive: true });
  try {
    for (const segment of request.timeline.segments) {
      if (!segment.audioPath) continue;
      const extension = path.extname(segment.audioPath) || '.mp3';
      const fileName = `mvg-${request.id}-${segment.id}${extension}`;
      await fs.copyFile(segment.audioPath, path.join(publicDir, fileName));
      copiedFiles.push(path.join(publicDir, fileName));
      audioNames.set(segment.id, fileName);
    }
    const deck = buildDeck(request.timeline, request.format, audioNames);
    await fs.writeFile(propsPath, JSON.stringify({ deck }), 'utf8');
    const composition = compositionFor(request.format);
    await run('npx', ['--no-install', 'remotion', 'render', 'src/registerRoot.tsx', composition.id, outputPath, '--props', propsPath, '--codec=h264', '--log=error'], projectDir);
    await fs.access(outputPath);
    return outputPath;
  } finally {
    await Promise.allSettled(copiedFiles.map((file) => fs.rm(file, { force: true })));
    await fs.rm(propsPath, { force: true });
  }
}
