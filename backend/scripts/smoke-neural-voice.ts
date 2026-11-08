import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tts } from '../src/services/tts.service.js';
import { ffmpeg } from '../src/services/ffmpeg.service.js';
import { validateAudibleAudio } from '../src/services/audio-qa.service.js';
import { resolveVoiceId } from '../src/services/voice-catalog.service.js';
import { readWordBoundaries, assertWordBoundariesMatchNarration } from '../src/services/voice-boundary.service.js';
import { prepareSpanishMathNarration } from '../src/services/spanish-math-speech.service.js';

const cases = [
  {
    id: 'quadratic-twelve',
    source: 'Hoy resolveremos x^2 - 7x + 12 = 0. El término independiente es 12.',
    words: ['cuadrado', 'siete', 'doce'],
  },
  {
    id: 'labial-b',
    source: 'El coeficiente B es -7. Reemplazamos b por -7 y c por 12.',
    words: ['be', 'labial', 'menos', 'siete', 'doce'],
  },
  {
    id: 'fractions',
    source: 'Dos x^2 menos siete x más tres igual a cero. La raíz es 0.5 y el discriminante es 25.',
    words: ['cuadrado', 'cero', 'coma', 'cinco', 'veinticinco'],
  },
] as const;

const main = async () => {
  const outputDir = path.resolve(process.env.VOICE_SMOKE_OUTPUT_DIR
    || fs.mkdtempSync(path.join(os.tmpdir(), 'math-voice-smoke-')));
  fs.mkdirSync(outputDir, { recursive: true });
  const voiceIds = (process.env.VOICE_SMOKE_VOICES
    || process.env.TTS_NEURAL_VOICE || 'es-PE-CamilaNeural')
    .split(',').map((voice) => resolveVoiceId(voice.trim()));
  const reports: unknown[] = [];
  for (const voiceId of voiceIds) {
    for (const sample of cases) {
      const prepared = prepareSpanishMathNarration(sample.source);
      const label = voiceId + '-' + sample.id;
      const audio = await tts.generateNarrationAudio(prepared, outputDir, label, {
        style: 'warm_teacher', voiceId,
      });
      if (!audio) throw new Error('VOICE_LIVE_SMOKE_FAILED: voz ausente en ' + label);
      const info = await ffmpeg.getVideoInfo(audio);
      const duration = Number(info.format?.duration);
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('VOICE_LIVE_SMOKE_DURATION: ' + label);
      }
      const boundaries = readWordBoundaries(audio.replace(/-narration\.(?:mp3|wav)$/i, '-narration.srt'), duration);
      if (!boundaries.length) throw new Error('VOICE_LIVE_SMOKE_NO_WORD_BOUNDARIES: ' + label);
      assertWordBoundariesMatchNarration(prepared, boundaries);
      for (const expected of sample.words) {
        if (!new RegExp('\\b' + expected + '\\b', 'i').test(prepared)) {
          throw new Error('VOICE_LIVE_SMOKE_TEXT_MISSING: ' + label + ': ' + expected);
        }
      }
      const qa = await validateAudibleAudio(audio);
      if (!qa.passed) throw new Error('VOICE_LIVE_SMOKE_INAUDIBLE: ' + label);
      const record = {
        id: label, voiceId, source: sample.source,
        prepared, audioPath: audio, duration, boundaryCount: boundaries.length, ...qa,
      };
      reports.push(record);
    }
  }
  const reportFile = path.join(outputDir, 'voice-pronunciation-audit.json');
  fs.writeFileSync(reportFile, JSON.stringify({ version: 2, samples: reports }, null, 2));
  console.log(JSON.stringify({ reportFile, samples: reports }, null, 2));
  console.log('IMPORTANTE: comprobar auditivamente doce, be labial y signos. WordBoundary no certifica pronunciación acústica.');
};
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
