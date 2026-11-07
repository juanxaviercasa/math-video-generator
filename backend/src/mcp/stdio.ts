import readline from 'node:readline';
import { handleMathMcpRequest } from './protocol.js';

// No application logs on stdout: MCP stdio uses one JSON-RPC envelope per line.
const rl = readline.createInterface({ input: process.stdin, terminal: false, crlfDelay: Infinity });
rl.on('line', (line) => {
  try {
    const message = JSON.parse(line) as unknown;
    if (Array.isArray(message)) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Batch not supported' } }) + '\n');
      return;
    }
    const result = handleMathMcpRequest(message);
    if (result) process.stdout.write(JSON.stringify(result) + '\n');
  } catch {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
  }
});
