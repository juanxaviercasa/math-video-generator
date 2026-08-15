import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNarrationScript } from './openai.service.js';

test('buildNarrationScript creates pedagogical narration from problem steps', () => {
  const steps = [
    'Primero, combinamos términos semejantes: 3x + 2x = 5x.',
    'Luego, restamos 4 de ambos lados para aislar la variable.',
    'Finalmente, dividimos entre 5 y obtenemos x = 2.'
  ];

  const narration = buildNarrationScript('Resuelve 3x + 4 = 14', steps);

  assert.equal(Array.isArray(narration), true);
  assert.ok(narration.length >= 3);
  assert.ok(narration.some((entry) => entry.toLowerCase().includes('primero')));
  assert.ok(narration.some((entry) => entry.toLowerCase().includes('finalmente')));
});
