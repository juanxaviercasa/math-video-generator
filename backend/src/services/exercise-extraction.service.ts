import axios from 'axios';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { validateMathProblem } from './math-validation.service.js';

const execFileAsync = promisify(execFile);
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGE = 50;

export type ExerciseSourceType = 'image/png' | 'image/jpeg' | 'image/webp' | 'application/pdf';
export type ExerciseExtraction = {
  problem: string;
  sourceType: ExerciseSourceType;
  observedSolutionSteps: string[];
  confidence: 'high' | 'medium' | 'low';
  requiresConfirmation: true;
  warnings: string[];
  validation: ReturnType<typeof validateMathProblem>;
};

export class ExerciseExtractionError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 422) {
    super(message);
    this.name = 'ExerciseExtractionError';
  }
}

export function verifyExerciseSource(data: Buffer, mediaType: string): ExerciseSourceType {
  const allowed: ExerciseSourceType[] = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
  const type = mediaType.split(';')[0].trim().toLowerCase() as ExerciseSourceType;
  if (!allowed.includes(type) || !Buffer.isBuffer(data) || data.length === 0 || data.length > MAX_SOURCE_BYTES) {
    throw new ExerciseExtractionError('EXERCISE_SOURCE_INVALID', 'Adjunta un PNG, JPG, WEBP o PDF de hasta 10 MB.', 400);
  }
  const signatures: Record<ExerciseSourceType, boolean> = {
    'image/png': data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/jpeg': data[0] === 255 && data[1] === 216 && data[2] === 255,
    'image/webp': data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP',
    'application/pdf': data.toString('ascii', 0, 5) === '%PDF-',
  };
  if (!signatures[type]) {
    throw new ExerciseExtractionError('EXERCISE_SOURCE_MISMATCH', 'El contenido no corresponde al tipo de archivo indicado.', 400);
  }
  return type;
}

export function validatePdfPage(value: unknown): number {
  const page = Number(value ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PDF_PAGE) {
    throw new ExerciseExtractionError('EXERCISE_PDF_PAGE_INVALID', 'Selecciona una página de PDF entre 1 y 50.', 400);
  }
  return page;
}

/** Never send a raw PDF to a vision endpoint: render only the selected page. */
export async function prepareExerciseImage(data: Buffer, sourceType: ExerciseSourceType, page: number): Promise<{ data: Buffer; type: Exclude<ExerciseSourceType, 'application/pdf'> }> {
  if (sourceType !== 'application/pdf') return { data, type: sourceType };
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mvg-exercise-'));
  try {
    const pdf = path.join(dir, 'source.pdf');
    const imagePrefix = path.join(dir, 'selected-page');
    await fs.writeFile(pdf, data, { mode: 0o600 });
    try {
      await execFileAsync(process.env.PDFTOPPM_PATH || 'pdftoppm', [
        '-f', String(page), '-l', String(page), '-singlefile', '-scale-to', '1600', '-png',
        pdf, imagePrefix,
      ], { timeout: 30000, maxBuffer: 1024 * 1024 });
    } catch {
      throw new ExerciseExtractionError('EXERCISE_PDF_RENDER_FAILED', 'No se pudo abrir esa página. Verifica el PDF y la instalación de poppler-utils.');
    }
    const image = await fs.readFile(imagePrefix + '.png').catch(() => null);
    if (!image || !image.length) {
      throw new ExerciseExtractionError('EXERCISE_PDF_PAGE_EMPTY', 'La página seleccionada no produjo una imagen válida.');
    }
    return { data: image, type: 'image/png' };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

const extractionPrompt = `Eres un transcriptor especializado en imágenes de ejercicios matemáticos, impresos o manuscritos.
NO resuelvas, NO completes pasos faltantes y NO inventes coeficientes ni signos.
Transcribe UN SOLO ejercicio principal. Si está resuelto, separa la ecuación original de los pasos visibles.
Si no se distingue un signo o número, devuelve problem vacío y confianza low.
Usa formato x^2 - 5x + 6 = 0 para cuadráticas cuando corresponda.
Devuelve SOLO JSON: {"problem":"...", "observedSolutionSteps":["..."], "confidence":"high|medium|low", "warnings":["..."]}.
Los pasos observados son TRANSCRIPCIONES, no resultados matemáticos verificados.`;

export function parseExerciseVisionResult(raw: string, sourceType: ExerciseSourceType): ExerciseExtraction {
  const cleaned = raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/, '');
  let decoded: unknown;
  try {
    decoded = JSON.parse(cleaned);
  } catch {
    throw new ExerciseExtractionError('EXERCISE_VISION_FORMAT', 'La lectura visual no entregó una transcripción estructurada.');
  }
  if (!decoded || typeof decoded !== 'object') {
    throw new ExerciseExtractionError('EXERCISE_VISION_FORMAT', 'El resultado del reconocimiento no es válido.');
  }
  const parsed = decoded as Record<string, unknown>;
  const problem = typeof parsed.problem === 'string' ? parsed.problem.trim() : '';
  const steps = Array.isArray(parsed.observedSolutionSteps)
    ? parsed.observedSolutionSteps.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 15)
    : [];
  const confidence = parsed.confidence === 'high' || parsed.confidence === 'medium' ? parsed.confidence : 'low';
  if (!problem || problem.length > 10000 || confidence === 'low') {
    throw new ExerciseExtractionError('EXERCISE_REVIEW_REQUIRED', 'No se ha podido leer el ejercicio con suficiente claridad. Recorta la imagen o escribe el enunciado.');
  }
  const warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings.filter((item): item is string => typeof item === 'string').slice(0, 8)
    : [];
  const validation = validateMathProblem(problem);
  if (!validation.supported || !validation.valid) {
    warnings.push('El enunciado fue transcrito, pero aún no existe un solver determinista verificado para esta forma de ejercicio.');
  }
  warnings.push('Revisa y confirma la transcripción antes de generar el video. Los pasos de la imagen no sustituyen la validación matemática.');
  return { problem, sourceType, observedSolutionSteps: steps, confidence, requiresConfirmation: true, warnings, validation };
}

