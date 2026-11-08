import type { SpokenWordBoundary } from './voice-boundary.service.js';

/**
 * Semantic visual events are driven by real TTS word start times. Unlike a
 * duration-based montage, these events follow the exact phrase spoken.
 * They do NOT claim phoneme-accurate forced alignment.
 */
export interface SemanticBeat {
  phrase: string;
  atSeconds: number;
  wordIndex: number;
}

const tokens = (text: string): string[] => (
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es').match(/[a-z0-9]+/g) || []
);

export function resolveSemanticBeats(
  phrases: string[],
  boundaries: SpokenWordBoundary[],
  leadSeconds: number,
  sceneSeconds: number,
): SemanticBeat[] {
  if (!phrases.length) return [];
  if (!boundaries.length) throw new Error('VOICE_BEATS_MISSING: No existen marcas reales para los eventos.');
  if (!Number.isFinite(leadSeconds) || leadSeconds < 0
    || !Number.isFinite(sceneSeconds) || sceneSeconds <= leadSeconds) {
    throw new Error('VOICE_BEATS_INVALID_CLOCK');
  }
  const flattened = boundaries.flatMap((boundary, wordIndex) =>
    tokens(boundary.text).map((token) => ({
      token, wordIndex, start: boundary.startSeconds,
    })));
  let nextIndex = 0;
  const resolved: SemanticBeat[] = [];
  for (const phrase of phrases) {
    const wanted = tokens(phrase);
    if (!wanted.length) throw new Error('VOICE_BEATS_INVALID_PHRASE');
    let found = -1;
    for (let i = nextIndex; i <= flattened.length - wanted.length; i += 1) {
      if (wanted.every((token, j) => flattened[i + j].token === token)) {
        found = i;
        break;
      }
    }
    if (found < 0) throw new Error('VOICE_BEAT_NOT_FOUND: No se pronunció la referencia «' + phrase + '».');
    const atSeconds = Number((leadSeconds + flattened[found].start).toFixed(3));
    if (atSeconds + 0.36 >= sceneSeconds) {
      throw new Error('VOICE_BEAT_TOO_LATE: Falta tiempo para mostrar «' + phrase + '».');
    }
    if (resolved.length && atSeconds - resolved[resolved.length - 1].atSeconds < 0.40) {
      throw new Error('VOICE_BEAT_TOO_CLOSE: La narración no permite revelar dos operaciones separadas.');
    }
    resolved.push({ phrase, atSeconds, wordIndex: flattened[found].wordIndex });
    nextIndex = found + wanted.length;
  }
  return resolved;
}

export interface ObservedBeat {
  index: number;
  expectedSeconds: number;
  actualSeconds: number;
}

export function auditSemanticBeatTiming(
  stages: Array<{ id: string; beats?: ObservedBeat[] }>,
  expected: Record<string, number[]>,
  toleranceSeconds = 0.17,
): { passed: boolean; errors: string[]; checked: number } {
  const errors: string[] = [];
  let checked = 0;
  for (const [sceneId, offsets] of Object.entries(expected)) {
    const stage = stages.find((item) => item.id === sceneId);
    if (!stage || (stage.beats || []).length !== offsets.length) {
      errors.push('VOICE_BEAT_MISSING: ' + sceneId);
      continue;
    }
    (stage.beats || []).forEach((beat, index) => {
      const offset = offsets[index];
      checked += 1;
      if (beat.index !== index || !Number.isFinite(beat.actualSeconds)
        || Math.abs(beat.actualSeconds - offset) > toleranceSeconds) {
        errors.push('VOICE_BEAT_DRIFT: ' + sceneId + ' evento ' + (index + 1));
      }
    });
  }
  return { passed: !errors.length, errors, checked };
}
