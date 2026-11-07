export interface VoiceOption {
  id: string;
  label: string;
  locale: string;
  language: 'es';
  gender: 'female' | 'male';
  provider: 'edge';
}

/** Curated Spanish-language neural voices. IDs are validated server-side before executing TTS. */
export const SPANISH_VOICES: readonly VoiceOption[] = [
  { id: 'es-PE-CamilaNeural', label: 'Camila — Perú', locale: 'es-PE', language: 'es', gender: 'female', provider: 'edge' },
  { id: 'es-PE-AlexNeural', label: 'Alex — Perú', locale: 'es-PE', language: 'es', gender: 'male', provider: 'edge' },
  { id: 'es-MX-DaliaNeural', label: 'Dalia — México', locale: 'es-MX', language: 'es', gender: 'female', provider: 'edge' },
  { id: 'es-MX-JorgeNeural', label: 'Jorge — México', locale: 'es-MX', language: 'es', gender: 'male', provider: 'edge' },
  { id: 'es-CO-SalomeNeural', label: 'Salomé — Colombia', locale: 'es-CO', language: 'es', gender: 'female', provider: 'edge' },
  { id: 'es-CO-GonzaloNeural', label: 'Gonzalo — Colombia', locale: 'es-CO', language: 'es', gender: 'male', provider: 'edge' },
  { id: 'es-ES-ElviraNeural', label: 'Elvira — España', locale: 'es-ES', language: 'es', gender: 'female', provider: 'edge' },
  { id: 'es-ES-AlvaroNeural', label: 'Álvaro — España', locale: 'es-ES', language: 'es', gender: 'male', provider: 'edge' },
];

export const DEFAULT_NARRATOR = 'es-PE-CamilaNeural';

export function resolveVoiceId(value?: string): string {
  const id = value || process.env.TTS_NEURAL_VOICE || DEFAULT_NARRATOR;
  if (!SPANISH_VOICES.some((voice) => voice.id === id)) {
    throw new Error('VOICE_NOT_SUPPORTED: Elige una voz neural del catálogo.');
  }
  return id;
}
