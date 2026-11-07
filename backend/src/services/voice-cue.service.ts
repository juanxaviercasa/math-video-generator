import type { PedagogicalScene } from './pedagogy.service.js';

export const CUE_INTRO_SECONDS = 1.2;
export const CUE_OUTRO_SECONDS = 1.0;
export const MIN_CUE_SECONDS = 1.2;

/** A voice cue belongs to one and only one verified visual transformation. */
export function extractVoiceCues(scene: PedagogicalScene): string[] {
  if (scene.layout !== 'equation' || !scene.visualStages?.length) return [];
  if (!scene.visualStages.every((stage) => typeof stage.voiceText === 'string' && stage.voiceText.trim().length >= 5)) return [];
  return scene.visualStages.map((stage) => stage.voiceText!.trim());
}

export interface CueTimingPlan {
  stageDurations: number[];
  stageStarts: number[];
  sceneDuration: number;
  introSeconds: number;
  outroSeconds: number;
}

/** Derived from decoded neural audio, not LLM estimates or character counts. */
export function buildCueTimingPlan(actualSpeechDurations: number[]): CueTimingPlan {
  if (!actualSpeechDurations.length || actualSpeechDurations.length > 12
    || !actualSpeechDurations.every((seconds) => Number.isFinite(seconds) && seconds > 0)) {
    throw new Error('VOICE_CUES_INVALID: Cada transformación necesita un audio válido.');
  }
  // Use 1/100s because FFmpeg samples at 24 kHz and Manim runs at 30 fps.
  const stageDurations = actualSpeechDurations.map((seconds) => Math.ceil(Math.max(MIN_CUE_SECONDS, seconds + 0.18) * 100) / 100);
  let cursor = CUE_INTRO_SECONDS;
  const stageStarts = stageDurations.map((duration) => {
    const start = Math.round(cursor * 100) / 100;
    cursor += duration;
    return start;
  });
  return {
    stageDurations,
    stageStarts,
    sceneDuration: Math.round((cursor + CUE_OUTRO_SECONDS) * 100) / 100,
    introSeconds: CUE_INTRO_SECONDS,
    outroSeconds: CUE_OUTRO_SECONDS,
  };
}
