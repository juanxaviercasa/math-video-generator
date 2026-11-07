import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface BlackInterval {
  start: number;
  end: number;
  duration: number;
}

export interface FinalFrameQAReport {
  passed: boolean;
  errors: string[];
  warnings: string[];
  blackIntervals: BlackInterval[];
  sampleFrames: string[];
  sampledAtSeconds: number[];
}

/** Parse FFmpeg blackdetect logs, including intervals ending at EOF. */
export const parseBlackIntervals = (stderr: string): BlackInterval[] => {
  const pattern = /black_start:([0-9.]+)\s+black_end:([0-9.]+)\s+black_duration:([0-9.]+)/g;
  return [...stderr.matchAll(pattern)].map((match) => ({
    start: Number(match[1]),
    end: Number(match[2]),
    duration: Number(match[3]),
  })).filter((range) => [range.start, range.end, range.duration].every(Number.isFinite) && range.duration >= 0 && range.end >= range.start);
};

export const assessBlackIntervals = (intervals: BlackInterval[], durationSeconds: number): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const interval of intervals) {
    const seconds = interval.duration;
    // Very short fades at scene boundaries are normal; meaningful blank sequences are not.
    if (seconds >= 0.70 && interval.start <= durationSeconds && interval.end >= 0) {
      errors.push('VISUAL_BLACKOUT: Pantalla prácticamente vacía de ' + interval.start.toFixed(2)
        + ' a ' + interval.end.toFixed(2) + ' s (' + seconds.toFixed(2) + ' s).');
    } else if (seconds >= 0.40) {
      warnings.push('Posible transición vacía de ' + seconds.toFixed(2) + ' s cerca de ' + interval.start.toFixed(2) + ' s.');
    }
  }
  return { errors, warnings };
};

const ffmpegExecutable = () => process.env.FFMPEG_PATH || 'ffmpeg';

const makeSampleTimes = (durationSeconds: number, count: number): number[] => (
  Array.from({ length: count }, (_, index) => Number(Math.max(0, Math.min(durationSeconds - 0.1, durationSeconds * (index + 0.5) / count)).toFixed(3)))
);

export async function auditFinalVideoFrames(
  videoPath: string,
  outputDir: string,
  durationSeconds: number,
  frameCount = 8,
): Promise<FinalFrameQAReport> {
  const report: FinalFrameQAReport = { passed: false, errors: [], warnings: [], blackIntervals: [], sampleFrames: [], sampledAtSeconds: [] };
  if (!fs.existsSync(videoPath) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    report.errors.push('VISUAL_MEDIA_INVALID: No existe un video válido para analizar.');
    return report;
  }
  try {
    const result = await execFileAsync(ffmpegExecutable(), [
      '-hide_banner', '-nostdin', '-i', videoPath,
      '-vf', 'blackdetect=d=0.40:pix_th=0.07:pic_th=0.998',
      '-an', '-f', 'null', '-',
    ], { maxBuffer: 8 * 1024 * 1024 });
    report.blackIntervals = parseBlackIntervals(String(result.stderr));
    const assessed = assessBlackIntervals(report.blackIntervals, durationSeconds);
    report.errors.push(...assessed.errors);
    report.warnings.push(...assessed.warnings);
  } catch (error) {
    report.errors.push('VISUAL_BLACKDETECT_FAILED: ' + (error instanceof Error ? error.message : String(error)));
    return report;
  }
  const samplesDir = path.join(outputDir, 'qa-frames');
  fs.mkdirSync(samplesDir, { recursive: true });
  const count = Math.max(1, Math.min(12, Math.floor(frameCount)));
  for (const [index, time] of makeSampleTimes(durationSeconds, count).entries()) {
    const target = path.join(samplesDir, 'final-' + String(index + 1).padStart(2, '0') + '.jpg');
    try {
      await execFileAsync(ffmpegExecutable(), [
        '-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', String(time),
        '-i', videoPath, '-frames:v', '1',
        '-vf', 'scale=960:960:force_original_aspect_ratio=decrease',
        '-q:v', '3', '-y', target,
      ], { maxBuffer: 1024 * 1024 });
      if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
        throw new Error('Fotograma no producido.');
      }
      report.sampleFrames.push(target);
      report.sampledAtSeconds.push(time);
    } catch (error) {
      report.errors.push('VISUAL_SAMPLE_FAILED: No se pudo inspeccionar el fotograma ' + (index + 1)
        + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  report.passed = report.errors.length === 0;
  return report;
}
