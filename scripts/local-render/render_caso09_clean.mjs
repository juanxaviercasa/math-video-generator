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
  const rootDir = mediaRoot;
  const cleanDir = path.join(rootDir, 'VIDEOS_FINALES_LIMPIOS');
  const itemDir = path.join(rootDir, '09_incompleta_mixta_no_monica_3x2_plus_12x');
  fs.mkdirSync(itemDir, { recursive: true });

  console.log('🚀 Renderizando Caso 09: Incompleta Mixta No Mónica (3x^2 + 12x = 0)...');

  const result = await videoProcessing.generateVideo({
    id: 'lesson_09_incompleta_no_monica',
    title: 'Ecuación Incompleta Mixta No Mónica: 3x^2 + 12x = 0',
    content: '3x^2 + 12x = 0',
    quality: 'medium',
    aspectRatio: '16:9',
    layoutDensity: 'comfortable',
    narrationStyle: 'warm_teacher',
    userId: 'admin_zenit',
    outputDir: itemDir,
    enableNarration: true,
    narratorVoiceId: 'es-PE-CamilaNeural',
    onProgress: (p) => {
      if (p.progress % 20 === 0 || p.progress === 100 || p.progress === 75) {
        console.log(`  -> [${p.progress}%] ${p.message}`);
      }
    },
  });

  const videoSrc = path.join(itemDir, 'lesson_09_incompleta_no_monica-narrated.mp4');
  const cleanDst = path.join(cleanDir, '09_Incompleta_Mixta_No_Monica_3x2+12x=0.mp4');
  if (fs.existsSync(videoSrc)) {
    fs.copyFileSync(videoSrc, cleanDst);
    console.log(`✅ Caso 09 completado y copiado a: ${cleanDst}`);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
