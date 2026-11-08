import fs from 'node:fs';

export interface SpokenWordBoundary {
  text: string;
  startSeconds: number;
  endSeconds: number;
}

const TIMESTAMP = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;
const timeSeconds = (source: string): number => {
  const match = source.match(TIMESTAMP);
  if (!match) throw new Error('VOICE_BOUNDARY_INVALID: Formato SRT inválido.');
  const [, h, m, s, ms] = match;
  if (+m >= 60 || +s >= 60) throw new Error('VOICE_BOUNDARY_INVALID: Tiempo SRT fuera de rango.');
  return (+h * 3600) + (+m * 60) + (+s) + (+ms / 1000);
};

/** Parse Edge TTS's actual WordBoundary subtitle timestamps, never estimated word durations. */
export function parseWordBoundaries(srt: string, audioDurationSeconds: number): SpokenWordBoundary[] {
  if (!Number.isFinite(audioDurationSeconds) || audioDurationSeconds <= 0
      || srt.length > 300_000) throw new Error('VOICE_BOUNDARY_INVALID: Archivo de voz fuera de rango.');
  if (!srt.trim()) return [];
  const blocks = srt.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  if (blocks.length > 5000) throw new Error('VOICE_BOUNDARY_INVALID: Demasiadas marcas.');
  const words: SpokenWordBoundary[] = [];
  for (const [index, block] of blocks.entries()) {
    const lines = block.trim().split('\n');
    if (lines.length < 3 || Number(lines[0].trim()) !== index + 1) {
      throw new Error('VOICE_BOUNDARY_INVALID: Índices SRT incorrectos.');
    }
    const times = lines[1].split(/\s+-->\s+/);
    if (times.length !== 2) throw new Error('VOICE_BOUNDARY_INVALID: Marcador temporal inválido.');
    const startSeconds = timeSeconds(times[0]);
    const endSeconds = timeSeconds(times[1]);
    const text = lines.slice(2).join(' ').trim();
    if (!text || text.length > 150 || !Number.isFinite(startSeconds) || endSeconds <= startSeconds
        || startSeconds < 0 || endSeconds > audioDurationSeconds + 0.15
        || (words.length > 0 && startSeconds + 0.01 < words[words.length - 1].endSeconds)) {
      throw new Error('VOICE_BOUNDARY_INVALID: Palabras fuera del audio o fuera de orden.');
    }
    words.push({ text, startSeconds, endSeconds });
  }
  return words;
}

export function readWordBoundaries(filePath: string, duration: number): SpokenWordBoundary[] {
  if (!fs.existsSync(filePath)) return [];
  return parseWordBoundaries(fs.readFileSync(filePath, 'utf8'), duration);
}

/** Highlight after the equation reveal, near the first actual spoken word. */
export function cueHighlightOffset(
  words: SpokenWordBoundary[],
  cueDuration: number,
  speechLeadSeconds: number,
): number {
  if (!Number.isFinite(cueDuration) || cueDuration < 0.8) throw new Error('VOICE_CUE_DURATION_INVALID');
  const desired = speechLeadSeconds + (words[0]?.startSeconds ?? 0);
  // The formula reveal requires 0.25s. Reserve 0.25s for the highlight itself.
  return Number(Math.min(Math.max(0.25, desired), cueDuration - 0.45).toFixed(3));
}
