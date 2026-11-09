import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMathMcpRequest, mathMcpTools } from './protocol.js';

const request = async (id: number, method: string, params?: object) =>
  await handleMathMcpRequest({ jsonrpc: '2.0', id, method, params });

test('MCP initializes and lists read-only math tools for Antigravity, Gemini and ChatGPT', async () => {
  const init = await request(1, 'initialize', { protocolVersion: '2025-06-18' });
  assert.equal((init?.result as { protocolVersion?: string }).protocolVersion, '2025-06-18');
  assert.equal(mathMcpTools.length, 9);
  assert.equal(mathMcpTools.some((tool) => /generate_video|delete|upload/.test(tool.name)), false);
  const list = (await request(2, 'tools/list'))?.result as { tools: { name: string }[] };
  assert.ok(list.tools.some((tool) => tool.name === 'validate_math'));
  assert.ok(list.tools.some((tool) => tool.name === 'list_math_engines_catalog'));
  assert.ok(list.tools.some((tool) => tool.name === 'recommend_engine_for_topic'));
  assert.ok(list.tools.some((tool) => tool.name === 'audit_webpage_math_opportunities'));
  assert.ok(list.tools.some((tool) => tool.name === 'generate_widget_embed_code'));
  assert.ok(list.tools.some((tool) => tool.name === 'crawl_and_audit_domain'));
});

test('MCP returns a verified quadratic but never manufactures an unsupported solution', async () => {
  const response = await request(3, 'tools/call', { name: 'validate_math', arguments: { problem: 'x^2 - 5x + 6 = 0' } });
  assert.ok(JSON.stringify(response).includes('quadratic'));
  const unsupported = await request(4, 'tools/call', { name: 'preview_quadratic_storyboard', arguments: { problem: 'integral de x cuadrado' } });
  assert.equal((unsupported?.result as { isError?: boolean }).isError, true);
});

test('MCP exposes the 60 deterministic engines catalog, topic recommender, webpage auditor and embed generator', async () => {
  const catalogRes = await request(5, 'tools/call', { name: 'list_math_engines_catalog', arguments: {} });
  const catalogText = (catalogRes?.result as { content: { text: string }[] }).content[0].text;
  assert.ok(catalogText.includes('"totalEngines": 60'));

  const recRes = await request(6, 'tools/call', {
    name: 'recommend_engine_for_topic',
    arguments: { topic: 'Límites, derivada y recta tangente de una parábola', sampleEquations: ['x^2 - 4x + 3 = 0'] },
  });
  const recText = (recRes?.result as { content: { text: string }[] }).content[0].text;
  assert.ok(recText.includes('mafs-react'));

  const auditRes = await request(7, 'tools/call', {
    name: 'audit_webpage_math_opportunities',
    arguments: {
      url: 'https://miweb.edu/calculo',
      htmlOrMarkdown: '<h2>1. Recta Tangente</h2><p>Estudiamos la función x^2 - 5x + 6 = 0 con una imagen fija.</p><img src="parabola.png" />',
    },
  });
  const auditText = (auditRes?.result as { content: { text: string }[] }).content[0].text;
  assert.ok(auditText.includes('opportunitiesFound'));

  const embedRes = await request(10, 'tools/call', {
    name: 'generate_widget_embed_code',
    arguments: { toolId: 'cindyjs', expression: 'x^2 - 4x + 3 = 0', height: 520 },
  });
  const embedText = (embedRes?.result as { content: { text: string }[] }).content[0].text;
  assert.ok(embedText.includes('embed=1&tool=cindyjs'));
});

test('MCP blocks unknown tools, handles notifications and invalid messages', async () => {
  assert.equal(await handleMathMcpRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.equal((await request(8, 'tools/call', { name: 'private_job_status', arguments: {} }))?.error?.code, -32602);
  assert.equal((await request(9, 'unknown_method'))?.error?.code, -32601);
  assert.equal((await handleMathMcpRequest({ foo: 'bar' }))?.error?.code, -32600);
});
