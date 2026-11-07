import { validateMathProblem } from '../services/math-validation.service.js';
import { buildQuadraticStoryboard } from '../services/pedagogy.service.js';
import { SPANISH_VOICES } from '../services/voice-catalog.service.js';

type JsonRpcId = string | number | null;
interface RpcRequest { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: unknown }
interface RpcResponse { jsonrpc: '2.0'; id: JsonRpcId; result?: unknown; error?: { code: number; message: string } }

const problemArgs = {
  type: 'object',
  properties: { problem: { type: 'string', description: 'Ecuación en texto, por ejemplo x^2 - 5x + 6 = 0', maxLength: 10000 } },
  required: ['problem'], additionalProperties: false,
};

export const mathMcpTools = [
  { name: 'validate_math', description: 'Valida determinísticamente un ejercicio y devuelve la solución verificada si existe; nunca inventa pasos no comprobados.', inputSchema: problemArgs },
  { name: 'preview_quadratic_storyboard', description: 'Obtiene las escenas y narraciones de una cuadrática validada, sin generar ni publicar videos.', inputSchema: problemArgs },
  { name: 'list_neural_voices', description: 'Lista las voces neuronales en español compatibles con el motor de video.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'pipeline_capabilities', description: 'Describe el pipeline de imagen, PDF, narración y límites matemáticos actuales.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
] as const;

const ok = (id: JsonRpcId, result: unknown): RpcResponse => ({ jsonrpc: '2.0', id, result });
const fail = (id: JsonRpcId, code: number, message: string): RpcResponse => ({ jsonrpc: '2.0', id, error: { code, message } });
const content = (value: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const errorContent = (message: string) => ({ isError: true, content: [{ type: 'text', text: message }] });

function runTool(name: string, args: unknown): unknown {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Se esperan argumentos JSON.');
  const input = args as Record<string, unknown>;
  if (name === 'list_neural_voices') return content({ voices: SPANISH_VOICES });
  if (name === 'pipeline_capabilities') return content({
    inputs: ['text', 'image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
    supportedSolver: 'quadratic',
    narrative: 'edge-tts Spanish neural voices with measured cue synchronization',
    note: 'MCP tools are read-only. Private video generation requires the app authenticated job API.',
  });
  if (name !== 'validate_math' && name !== 'preview_quadratic_storyboard') throw new Error('Herramienta MCP desconocida.');
  if (typeof input.problem !== 'string' || !input.problem.trim() || input.problem.length > 10000) {
    throw new Error('Se requiere una ecuación no vacía de hasta 10000 caracteres.');
  }
  const validation = validateMathProblem(input.problem);
  if (name === 'validate_math') return content(validation);
  if (!validation.supported || !validation.valid || validation.kind !== 'quadratic') {
    return errorContent('No se dispone de un solver determinista verificado para este ejercicio.');
  }
  const scenes = buildQuadraticStoryboard(input.problem, validation);
  return content({ validation, scenes: scenes.map(({ id, narrationText, visualLatex, visualStages, layout, graphSpec }) =>
    ({ id, narrationText, visualLatex, visualStages, layout, graphSpec })) });
}

export function handleMathMcpRequest(raw: unknown): RpcResponse | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail(null, -32600, 'Invalid Request');
  const req = raw as RpcRequest;
  if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') return fail(req.id ?? null, -32600, 'Invalid Request');
  if (req.id === undefined) return null; // MCP notifications never receive a JSON-RPC response.
  const id = req.id;
  switch (req.method) {
    case 'initialize': {
      const params = req.params && typeof req.params === 'object' && !Array.isArray(req.params) ? req.params as { protocolVersion?: string } : {};
      const version = params.protocolVersion && ['2024-11-05', '2025-03-26', '2025-06-18', '2025-11-25'].includes(params.protocolVersion)
        ? params.protocolVersion : '2025-06-18';
      return ok(id, { protocolVersion: version, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'math-video-generator', version: '0.2.0' }, instructions: 'Only verified mathematical results are returned. Video generation is never exposed to external agents without user authentication.' });
    }
    case 'ping': return ok(id, {});
    case 'tools/list': return ok(id, { tools: mathMcpTools });
    case 'tools/call': {
      const params = req.params;
      if (!params || typeof params !== 'object' || Array.isArray(params) || typeof (params as { name?: unknown }).name !== 'string') {
        return fail(id, -32602, 'Invalid tools/call parameters');
      }
      const { name, arguments: args } = params as { name: string; arguments?: unknown };
      if (!mathMcpTools.some((tool) => tool.name === name)) return fail(id, -32602, 'Tool not found');
      try { return ok(id, runTool(name, args || {})); }
      catch (e) { return ok(id, errorContent(e instanceof Error ? e.message : 'Tool failed')); }
    }
    default: return fail(id, -32601, 'Method not found');
  }
}