function extractTextFromResponse(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => {
    if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') return item.text;
    return '';
  }).join('');
  return '';
}

export async function extractExerciseFromSource(data: Buffer, mediaType: string, rawPage?: unknown, preferredProvider: 'gemini' | 'openai' | 'openrouter' | 'auto' = 'auto'): Promise<ExerciseExtraction> {
  const sourceType = verifyExerciseSource(data, mediaType);
  const page = validatePdfPage(rawPage);
  const image = await prepareExerciseImage(data, sourceType, page);
  const base64 = image.data.toString('base64');
  let responseText = '';

  // Credentials remain server-side. An absent vision provider is not a successful OCR.
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const provider = preferredProvider === 'auto'
    ? geminiKey ? 'gemini' : openAiKey ? 'openai' : 'openrouter'
    : preferredProvider;
  if ((provider === 'gemini' && !geminiKey)
      || (provider === 'openai' && !openAiKey)
      || (provider === 'openrouter' && (!openRouterKey || !process.env.OPENROUTER_VISION_MODEL))) {
    throw new ExerciseExtractionError('EXERCISE_VISION_NOT_CONFIGURED',
      `Configura las credenciales y un modelo multimodal de ${provider} para analizar imágenes.`, 503);
  }
  try {
    if (provider === 'gemini') {
      const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        { contents: [{ parts: [{ text: extractionPrompt }, { inline_data: { mime_type: image.type, data: base64 } }] }], generationConfig: { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 1200 } },
        { headers: { 'x-goog-api-key': geminiKey }, timeout: 45000 },
      );
      responseText = response.data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') || '';
    } else if (provider === 'openai' || provider === 'openrouter') {
      const useOpenAi = provider === 'openai';
      const endpoint = useOpenAi ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
      const model = useOpenAi ? (process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini') : process.env.OPENROUTER_VISION_MODEL;
      const response = await axios.post(endpoint, {
        model, temperature: 0, max_tokens: 1200,
        messages: [{ role: 'user', content: [
          { type: 'text', text: extractionPrompt },
          { type: 'image_url', image_url: { url: `data:${image.type};base64,${base64}` } },
        ] }],
      }, { headers: { Authorization: `Bearer ${useOpenAi ? openAiKey : openRouterKey}` }, timeout: 45000 });
      responseText = extractTextFromResponse(response.data?.choices?.[0]?.message?.content);
    } else {
      throw new ExerciseExtractionError('EXERCISE_VISION_NOT_CONFIGURED', 'Configura GEMINI_API_KEY u OPENAI_API_KEY para reconocer imágenes; OpenRouter requiere OPENROUTER_VISION_MODEL.', 503);
    }
  } catch (error) {
    if (error instanceof ExerciseExtractionError) throw error;
    throw new ExerciseExtractionError('EXERCISE_VISION_UNAVAILABLE', 'No fue posible leer la imagen con el proveedor visual configurado.', 502);
  }
  return parseExerciseVisionResult(responseText, sourceType);
}
