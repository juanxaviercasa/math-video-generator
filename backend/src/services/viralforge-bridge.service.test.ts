import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeViralForgeCatalog, inspectViralForge } from './viralforge-bridge.service.js';

test('bridge shows math-relevant datasets and excludes Kaggle accounts, tokens, and private paths', () => {
  const list = sanitizeViralForgeCatalog({
    datasets: [
      { slug: 'juanxaviercasa/qwen2-vl-7b-instruct-gguf', role: 'openjutsu_vision', title: 'Qwen2-VL', size_gb: 6.88, secret: 'never' },
      { slug: 'juanxaviercasa/qwen3-forced-aligner-06b', role: 'word_aligner', title: 'Forced aligner', size_gb: 1.71 },
      { slug: 'example/malicious', role: 'llm', title: 'Untrusted model' },
      { slug: 'juanxaviercasa/ugc-realistic-actors-studio', role: 'ugc_actors', title: 'UGC actors' },
    ],
    accounts: [{ key: 'PRIVATE_TOKEN', username: 'alice' }],
  });
  assert.equal(list.length, 2);
  assert.equal(list[0].title, 'Qwen2-VL');
  assert.equal(JSON.stringify(list).includes('PRIVATE_TOKEN'), false);
  assert.equal(JSON.stringify(list).includes('never'), false);
});

test('disabled bridge never invents an available Kaggle GPU', async () => {
  const prior = process.env.VIRALFORGE_INTERNAL_URL;
  delete process.env.VIRALFORGE_INTERNAL_URL;
  try {
    const result = await inspectViralForge();
    assert.equal(result.configured, false);
    assert.equal(result.inferenceReady, false);
    assert.deepEqual(result.models, []);
  } finally {
    if (prior !== undefined) process.env.VIRALFORGE_INTERNAL_URL = prior;
  }
});

test('bridge refuses plaintext connections to public hosts', async () => {
  const prior = process.env.VIRALFORGE_INTERNAL_URL;
  process.env.VIRALFORGE_INTERNAL_URL = 'http://example.com:8765';
  try {
    const result = await inspectViralForge();
    assert.equal(result.reachable, false);
    assert.match(result.message, /HTTPS/);
  } finally {
    if (prior === undefined) delete process.env.VIRALFORGE_INTERNAL_URL;
    else process.env.VIRALFORGE_INTERNAL_URL = prior;
  }
});
