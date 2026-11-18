import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const miktexCandidates = [
  path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64'),
  'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64',
];
const venvScripts = path.join(repoRoot, '.venv', 'Scripts');

for (const candidate of [...miktexCandidates, venvScripts]) {
  if (fs.existsSync(candidate) && !(process.env.PATH || '').includes(candidate)) {
    process.env.PATH = candidate + path.delimiter + (process.env.PATH || '');
  }
}

const mediaRoot = process.env.MEDIA_ROOT || path.join(os.homedir(), 'Videos', 'ecuaciones-cuadraticas-finales');
process.env.MEDIA_ROOT = mediaRoot;
process.env.TTS_PROVIDER = process.env.TTS_PROVIDER || 'edge';

import { videoProcessing } from '../../backend/dist/services/video-processing.service.js';

async function main() {
  const outputDir = path.join(mediaRoot, '06_completa_raices_irracionales_exactas');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('🚀 Starting Native Lesson Generation for Caso 06 (Irrational roots)...');
  console.log('Problem: x^2 - 4x + 1 = 0');
  console.log('Voice: es-PE-CamilaNeural');
  console.log('Output Dir:', outputDir);

  const result = await videoProcessing.generateVideo({
    id: 'lesson_06_irrational',
    title: 'Ecuación con Raíces Irracionales: x^2 - 4x + 1 = 0',
    content: 'x^2 - 4x + 1 = 0',
    quality: 'medium',
    aspectRatio: '16:9',
    layoutDensity: 'comfortable',
    narrationStyle: 'warm_teacher',
    userId: 'admin_zenit',
    outputDir: outputDir,
    enableNarration: true,
    narratorVoiceId: 'es-PE-CamilaNeural',
    onProgress: (p) => {
      console.log(`[${p.progress}%] ${p.message}`);
      if (p.error) console.error('Error detail:', p.error);
    },
  });

  console.log('\n================ RESULT ================');
  console.log('Status:', result.status);
  console.log('Message:', result.message);
  console.log('Video URL:', result.videoUrl);
  console.log('Thumbnail:', result.thumbnailUrl);
  console.log('Duration:', result.duration);
  if (result.error) console.error('Error:', result.error);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
