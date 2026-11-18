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

const missingCases = [
  {
    folder: '07_incompleta_pura_real_x2_minus_25',
    id: 'lesson_07_incompleta_pura',
    title: 'Ecuación Incompleta Pura: x^2 - 25 = 0',
    content: 'x^2 - 25 = 0',
    cleanName: '07_Incompleta_Pura_Real_x2-25=0.mp4',
  },
  {
    folder: '08_incompleta_mixta_x2_minus_6x',
    id: 'lesson_08_incompleta_mixta',
    title: 'Ecuación Incompleta Mixta: Factor Común x^2 - 6x = 0',
    content: 'x^2 - 6x = 0',
    cleanName: '08_Incompleta_Mixta_Monomio_x2-6x=0.mp4',
  },
  {
    folder: '09_incompleta_mixta_no_monica_3x2_plus_12x',
    id: 'lesson_09_incompleta_no_monica',
    title: 'Ecuación Incompleta Mixta No Mónica: 3x^2 + 12x = 0',
    content: '3x^2 + 12x = 0',
    cleanName: '09_Incompleta_Mixta_No_Monica_3x2+12x=0.mp4',
  },
];

async function main() {
  const rootDir = mediaRoot;
  const cleanDir = path.join(rootDir, 'VIDEOS_FINALES_LIMPIOS');
  fs.mkdirSync(cleanDir, { recursive: true });

  for (const item of missingCases) {
    const itemDir = path.join(rootDir, item.folder);
    fs.mkdirSync(itemDir, { recursive: true });

    console.log(`\n============================================================`);
    console.log(`Renderizando caso incompleto: ${item.title}`);
    console.log(`Ecuación: ${item.content}`);
    console.log(`============================================================`);

    const result = await videoProcessing.generateVideo({
      id: item.id,
      title: item.title,
      content: item.content,
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

    const videoSrc = path.join(itemDir, `${item.id}-narrated.mp4`);
    const cleanDst = path.join(cleanDir, item.cleanName);
    if (fs.existsSync(videoSrc)) {
      fs.copyFileSync(videoSrc, cleanDst);
      console.log(`✅ Copiado a carpeta limpia: ${cleanDst}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
