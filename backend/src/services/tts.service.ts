import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const escapeSingleQuotes = (value: string): string => value.replace(/'/g, "''");

const buildWindowsTtsCommand = (outputPath: string, text: string): string => {
  const safeOutput = outputPath.replace(/'/g, "''");
  const safeText = escapeSingleQuotes(text);
  return `powershell -NoProfile -ExecutionPolicy Bypass -Command "$tts = New-Object System.Speech.Synthesis.SpeechSynthesizer; $tts.SetOutputToWaveFile('${safeOutput}'); $tts.Rate = -1; $tts.Volume = 100; $tts.Speak('${safeText}'); $tts.Dispose()"`;
};

const getEdgeTtsArgs = (outputPath: string, text: string, style: 'warm_teacher' | 'neutral_teacher'): string[] => [
  `--voice=${process.env.TTS_NEURAL_VOICE || 'es-MX-DaliaNeural'}`,
  `--rate=${style === 'warm_teacher' ? (process.env.TTS_NEURAL_RATE || '-8%') : '-10%'}`,
  '--text', text,
  '--write-media', outputPath,
];

const getEspeakArgs = (outputPath: string, text: string, style: 'warm_teacher' | 'neutral_teacher'): string[] => [
  '-v', process.env.TTS_VOICE || 'es-la',
  '-s', style === 'warm_teacher' ? (process.env.TTS_SPEED || '145') : '138',
  '-w', outputPath,
  text,
];

export const tts = {
  async generateNarrationAudio(
    text: string,
    outputDir: string,
    fileName: string,
    options: { style?: 'warm_teacher' | 'neutral_teacher' } = {},
  ): Promise<string> {
    const normalized = (text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return '';
    }

    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${fileName}-narration.wav`);
    const neuralOutputPath = path.join(outputDir, `${fileName}-narration.mp3`);
    const provider = (process.env.TTS_PROVIDER || 'edge').toLowerCase();
    const style = options.style || 'warm_teacher';

    if (provider !== 'espeak' && provider !== 'local') {
      try {
        await execFileAsync('edge-tts', getEdgeTtsArgs(neuralOutputPath, normalized, style), {
          timeout: 45000,
          killSignal: 'SIGKILL',
        });
        if (fs.existsSync(neuralOutputPath)) return neuralOutputPath;
      } catch (error) {
        console.warn('⚠️ TTS neural no disponible; se usará fallback local:', error instanceof Error ? error.message : error);
      }
    }

    if (process.platform === 'win32') {
      try {
        await execAsync(buildWindowsTtsCommand(outputPath, normalized));
        if (fs.existsSync(outputPath)) return outputPath;
      } catch (error) {
        console.warn('⚠️ Windows TTS falló:', error instanceof Error ? error.message : error);
      }
    }

    try {
      await execFileAsync('espeak', getEspeakArgs(outputPath, normalized, style), {
        timeout: 15000,
        killSignal: 'SIGKILL',
      });
      if (fs.existsSync(outputPath)) return outputPath;
    } catch (error) {
      console.warn('⚠️ espeak TTS falló:', error instanceof Error ? error.message : error);
    }

    console.warn('⚠️ No se pudo generar narración: instala espeak y configura TTS_VOICE si es necesario.');
    return '';
  },
};
