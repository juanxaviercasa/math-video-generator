import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_NARRATOR, resolveVoiceId, SPANISH_VOICES } from './voice-catalog.service.js';

test('Spanish voice library has unique supported Edge TTS voice IDs', () => {
  assert.ok(SPANISH_VOICES.length >= 6);
  assert.ok(SPANISH_VOICES.some((voice) => voice.id === DEFAULT_NARRATOR));
  assert.equal(new Set(SPANISH_VOICES.map((voice) => voice.id)).size, SPANISH_VOICES.length);
  assert.ok(SPANISH_VOICES.every((voice) => voice.id.startsWith('es-')));
});

test('prevents shell arguments from selecting arbitrary TTS voice IDs', () => {
  assert.equal(resolveVoiceId('es-MX-DaliaNeural'), 'es-MX-DaliaNeural');
  assert.throws(() => resolveVoiceId('es-PE-CamilaNeural --write-media /tmp/leak'), /VOICE_NOT_SUPPORTED/);
});
