import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const wordSynthScript = fileURLToPath(new URL('../../python/synthesize_words.py', import.meta.url));
import { resolveVoiceId } from './voice-catalog.service.js';
import { prepareSpanishMathNarration } from './spanish-math-speech.service.js';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const DEFAULT_NEURAL_RATE = '-8%';

const escapeSingleQuotes = (value: string): string => value.replace(/'/g, "''");

const removeIfExists = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Best-effort cleanup; invalid output is still rejected below.
  }
};

const isValidAudioFile = async (filePath: string): Promise<boolean> => {
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile() || stat.size < 1024) return false;

    const { stdout } = await execFileAsync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
      { timeout: 5000, killSignal: 'SIGKILL' },
    );
    const duration = Number.parseFloat(stdout.trim());
    return Number.isFinite(duration) && duration > 0;
  } catch {
    return false;
  }
};

const buildWindowsTtsCommand = (outputPath: string, text: string): string => {
  const safeOutput = outputPath.replace(/'/g, "''");
  const safeText = escapeSingleQuotes(text);
  return `powershell -NoProfile -ExecutionPolicy Bypass -Command "$tts = New-Object System.Speech.Synthesis.SpeechSynthesizer; $tts.SetOutputToWaveFile('${safeOutput}'); $tts.Rate = -1; $tts.Volume = 100; $tts.Speak('${safeText}'); $tts.Dispose()"`;
};

const getEdgeTtsArgs = (outputPath: string, subtitlePath: string, text: string, style: 'warm_teacher' | 'neutral_teacher', voiceId: string): string[] => [
  `--voice=${resolveVoiceId(voiceId)}`,
  `--rate=${style === 'warm_teacher' ? (process.env.TTS_NEURAL_RATE || DEFAULT_NEURAL_RATE) : '-10%'}`,
  '--text', text,
  '--write-media', outputPath,
  '--write-subtitles', subtitlePath,
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
    options: { style?: 'warm_teacher' | 'neutral_teacher'; voiceId?: string } = {},
  ): Promise<string> {
    const normalized = prepareSpanishMathNarration(text);
    if (!normalized) {
      return '';
    }

    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${fileName}-narration.wav`);
    const neuralOutputPath = path.join(outputDir, `${fileName}-narration.mp3`);
    const subtitlePath = path.join(outputDir, `${fileName}-narration.srt`);
    const provider = (process.env.TTS_PROVIDER || 'edge').toLowerCase();
    const style = options.style || 'warm_teacher';
    const voiceId = resolveVoiceId(options.voiceId);

    if (provider !== 'espeak' && provider !== 'local') {
      const retryCount = Math.max(1, Math.min(3, Number(process.env.TTS_NEURAL_RETRIES || 2)));
      const rate = style === 'warm_teacher' ? (process.env.TTS_NEURAL_RATE || DEFAULT_NEURAL_RATE) : '-10%';
      let lastError: unknown;
      for (let attempt = 1; attempt <= retryCount; attempt += 1) {
        removeIfExists(neuralOutputPath);
        removeIfExists(subtitlePath);

        // Prefer word-boundary python synthesizer to extract exact word timings
        if (fs.existsSync(wordSynthScript)) {
          const pythonCommands = process.platform === 'win32'
            ? ['python', 'py', 'python3']
            : ['python3', 'python'];
          for (const pyCmd of pythonCommands) {
            try {
              await execFileAsync(pyCmd, [wordSynthScript, voiceId, rate, neuralOutputPath, subtitlePath, normalized], {
                timeout: 45000,
                killSignal: 'SIGKILL',
              });
              if (await isValidAudioFile(neuralOutputPath)) return neuralOutputPath;
            } catch (error) {
              lastError = error;
              removeIfExists(neuralOutputPath);
              removeIfExists(subtitlePath);
            }
          }
        }

        const invocations = [
          { command: process.env.EDGE_TTS_COMMAND || 'edge-tts', prefix: [] as string[] },
          { command: process.platform === 'win32' ? 'py' : 'python3', prefix: ['-m', 'edge_tts'] },
          { command: 'python', prefix: ['-m', 'edge_tts'] },
        ];
        for (const entry of invocations) {
          try {
            await execFileAsync(entry.command, [...entry.prefix, ...getEdgeTtsArgs(neuralOutputPath, subtitlePath, normalized, style, voiceId)], {
              timeout: 45000,
              killSignal: 'SIGKILL',
            });
            if (await isValidAudioFile(neuralOutputPath)) return neuralOutputPath;
            throw new Error('Edge TTS produjo un archivo vacío o no decodificable');
          } catch (error) {
            lastError = error;
            removeIfExists(neuralOutputPath);
            removeIfExists(subtitlePath);
          }
        }
        if (attempt < retryCount) console.warn(`⚠️ TTS neural reintento ${attempt}/${retryCount}:`, lastError instanceof Error ? lastError.message : lastError);
      }
      console.warn('⚠️ TTS neural no disponible:', lastError instanceof Error ? lastError.message : lastError);
      console.warn('Para habilitar las voces neurales, instala la librería: python -m pip install edge-tts (y comprueba edge-tts --version).');
      if (process.env.TTS_ALLOW_LOCAL_FALLBACK !== 'true') {
        console.warn('⚠️ Fallback local deshabilitado para conservar la voz neural aprobada.');
        return '';
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
      if (await isValidAudioFile(outputPath)) return outputPath;
      removeIfExists(outputPath);
    } catch (error) {
      console.warn('⚠️ espeak TTS falló:', error instanceof Error ? error.message : error);
    }

    console.warn('⚠️ No se pudo generar narración: instala espeak y configura TTS_VOICE si es necesario.');
    return '';
  },
};
