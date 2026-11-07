export interface MediaStream {
  codec_type?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  duration?: string | number;
  nb_frames?: string | number;
}

export interface MediaMetadata {
  format?: { duration?: string | number };
  streams?: MediaStream[];
}

export interface RenderRequirements {
  width: number;
  height: number;
  fps: number;
  narrationRequired: boolean;
  plannedDurationSeconds?: number;
}

export interface RenderIntegrityReport {
  passed: boolean;
  errors: string[];
  warnings: string[];
  actual: {
    width?: number;
    height?: number;
    fps: number | null;
    videoDuration: number | null;
    audioDuration: number | null;
    containerDuration: number | null;
  };
}

const positive = (value: string | number | undefined): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const frameRate = (value: string | undefined): number | null => {
  if (!value) return null;
  const [numerator, denominator = '1'] = value.split('/');
  const n = Number(numerator);
  const d = Number(denominator);
  return Number.isFinite(n) && Number.isFinite(d) && d > 0 && n > 0 ? n / d : null;
};

/**
 * Validate the encoded MP4, not merely the render command or an estimated scene plan.
 * Warnings are kept separate because a deliberate pedagogical pause can extend
 * the visual timeline beyond speech without making the output invalid.
 */
export function validateRenderIntegrity(metadata: MediaMetadata, expected: RenderRequirements): RenderIntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const streams = metadata.streams || [];
  const video = streams.find((stream) => stream.codec_type === 'video');
  const audio = streams.find((stream) => stream.codec_type === 'audio');
  const containerDuration = positive(metadata.format?.duration);
  const videoDuration = positive(video?.duration) ?? containerDuration;
  const audioDuration = positive(audio?.duration);
  const fps = frameRate(video?.avg_frame_rate) ?? frameRate(video?.r_frame_rate);

  if (!video) errors.push('No existe una pista de video decodificable.');
  if (video && (video.width !== expected.width || video.height !== expected.height)) {
    errors.push(`Resolución incorrecta: ${video.width}x${video.height}; se esperaba ${expected.width}x${expected.height}.`);
  }
  if (!fps || Math.abs(fps - expected.fps) > 0.01) {
    errors.push(`FPS incorrectos: ${fps ?? 'desconocido'}; se esperaban ${expected.fps}.`);
  }
  if (videoDuration === null) errors.push('La duración del video no es válida.');
  if (video?.nb_frames !== undefined && Number(video.nb_frames) === 0) errors.push('El archivo no contiene fotogramas.');
  if (expected.narrationRequired && !audio) errors.push('La narración se solicitó pero el video no contiene audio.');

  if (audio && audioDuration === null) {
    warnings.push('FFprobe no informó la duración de la pista de audio; se requiere revisión de sincronización.');
  }
  if (videoDuration !== null && audioDuration !== null) {
    const excessAudio = audioDuration - videoDuration;
    if (excessAudio > 0.5) {
      errors.push(`La pista de audio excede la imagen por ${excessAudio.toFixed(2)} segundos.`);
    }
    const trailingSilence = videoDuration - audioDuration;
    if (expected.narrationRequired && trailingSilence > Math.max(1.5, videoDuration * 0.04)) {
      warnings.push(`La imagen continúa ${trailingSilence.toFixed(2)} segundos después de la pista de narración.`);
    }
  }
  const planned = expected.plannedDurationSeconds;
  if (videoDuration !== null && planned !== undefined && Number.isFinite(planned) && planned > 0) {
    const drift = Math.abs(videoDuration - planned);
    if (drift > Math.max(1.5, planned * 0.04)) {
      warnings.push(`Duración renderizada y timeline difieren ${drift.toFixed(2)} segundos.`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    actual: {
      width: video?.width,
      height: video?.height,
      fps,
      videoDuration,
      audioDuration,
      containerDuration,
    },
  };
}
