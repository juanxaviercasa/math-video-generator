import { validateMathProblem } from '../services/math-validation.service.js';
import { buildQuadraticStoryboard } from '../services/pedagogy.service.js';
import { SPANISH_VOICES } from '../services/voice-catalog.service.js';
import {
  auditWebpageMathOpportunities,
  generateWidgetEmbedCode,
  listMathEnginesCatalog,
  recommendEngineForTopic,
} from '../services/site-math-auditor.service.js';

type JsonRpcId = string | number | null;
interface RpcRequest { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: unknown }
interface RpcResponse { jsonrpc: '2.0'; id: JsonRpcId; result?: unknown; error?: { code: number; message: string } }

const problemArgs = {
  type: 'object',
  properties: { problem: { type: 'string', description: 'Ecuación en texto, por ejemplo x^2 - 5x + 6 = 0', maxLength: 10000 } },
  required: ['problem'], additionalProperties: false,
};

const catalogArgs = {
  type: 'object',
  properties: {
    categoryId: {
      type: 'string',
      description: 'Opcional: ID de macro-categoría (video_anim, cas_algebra, graph_2d, space_3d, geometry, manipulatives, latex_input, stats_num, graphs_networks, ai_ocr, formal_logic, fractals_chaos)',
      maxLength: 60,
    },
  },
  additionalProperties: false,
};

const recommendArgs = {
  type: 'object',
  properties: {
    topic: { type: 'string', description: 'Tema o descripción de la lección del sitio web', maxLength: 2000 },
    sampleEquations: {
      type: 'array',
      items: { type: 'string', maxLength: 300 },
      description: 'Ecuaciones o fórmulas detectadas en esa sección',
    },
    baseEmbedUrl: { type: 'string', description: 'URL base para el widget embebible', maxLength: 300 },
  },
  required: ['topic'],
  additionalProperties: false,
};

const auditWebpageArgs = {
  type: 'object',
  properties: {
    url: { type: 'string', description: 'URL de la página web auditada', maxLength: 500 },
    htmlOrMarkdown: { type: 'string', description: 'Contenido HTML, Markdown o temario de la página', maxLength: 50000 },
    baseEmbedUrl: { type: 'string', description: 'URL base donde corre Math Video Generator', maxLength: 300 },
  },
  required: ['htmlOrMarkdown'],
  additionalProperties: false,
};

const embedWidgetArgs = {
  type: 'object',
  properties: {
    toolId: { type: 'string', description: 'ID del motor entre los 60 disponibles (ej. mafs-react, mathsteps, cindyjs)', maxLength: 80 },
    expression: { type: 'string', description: 'Ecuación inicial para el widget (ej. x^2 - 5x + 6 = 0)', maxLength: 300 },
    baseEmbedUrl: { type: 'string', description: 'URL base de la aplicación', maxLength: 300 },
    height: { type: 'number', description: 'Altura en píxeles del iframe (320 a 1200)' },
  },
  required: ['toolId'],
  additionalProperties: false,
};

export const mathMcpTools = [
  { name: 'validate_math', description: 'Valida determinísticamente un ejercicio y devuelve la solución verificada si existe; nunca inventa pasos no comprobados.', inputSchema: problemArgs },
  { name: 'preview_quadratic_storyboard', description: 'Obtiene las escenas y narraciones de una cuadrática validada, sin generar ni publicar videos.', inputSchema: problemArgs },
  { name: 'list_neural_voices', description: 'Lista las voces neuronales en español compatibles con el motor de video.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'pipeline_capabilities', description: 'Describe el pipeline de imagen, PDF, narración, puente Kaggle y los 60 motores matemáticos deterministas.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'list_math_engines_catalog', description: 'Lista los 60 motores matemáticos open-source organizados en las 12 macro-categorías para inyección web.', inputSchema: catalogArgs },
  { name: 'recommend_engine_for_topic', description: 'Analiza un tema matemático y ecuaciones de una página web y recomienda cuál de los 60 motores deterministas incrustar.', inputSchema: recommendArgs },
  { name: 'audit_webpage_math_opportunities', description: 'Rastrea el HTML o Markdown de una página web de matemáticas, detecta qué herramientas interactivas faltan por sección y devuelve los códigos embed de los 60 motores.', inputSchema: auditWebpageArgs },
  { name: 'generate_widget_embed_code', description: 'Genera la URL embebible (?embed=1) y el código HTML <iframe> / React para insertar cualquiera de los 60 motores en un sitio web.', inputSchema: embedWidgetArgs },
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
    inputs: ['text', 'image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'html/markdown'],
    supportedSolver: 'quadratic',
    deterministicEnginesCount: 60,
    macroCategoriesCount: 12,
    kaggleBridgeRoles: ['openjutsu_vision', 'llm_reasoning', 'word_aligner', 'tts_clone'],
    narrative: 'edge-tts Spanish neural voices with measured cue synchronization',
    note: 'MCP tools are read-only. Private video generation requires the app authenticated job API.',
  });

  if (name === 'list_math_engines_catalog') {
    const categoryId = typeof input.categoryId === 'string' ? input.categoryId.trim() : undefined;
    return content(listMathEnginesCatalog(categoryId));
  }

  if (name === 'recommend_engine_for_topic') {
    if (typeof input.topic !== 'string' || !input.topic.trim() || input.topic.length > 2000) {
      throw new Error('Se requiere un tema no vacío de hasta 2000 caracteres.');
    }
    const sampleEquations = Array.isArray(input.sampleEquations)
      ? input.sampleEquations.filter((item): item is string => typeof item === 'string' && item.length <= 300)
      : undefined;
    const baseEmbedUrl = typeof input.baseEmbedUrl === 'string' ? input.baseEmbedUrl : undefined;
    return content(recommendEngineForTopic({ topic: input.topic, sampleEquations, baseEmbedUrl }));
  }

  if (name === 'audit_webpage_math_opportunities') {
    if (typeof input.htmlOrMarkdown !== 'string' || !input.htmlOrMarkdown.trim() || input.htmlOrMarkdown.length > 50000) {
      throw new Error('Se requiere contenido htmlOrMarkdown no vacío de hasta 50000 caracteres.');
    }
    const url = typeof input.url === 'string' ? input.url : undefined;
    const baseEmbedUrl = typeof input.baseEmbedUrl === 'string' ? input.baseEmbedUrl : undefined;
    return content(auditWebpageMathOpportunities({ url, htmlOrMarkdown: input.htmlOrMarkdown, baseEmbedUrl }));
  }

  if (name === 'generate_widget_embed_code') {
    if (typeof input.toolId !== 'string' || !input.toolId.trim() || input.toolId.length > 80) {
      throw new Error('Se requiere un toolId válido.');
    }
    const expression = typeof input.expression === 'string' ? input.expression : undefined;
    const baseEmbedUrl = typeof input.baseEmbedUrl === 'string' ? input.baseEmbedUrl : undefined;
    const height = typeof input.height === 'number' ? input.height : undefined;
    return content(generateWidgetEmbedCode({ toolId: input.toolId, expression, baseEmbedUrl, height }));
  }

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
      return ok(id, { protocolVersion: version, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'math-video-generator', version: '0.3.0' }, instructions: 'Only verified mathematical results and deterministic open-source engine widgets (#01-#60) are returned. Video generation is never exposed to external agents without user authentication.' });
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
