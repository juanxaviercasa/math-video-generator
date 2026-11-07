import fs from 'node:fs/promises';
import path from 'node:path';
import { renderRemotionDeck } from '../src/services/remotion-renderer.service.js';

const audioPath = process.argv[2];
const format = (process.argv[3] || '16:9') as '16:9' | '1:1' | '9:16';
if (!audioPath) throw new Error('Uso: tsx backend/scripts/remotion-runner-smoke.ts <audio-file> [16:9|1:1|9:16]');
const outputDir = path.resolve('/tmp/mvg-remotion-runner-smoke');
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
process.env.REMOTION_ENABLED = 'true';
process.env.REMOTION_PROJECT_DIR = path.resolve(process.cwd(), '..', 'tools/remotion-pilot');
const outputPath = await renderRemotionDeck({
  id: 'runner-smoke',
  format,
  outputDir,
  timeline: {
    id: 'timeline-runner-smoke',
    version: '2.0',
    problem: '3x² + 2x − 8 = 0',
    narrationStyle: 'warm_teacher',
    lessonMode: 'tutorial',
    segments: [{ id: 'segment-1', sceneId: 'scene-1', text: 'Identificamos los coeficientes de la ecuación.', durationSeconds: 4, audioPath, objective: 'Identificar los datos' }],
    events: [],
    formulaAnchors: [{ id: 'anchor-equation', latex: '3x^2+2x-8=0', persistence: 'lesson', position: 'top' }],
    checkpoints: [],
  },
});
console.log(outputPath);
