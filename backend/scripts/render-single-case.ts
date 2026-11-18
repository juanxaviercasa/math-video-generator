import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { manim } from '../src/services/manim.service.js';
import { ffmpeg } from '../src/services/ffmpeg.service.js';
import { validateMathProblem } from '../src/services/math-validation.service.js';
import { buildQuadraticStoryboard } from '../src/services/pedagogy.service.js';
import { getVideoFormatProfile } from '../src/services/video-format.service.js';

async function renderCase(title: string, problem: string, outputFileName: string) {
  console.log(`Starting render: ${title} (${problem})`);
  const profile = getVideoFormatProfile('16:9', 'low');
  const tempDir = path.resolve('temp_render', outputFileName.replace('.mp4', ''));
  fs.mkdirSync(tempDir, { recursive: true });

  const validated = validateMathProblem(problem);
  if (!validated.supported || !validated.valid) {
    throw new Error(`Invalid problem: ${problem} -> ${JSON.stringify(validated)}`);
  }

  const storyboard = buildQuadraticStoryboard(problem, validated);
  const geometryFile = path.join(tempDir, 'observed-geometry.json');

  const rawVideo = await manim.renderVideo({
    title,
    content: problem,
    steps: validated.steps,
    outputDir: tempDir,
    pedagogicalScenes: storyboard,
    formatProfile: profile,
    narrationTimeline: false,
    geometryReportPath: geometryFile,
  });

  const finalOutputDir = process.env.MEDIA_ROOT || path.join(os.homedir(), 'Videos', 'ecuaciones-cuadraticas-finales');
  fs.mkdirSync(finalOutputDir, { recursive: true });
  const finalPath = path.join(finalOutputDir, outputFileName);

  await ffmpeg.processVideo({
    inputPath: rawVideo,
    outputPath: finalPath,
    width: profile.width,
    height: profile.height,
    fps: 30,
    bitrate: '1800k',
  });

  console.log(`SUCCESS: Video saved to ${finalPath}`);
}

async function main() {
  const [,, title, problem, fileName] = process.argv;
  if (!title || !problem || !fileName) {
    console.error('Usage: tsx render-single-case.ts <title> <problem> <fileName>');
    process.exit(1);
  }
  await renderCase(title, problem, fileName);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
