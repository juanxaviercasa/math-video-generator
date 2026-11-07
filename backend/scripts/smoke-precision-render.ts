import fs from 'node:fs';
import path from 'node:path';
import { manim } from '../src/services/manim.service.js';
import { ffmpeg } from '../src/services/ffmpeg.service.js';
import { validateMathProblem } from '../src/services/math-validation.service.js';
import { buildQuadraticStoryboard } from '../src/services/pedagogy.service.js';
import { getVideoFormatProfile, type VideoAspectRatio } from '../src/services/video-format.service.js';
import { readAndValidateGeometry } from '../src/services/manim-geometry-qa.service.js';
import { auditFinalVideoFrames } from '../src/services/final-frame-qa.service.js';
import { validateRenderIntegrity } from '../src/services/render-integrity.service.js';

const problem = 'x^2 - 5x + 6 = 0';
const formats: VideoAspectRatio[] = ['16:9', '1:1', '9:16'];

async function smoke(format: VideoAspectRatio, fullLesson = false): Promise<void> {
  const artifactRoot = process.env.PRECISION_ARTIFACTS_DIR || path.resolve('smoke-artifacts');
  const root = path.join(path.resolve(artifactRoot), format.replace(':', 'x') + (fullLesson ? '-full' : ''));
  fs.mkdirSync(root, { recursive: true });
  const profile = getVideoFormatProfile(format, 'low');
  const validated = validateMathProblem(problem);
  const storyboard = buildQuadraticStoryboard(problem, validated);
  const scenes = fullLesson ? storyboard : storyboard
    .filter((scene) => scene.id === 'coefficients' || scene.id === 'graph');
  const geometryFile = path.join(root, 'observed-geometry.json');
  const raw = await manim.renderVideo({
    title: fullLesson ? 'Full Quadratic Lesson' : 'Precise Math Smoke',
    content: problem,
    steps: validated.steps,
    outputDir: root,
    pedagogicalScenes: scenes,
    formatProfile: profile,
    narrationTimeline: false,
    geometryReportPath: geometryFile,
  });
  const geometry = readAndValidateGeometry(geometryFile, {
    width: profile.width,
    height: profile.height,
    sceneIds: scenes.map((scene) => scene.id),
    expectedDurations: Object.fromEntries(scenes.map((scene) => [scene.id, scene.estimatedDuration])),
    tolerancePixels: 2,
  });
  fs.writeFileSync(path.join(root, 'geometry-qa.json'), JSON.stringify(geometry, null, 2));
  if (!geometry.passed) throw new Error('Manim pixel geometry failed: ' + geometry.errors.join(' | '));

  const exported = await ffmpeg.processVideo({
    inputPath: raw,
    outputPath: path.join(root, 'smoke-final.mp4'),
    width: profile.width,
    height: profile.height,
    fps: 30,
    bitrate: '1800k',
  });
  const info = await ffmpeg.getVideoInfo(exported);
  const integrity = validateRenderIntegrity(info, {
    width: profile.width, height: profile.height, fps: 30, narrationRequired: false,
  });
  fs.writeFileSync(path.join(root, 'integrity-qa.json'), JSON.stringify(integrity, null, 2));
  if (!integrity.passed) throw new Error('Media integrity failed: ' + integrity.errors.join(' | '));

  const frames = await auditFinalVideoFrames(exported, root, integrity.actual.videoDuration || 0, 6);
  fs.writeFileSync(path.join(root, 'final-frames-qa.json'), JSON.stringify(frames, null, 2));
  if (!frames.passed) throw new Error('Final frames failed: ' + frames.errors.join(' | '));
  console.log(fullLesson ? 'APPROVED FULL LESSON' : 'APPROVED', format, profile.width, profile.height, 'duration', integrity.actual.videoDuration, 'snapshots', geometry.stages.length);
}

(async () => {
  for (const format of formats) await smoke(format);
  await smoke('16:9', true);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
