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

const casesToRender = [
  {
    folder: '02_aspa_simple_monica_x2_minus_7x_plus_12',
    id: 'lesson_02_aspa_monica',
    title: 'Ecuación Cuadrática Completa: Aspa Simple Mónica',
    content: 'x^2 - 7x + 12 = 0',
  },
  {
    folder: '03_aspa_simple_no_monica_2x2_plus_5x_minus_3',
    id: 'lesson_03_aspa_no_monica',
    title: 'Ecuación Cuadrática Completa: Aspa No Mónica (a=2)',
    content: '2x^2 + 5x - 3 = 0',
  },
  {
    folder: '04_raiz_doble_tcp_x2_minus_6x_plus_9',
    id: 'lesson_04_raiz_doble',
    title: 'Ecuación Cuadrática con Solución Única (Raíz Doble)',
    content: 'x^2 - 6x + 9 = 0',
  },
  {
    folder: '05_raices_complejas_x2_plus_2x_plus_5',
    id: 'lesson_05_raices_complejas',
    title: 'Ecuación Cuadrática con Raíces Complejas (Δ < 0)',
    content: 'x^2 + 2x + 5 = 0',
  },
  {
    folder: '07_incompleta_pura_real_x2_minus_25',
    id: 'lesson_07_incompleta_pura',
    title: 'Ecuación Incompleta Pura: x^2 - 25 = 0',
    content: 'x^2 - 25 = 0',
  },
  {
    folder: '08_incompleta_mixta_x2_minus_6x',
    id: 'lesson_08_incompleta_mixta',
    title: 'Ecuación Incompleta Mixta: Factor Común x^2 - 6x = 0',
    content: 'x^2 - 6x = 0',
  },
  {
    folder: '10_problema_modelado_area_x2_plus_7x_minus_60',
    id: 'lesson_10_modelado_area',
    title: 'Problema de Aplicación: Área de Cancha Rectangular',
    content: 'x^2 + 7x - 60 = 0',
  },
];

async function runBatch() {
  const rootDir = mediaRoot;
  fs.mkdirSync(rootDir, { recursive: true });

  const summary = [];
  console.log(`🎬 INICIANDO SUITE DE RENDERIZADO POR LOTES (${casesToRender.length} CASOS)...`);

  for (const [index, item] of casesToRender.entries()) {
    const itemDir = path.join(rootDir, item.folder);
    fs.mkdirSync(itemDir, { recursive: true });

    console.log(`\n============================================================`);
    console.log(`[CASO ${index + 1}/${casesToRender.length}] ${item.title}`);
    console.log(`Ecuación: ${item.content} | Carpeta: ${item.folder}`);
    console.log(`============================================================`);

    const startTime = Date.now();
    try {
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

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const videoFile = path.join(itemDir, `${item.id}-narrated.mp4`);
      console.log(`✅ [CASO ${index + 1} COMPLETADO] en ${elapsed}s: ${videoFile}`);

      summary.push({
        caso: item.folder,
        content: item.content,
        title: item.title,
        status: 'OK',
        duration: result.duration,
        elapsedSeconds: elapsed,
        videoPath: videoFile,
      });
    } catch (err) {
      console.error(`❌ [CASO ${index + 1} FALLÓ]:`, err.message || err);
      summary.push({
        caso: item.folder,
        content: item.content,
        title: item.title,
        status: 'ERROR',
        error: err.message || String(err),
      });
    }
  }

  const reportPath = path.join(rootDir, 'batch_suite_summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\n🎉 SUITE FINALIZADA. Resumen guardado en: ${reportPath}`);
}

runBatch().catch((err) => {
  console.error('Fatal batch execution error:', err);
  process.exit(1);
});
