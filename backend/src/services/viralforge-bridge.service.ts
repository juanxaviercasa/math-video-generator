import axios from 'axios';

export interface MathAiModel {
  slug: string;
  title: string;
  role: string;
  pack?: string;
  sizeGb?: number;
}

export interface AiInfrastructureStatus {
  configured: boolean;
  reachable: boolean;
  inferenceReady: boolean;
  source: 'viralforge';
  models: MathAiModel[];
  message: string;
}

const allowedRoles = new Set([
  'openjutsu_vision', 'llm', 'llm_reasoning', 'tts_clone',
  'tts_fast', 'word_aligner', 'asr', 'openjutsu_video',
]);

export function sanitizeViralForgeCatalog(raw: unknown): MathAiModel[] {
  if (!raw || typeof raw !== 'object') return [];
  const payload = raw as { datasets?: unknown };
  if (!Array.isArray(payload.datasets)) return [];
  return payload.datasets.flatMap((entry): MathAiModel[] => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.slug !== 'string'
      || !/^juanxaviercasa\/[a-z0-9._-]+$/i.test(candidate.slug)
      || typeof candidate.title !== 'string'
      || typeof candidate.role !== 'string'
      || !allowedRoles.has(candidate.role)) return [];
    return [{
      slug: candidate.slug,
      title: candidate.title.slice(0, 110),
      role: candidate.role,
      ...(typeof candidate.pack === 'string' ? { pack: candidate.pack.slice(0, 30) } : {}),
      ...(typeof candidate.size_gb === 'number' && Number.isFinite(candidate.size_gb) ? { sizeGb: candidate.size_gb } : {}),
    }];
  });
}

/** Read-only integration: never leaks Kaggle account tokens or launches notebooks. */
export async function inspectViralForge(): Promise<AiInfrastructureStatus> {
  const base = process.env.VIRALFORGE_INTERNAL_URL?.trim();
  const empty = (message: string, configured: boolean): AiInfrastructureStatus => ({
    configured, reachable: false, inferenceReady: false, source: 'viralforge', models: [], message,
  });
  if (!base) return empty('El puente privado con ViralForge no está configurado.', false);
  let url: URL;
  try {
    url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol)
      || url.username || url.password || url.search || url.hash
      || (url.protocol === 'http:' && !['host.docker.internal', '127.0.0.1', 'localhost'].includes(url.hostname))) {
      return empty('VIRALFORGE_INTERNAL_URL requiere HTTPS o HTTP de loopback interno.', true);
    }
  } catch {
    return empty('URL interna de ViralForge no válida.', true);
  }

  try {
    const target = new URL('/api/kaggle/catalog', url).toString();
    const response = await axios.get(target, {
      timeout: 5000,
      maxContentLength: 512 * 1024,
      maxRedirects: 0,
      headers: process.env.VIRALFORGE_INTERNAL_TOKEN
        ? { 'X-Bridge-Token': process.env.VIRALFORGE_INTERNAL_TOKEN }
        : {},
    });
    const models = sanitizeViralForgeCatalog(response.data);
    return {
      configured: true,
      reachable: true,
      // A dataset listing proves neither model loading nor an available GPU.
      inferenceReady: false,
      source: 'viralforge',
      models,
      message: 'Catálogo de modelos localizado; una sesión Kaggle GPU activa debe verificarse por separado antes de inferir.',
    };
  } catch {
    return empty('ViralForge no responde o el puente privado rechaza la conexión.', true);
  }
}
