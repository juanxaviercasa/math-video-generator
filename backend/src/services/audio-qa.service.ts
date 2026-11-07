import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ffmpeg } from './ffmpeg.service.js';

const run = promisify(execFile);

export interface AudioAudibilityReport {
  passed: boolean;
  maxDb: number | null;
  meanDb: number | null;
  reason?: string;
}

/** Detects silent or near-silent audio tracks; metadata presence alone is not enough. */
export function parseVolumeReport(log: string): AudioAudibilityReport {
  const max = /max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/i.exec(log)?.[1];
  const mean = /mean_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/i.exec(log)?.[1];
  const maxDb = max ? Number(max) : null;
  const meanDb = mean ? Number(mean) : null;
  if (maxDb === null || meanDb === null || Number.isNaN(maxDb) || Number.isNaN(meanDb)) {
    return { passed: false, maxDb: null, meanDb: null, reason: 'AUDIO_LEVEL_UNAVAILABLE' };
  }
  if (maxDb < -38 || meanDb < -55) {
    return { passed: false, maxDb, meanDb, reason: 'AUDIO_SILENT_OR_TOO_QUIET' };
  }
  return { passed: true, maxDb, meanDb };
}

export async function validateAudibleAudio(file: string): Promise<AudioAudibilityReport> {
  const { stderr } = await run(ffmpeg.getCommand(), [
    '-hide_banner', '-nostdin', '-i', file, '-map', '0:a:0', '-af', 'volumedetect',
    '-vn', '-f', 'null', '-',
  ], { timeout: 120000, maxBuffer: 3 * 1024 * 1024 });
  return parseVolumeReport(stderr);
}
