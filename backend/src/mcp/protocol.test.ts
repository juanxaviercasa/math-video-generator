import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMathMcpRequest, mathMcpTools } from './protocol.js';

const request = (id: number, method: string, params?: object) => handleMathMcpRequest({ jsonrpc: '2.0', id, method, params });

test('MCP initializes and lists read-only math tools for Antigravity, Gemini and ChatGPT', () => {
  const init = request(1, 'initialize', { protocolVersion: '2025-06-18' });
  assert.equal((init?.result as { protocolVersion?: string }).protocolVersion, '2025-06-18');
  assert.equal(mathMcpTools.length, 4);
  assert.equal(mathMcpTools.some((tool) => /generate_video|delete|upload/.test(tool.name)), false);
  const list = request(2, 'tools/list')?.result as { tools: { name: string }[] };
  assert.ok(list.tools.some((tool) => tool.name === 'validate_math'));
});

test('MCP returns a verified quadratic but never manufactures an unsupported solution', () => {
  const response = request(3, 'tools/call', { name: 'validate_math', arguments: { problem: 'x^2 - 5x + 6 = 0' } });
  assert.ok(JSON.stringify(response).includes('quadratic'));
  const unsupported = request(4, 'tools/call', { name: 'preview_quadratic_storyboard', arguments: { problem: 'integral de x cuadrado' } });
  assert.equal((unsupported?.result as { isError?: boolean }).isError, true);
});

test('MCP blocks unknown tools, handles notifications and invalid messages', () => {
  assert.equal(handleMathMcpRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.equal(request(8, 'tools/call', { name: 'private_job_status', arguments: {} })?.error?.code, -32602);
  assert.equal(request(9, 'unknown_method')?.error?.code, -32601);
  assert.equal(handleMathMcpRequest({ foo: 'bar' })?.error?.code, -32600);
});
