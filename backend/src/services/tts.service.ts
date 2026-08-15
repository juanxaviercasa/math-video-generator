import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const escapeSingleQuotes = (value: string): string => value.replace(/'/g, "''");

const buildWindowsTtsCommand = (outputPath: string, text: string): string => {
  const safeOutput = outputPath.replace(/'/g, "''");
  const safeText = escapeSingleQuotes(text);
  return `powershell -NoProfile -ExecutionPolicy Bypass -Command "$tts = New-Object System.Speech.Synthesis.SpeechSynthesizer; $tts.SetOutputToWaveFile('${safeOutput}'); $tts.Rate = -1; $tts.Volume = 100; $tts.Speak('${safeText}'); $tts.Dispose()"`;
};

const buildEsliteCommand = (outputPath: string, text: string): string => {
  const safeText = text.replace(/"/g, '\\"').replace(/`/g, '\\`');
  return `espeak "${safeText}" -w "${outputPath}"`;
};

export const tts = {
  async generateNarrationAudio(text: string, outputDir: string, fileName: string): Promise<string> {
    const normalized = (text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return '';
    }

    const outputPath = path.join(outputDir, `${fileName}-narration.wav`);
    const commands: string[] = [];

    if (process.platform === 'win32') {
      commands.push(buildWindowsTtsCommand(outputPath, normalized));
    }

    commands.push(buildEsliteCommand(outputPath, normalized));

    for (const command of commands) {
      try {
        await execAsync(command);
        if (fs.existsSync(outputPath)) {
          return outputPath;
        }
      } catch (error) {
        console.warn('⚠️  TTS fallback failed:', error instanceof Error ? error.message : error);
      }
    }

    return '';
  },
};
