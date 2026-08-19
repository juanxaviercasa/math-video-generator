type RequestMetric = {
  method: string;
  route: string;
  status: number;
  durationMs: number;
};

const counters = new Map<string, number>();
const latency = new Map<string, { count: number; totalMs: number; maxMs: number }>();

const increment = (key: string) => counters.set(key, (counters.get(key) || 0) + 1);

const safeRoute = (route: string) => route
  .replace(/\/[0-9a-f]{8,}/gi, '/:id')
  .replace(/\/video_[^/]+/g, '/:videoId');

export const runtimeMetrics = {
  observe(request: RequestMetric) {
    const route = safeRoute(request.route);
    increment(`http_requests_total|${request.method}|${route}|${request.status}`);
    if (request.status >= 500) increment('http_errors_total');
    const key = `${request.method}|${route}`;
    const current = latency.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    current.count += 1;
    current.totalMs += request.durationMs;
    current.maxMs = Math.max(current.maxMs, request.durationMs);
    latency.set(key, current);
  },
  snapshot() {
    return {
      counters: Object.fromEntries(counters),
      latency: Object.fromEntries([...latency.entries()].map(([key, value]) => [key, {
        ...value,
        averageMs: Number((value.totalMs / value.count).toFixed(2)),
      }])),
      capturedAt: new Date().toISOString(),
    };
  },
  prometheus() {
    const lines = ['# TYPE mvg_http_requests_total counter'];
    for (const [key, value] of counters) {
      const [metric, method, route, status] = key.split('|');
      if (metric === 'http_requests_total') lines.push(`mvg_http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}`);
      if (key === 'http_errors_total') lines.push(`mvg_http_errors_total ${value}`);
    }
    lines.push('# TYPE mvg_http_request_duration_ms summary');
    for (const [key, value] of latency) {
      const [method, route] = key.split('|');
      lines.push(`mvg_http_request_duration_ms_count{method="${method}",route="${route}"} ${value.count}`);
      lines.push(`mvg_http_request_duration_ms_sum{method="${method}",route="${route}"} ${value.totalMs.toFixed(2)}`);
      lines.push(`mvg_http_request_duration_ms_max{method="${method}",route="${route}"} ${value.maxMs.toFixed(2)}`);
    }
    return `${lines.join('\n')}\n`;
  },
};
