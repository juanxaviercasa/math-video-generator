import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tts } from '../src/services/tts.service.js';
import { validateAudibleAudio } from '../src/services/audio-qa.service.js';
import { resolveVoiceId } from '../src/services/voice-catalog.service.js';

const main = async () => {
  const outputDir = path.resolve(process.env.VOICE_SMOKE_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'math-voice-smoke-')));
  fs.mkdirSync(outputDir, { recursive: true });
  const voiceId = resolveVoiceId(process.env.TTS_NEURAL_VOICE);
  const sample = 'Hoy resolveremos la ecuación equis al cuadrado, menos cinco equis, más seis, igual a cero. Primero identificamos los coeficientes. Después calculamos el discriminante.';
  const output = await tts.generateNarrationAudio(sample, outputDir, 'neural-voice-test', {
    style: 'warm_teacher',
    voiceId,
  });
  if (!output) throw new Error('VOICE_LIVE_SMOKE_FAILED: Edge TTS no generó voz. Instala edge-tts y comprueba el acceso a Internet.');
  const qa = await validateAudibleAudio(output);
  const report = { voiceId, ...qa, outputFile: output };
  fs.writeFileSync(path.join(outputDir, 'voice-smoke-report.json'), JSON.stringify(report, null, 2));
  if (!qa.passed) throw new Error('VOICE_LIVE_SMOKE_SILENT: No se detectó voz audible.');
  console.log(JSON.stringify(report, null, 2));
  console.log('Escucha el archivo generado antes de publicar un video.');
};
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
