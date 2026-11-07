import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronization } from './synchronization.service.js';

test('oralizes quadratic notation for natural Spanish speech', () => {
  const narration = synchronization.oralizeMath('x^2 - 5x + 6 = 0');

  assert.match(narration, /elevado a la potencia dos/);
  assert.match(narration, /menos cinco/);
  assert.match(narration, /más seis/);
  assert.match(narration, /igual a cero/);
});

test('builds one synchronized scene per explicit step plus a neutral conclusion', () => {
  const scenes = synchronization.buildSynchronizedScenes('x^2 - 5x + 6 = 0', [
    'Identificamos a = 1.',
    'Aplicamos la fórmula: x = (-b ± √Δ) / (2a).',
    'Soluciones verificadas: x₁ = 3 y x₂ = 2.',
  ]);

  assert.deepEqual(scenes.map((scene) => scene.id), [
    'intro',
    'step-1',
    'step-2',
    'step-3',
    'conclusion',
  ]);
  assert.equal(new Set(scenes.map((scene) => scene.narrationText)).size, scenes.length);
  assert.ok(!scenes.some((scene) => scene.kind === 'graph'));
  assert.match(scenes.at(-1)?.narrationText || '', /comprueba el resultado/i);
  assert.ok(scenes.every((scene) => scene.estimatedDuration >= 3));
  assert.equal(scenes.find((scene) => scene.kind === 'formula')?.id, 'step-2');
});
