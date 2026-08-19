import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeMetrics } from './runtime-metrics.service.js';

test('records normalized request metrics and prometheus output', () => {
  const route = `/api/generate-video/status/video_${'a'.repeat(16)}`;
  runtimeMetrics.observe({ method: 'GET', route, status: 200, durationMs: 12.5 });
  runtimeMetrics.observe({ method: 'GET', route, status: 500, durationMs: 30 });
  const snapshot = runtimeMetrics.snapshot();
  const latency = snapshot.latency['GET|/api/generate-video/status/:videoId'];
  assert.equal(latency.count, 2);
  assert.equal(latency.maxMs, 30);
  assert.match(runtimeMetrics.prometheus(), /mvg_http_requests_total/);
});
