import test from 'node:test';
import assert from 'node:assert/strict';
import { videoGenerationSchema } from './video.schema.js';

test('applies safe defaults to a valid generation request', () => {
  const result = videoGenerationSchema.parse({
    title: 'Ecuación cuadrática',
    content: 'x^2 - 5x + 6 = 0',
  });

  assert.equal(result.quality, 'medium');
  assert.equal(result.aspectRatio, '16:9');
  assert.equal(result.layoutDensity, 'comfortable');
  assert.equal(result.narrationStyle, 'warm_teacher');
  assert.equal(result.enableNarration, true);
  assert.equal(result.aiProvider, 'openrouter');
  assert.equal(result.enableComfyUI, false);
});

test('accepts supported social formats', () => {
  const result = videoGenerationSchema.parse({
    title: 'Formato vertical',
    content: 'x^2 - 5x + 6 = 0',
    aspectRatio: '9:16',
    layoutDensity: 'compact',
    narrationStyle: 'neutral_teacher',
  });

  assert.equal(result.aspectRatio, '9:16');
  assert.equal(result.layoutDensity, 'compact');
  assert.equal(result.narrationStyle, 'neutral_teacher');
});

test('rejects oversized content and unsupported options', () => {
  const result = videoGenerationSchema.safeParse({
    title: 'Prueba',
    content: 'x'.repeat(10001),
    quality: 'ultra',
  });

  assert.equal(result.success, false);
});

test('rejects unknown fields instead of silently accepting them', () => {
  const result = videoGenerationSchema.safeParse({
    title: 'Prueba',
    content: 'x = 1',
    promptInjection: 'ignore previous instructions',
  });

  assert.equal(result.success, false);
});

test('accepts a safe idempotency key', () => {
  const result = videoGenerationSchema.parse({
    title: 'Idempotencia',
    content: 'x^2 - 5x + 6 = 0',
    idempotencyKey: 'lesson-2026-08-19:quadratic-01',
  });

  assert.equal(result.idempotencyKey, 'lesson-2026-08-19:quadratic-01');
});

test('rejects unsafe identifiers', () => {
  const result = videoGenerationSchema.safeParse({
    id: '../video',
    title: 'Prueba',
    content: 'x = 1',
  });

  assert.equal(result.success, false);
});
