import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { manim } from '../src/services/manim.service.js';
import { ffmpeg } from '../src/services/ffmpeg.service.js';
import { validateMathProblem } from '../src/services/math-validation.service.js';
import { buildQuadraticStoryboard } from '../src/services/pedagogy.service.js';
import { getVideoFormatProfile, type VideoAspectRatio } from '../src/services/video-format.service.js';
import { readAndValidateGeometry } from '../src/services/manim-geometry-qa.service.js';
import { auditFinalVideoFrames } from '../src/services/final-frame-qa.service.js';
import { validateRenderIntegrity } from '../src/services/render-integrity.service.js';
import { buildCueTimingPlan, CUE_LEAD_SECONDS } from '../src/services/voice-cue.service.js';
import { prepareExerciseImage, verifyExerciseSource } from '../src/services/exercise-extraction.service.js';

const problem = 'x^2 - 5x + 6 = 0';
const formats: VideoAspectRatio[] = ['16:9', '1:1', '9:16'];

async function smoke(format: VideoAspectRatio, fullLesson = false, problemInput = problem, variant = ''): Promise<void> {
  const artifactRoot = process.env.PRECISION_ARTIFACTS_DIR || path.resolve('smoke-artifacts');
  const root = path.join(path.resolve(artifactRoot), format.replace(':', 'x') + (fullLesson ? '-full' : '') + (variant ? '-' + variant : ''));
  fs.mkdirSync(root, { recursive: true });
  const profile = getVideoFormatProfile(format, 'low');
  const validated = validateMathProblem(problemInput);
  const storyboard = buildQuadraticStoryboard(problemInput, validated);
  const scenes = variant === 'voice-locked'
    ? storyboard.filter((scene) => scene.id === 'discriminant-calculate')
    : fullLesson ? storyboard : storyboard.filter((scene) => scene.id === 'coefficients' || scene.id === 'graph');
  if (variant === 'voice-locked') {
    const stage = scenes[0];
    if (!stage || stage.visualStages?.length !== 4) throw new Error('VOICE_CUE_SMOKE_INVALID');
    stage.visualCueDurations = [2.2, 2.2, 2.2, 2.2];
    stage.duration = 1.2 + stage.visualCueDurations.reduce((total, seconds) => total + seconds, 0) + 1;
  }
  const geometryFile = path.join(root, 'observed-geometry.json');
  const raw = await manim.renderVideo({
    title: fullLesson ? 'Full Quadratic Lesson' : 'Precise Math Smoke',
    content: problemInput,
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
    expectedDurations: Object.fromEntries(scenes.map((scene) => [scene.id, scene.duration ?? scene.estimatedDuration])),
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

  if (variant === 'voice-locked') {
    // Offline audio integration: emulate neural speech clips with different pitches.
    // This certifies cue timing and MP4 muxing without external TTS credentials.
    const execFileAsync = promisify(execFile);
    const stage = scenes[0];
    const speechSeconds = [1.57, 1.57, 1.57, 1.57];
    const timing = buildCueTimingPlan(speechSeconds);
    if (JSON.stringify(stage.visualCueDurations) !== JSON.stringify(timing.stageDurations)) {
      throw new Error('VOICE_CUE_SMOKE_TIMING_MISMATCH');
    }
    const clips = [await ffmpeg.createSilentAudio(path.join(root, 'cue-opening.wav'), timing.introSeconds)];
    for (const [index, duration] of timing.stageDurations.entries()) {
      const source = path.join(root, `cue-source-${index}.wav`);
      const aligned = path.join(root, `cue-aligned-${index}.wav`);
      await execFileAsync(ffmpeg.getCommand(), [
        '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
        '-i', `sine=frequency=${440 + index * 110}:duration=${speechSeconds[index]}`,
        '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', '-y', source,
      ]);
      clips.push(await ffmpeg.alignNarrationSegment(source, aligned, duration, CUE_LEAD_SECONDS));
    }
    clips.push(await ffmpeg.createSilentAudio(path.join(root, 'cue-closing.wav'), timing.outroSeconds));
    const audioPath = await ffmpeg.concatenateAudio(clips, path.join(root, 'cue-voice-track.wav'));
    const final = await ffmpeg.mergeAudioWithVideo({
      videoPath: exported,
      audioPath,
      outputPath: path.join(root, 'voice-locked-final.mp4'),
    });
    const encoded = validateRenderIntegrity(await ffmpeg.getVideoInfo(final), {
      width: profile.width, height: profile.height, fps: 30, narrationRequired: true,
      plannedDurationSeconds: timing.sceneDuration,
    });
    fs.writeFileSync(path.join(root, 'voice-lock-qa.json'), JSON.stringify(encoded, null, 2));
    if (!encoded.passed
      || Math.abs((encoded.actual.videoDuration ?? 0) - (encoded.actual.audioDuration ?? 0)) > 0.15) {
      throw new Error('VOICE_LOCK_MP4_FAILED: ' + encoded.errors.join(' | '));
    }
    console.log('APPROVED VOICE-LOCKED MP4', timing.sceneDuration, encoded.actual.videoDuration);
  }

  const observed = JSON.parse(fs.readFileSync(geometryFile, 'utf8')) as { stages: Array<{ id: string; start: number; end: number }> };
  const frames = await auditFinalVideoFrames(exported, root, integrity.actual.videoDuration || 0, 6, observed.stages);
  fs.writeFileSync(path.join(root, 'final-frames-qa.json'), JSON.stringify(frames, null, 2));
  if (!frames.passed) throw new Error('Final frames failed: ' + frames.errors.join(' | '));
  console.log(fullLesson ? 'APPROVED FULL LESSON' : 'APPROVED', format, profile.width, profile.height, 'duration', integrity.actual.videoDuration, 'snapshots', geometry.stages.length);
}

async function smokePdfExercise(): Promise<void> {
  const execFileAsync = promisify(execFile);
  const root = path.join(path.resolve(process.env.PRECISION_ARTIFACTS_DIR || 'smoke-artifacts'), 'pdf-exercise');
  fs.mkdirSync(root, { recursive: true });
  const tex = String.raw`\\documentclass{article}
\\begin{document}
\\[x^2-5x+6=0\\]
\\end{document}
`;
  const texPath = path.join(root, 'exercise.tex');
  fs.writeFileSync(texPath, tex);
  await execFileAsync('pdflatex', [
    '-interaction=nonstopmode', '-halt-on-error', '-output-directory', root, texPath,
  ], { cwd: root, maxBuffer: 1024 * 1024, timeout: 30000 });
  const pdf = fs.readFileSync(path.join(root, 'exercise.pdf'));
  verifyExerciseSource(pdf, 'application/pdf');
  const image = await prepareExerciseImage(pdf, 'application/pdf', 1);
  verifyExerciseSource(image.data, image.type);
  fs.writeFileSync(path.join(root, 'rasterized-page.png'), image.data);
  if (image.data.byteLength < 1000) throw new Error('PDF_SMOKE_PAGE_EMPTY');
  console.log('APPROVED PDF RASTER', pdf.length, image.data.length);
}

async function smokeAudioAlignment(): Promise<void> {
  const execFileAsync = promisify(execFile);
  const artifactRoot = process.env.PRECISION_ARTIFACTS_DIR || path.resolve('smoke-artifacts');
  const root = path.join(path.resolve(artifactRoot), 'audio-alignment');
  fs.mkdirSync(root, { recursive: true });
  const raw = path.join(root, 'synthetic-voice.wav');
  const aligned = path.join(root, 'aligned-voice.wav');
  await execFileAsync(ffmpeg.getCommand(), [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
    '-i', 'sine=frequency=440:duration=1.2', '-ac', '1', '-ar', '24000',
    '-c:a', 'pcm_s16le', '-y', raw,
  ]);
  await ffmpeg.alignNarrationSegment(raw, aligned, 4.15);
  const info = await ffmpeg.getVideoInfo(aligned);
  const duration = Number(info.format?.duration);
  const report = { targetSeconds: 4.15, measuredSeconds: duration, passed: Math.abs(duration - 4.15) <= 0.06 };
  fs.writeFileSync(path.join(root, 'audio-qa.json'), JSON.stringify(report, null, 2));
  if (!report.passed) throw new Error('AUDIO_ALIGNMENT_FAILED: ' + duration);

  // Verify that the encoded MP4 really carries the narration, not merely
  // that a disconnected WAV file had the right duration.
  const videoPath = path.join(root, 'narration-video.mp4');
  const muxedPath = path.join(root, 'narration-final.mp4');
  await execFileAsync(ffmpeg.getCommand(), [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
    '-i', 'color=c=navy:s=854x480:r=30:d=4.15',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-y', videoPath,
  ]);
  await ffmpeg.mergeAudioWithVideo({ videoPath, audioPath: aligned, outputPath: muxedPath });
  const mp4Info = await ffmpeg.getVideoInfo(muxedPath);
  const muxed = validateRenderIntegrity(mp4Info, {
    width: 854, height: 480, fps: 30, narrationRequired: true, plannedDurationSeconds: 4.15,
  });
  fs.writeFileSync(path.join(root, 'muxed-audio-qa.json'), JSON.stringify(muxed, null, 2));
  if (!muxed.passed) throw new Error('ENCODED_AUDIO_FAILED: ' + muxed.errors.join(' | '));
  console.log('APPROVED AUDIO MP4', report.targetSeconds, report.measuredSeconds);
}

(async () => {
  for (const format of formats) await smoke(format);
  for (const format of formats) await smoke(format, true);
  // Mathematical edge cases: no fictitious real roots, and exactly one double root.
  await smoke('16:9', true, 'x^2 + 2x + 5 = 0', 'no-real-roots');
  await smoke('16:9', true, 'x^2 - 2x + 1 = 0', 'double-root');
  await smoke('16:9', false, problem, 'voice-locked');
  await smokePdfExercise();
  await smokeAudioAlignment();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
