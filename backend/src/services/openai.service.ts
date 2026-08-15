import axios from 'axios';

type LlmProvider = 'openrouter' | 'gemini' | 'openai';

const getProviderPriority = (): LlmProvider[] => {
  const configured = (process.env.AI_PROVIDER || process.env.LLM_PROVIDER || 'openrouter').toLowerCase();
  const preferred = ['openrouter', 'gemini', 'openai'] as const;

  const ordered = preferred.filter((provider) => provider !== configured);
  return configured && preferred.includes(configured as any)
    ? ([configured as LlmProvider, ...ordered.filter((provider) => provider !== configured)] as LlmProvider[])
    : ['openrouter', 'gemini', 'openai'];
};

const getOpenRouterModel = (): string => process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
const getGeminiModel = (): string => process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const getOpenAiModel = (): string => process.env.OPENAI_MODEL || 'gpt-4o-mini';

const normalizeText = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const parseOpenAiLikeContent = (payload: any): string => {
  if (!payload) return '';

  const choices = payload?.choices || [];
  if (choices.length > 0) {
    const message = choices[0]?.message;
    if (message?.content) {
      return typeof message.content === 'string' ? message.content : message.content.join('');
    }
  }

  if (payload?.candidates?.length) {
    const parts = payload.candidates[0]?.content?.parts || [];
    return parts.map((part: any) => part.text || '').join('');
  }

  return '';
};

export const buildNarrationScript = (problem: string, steps: string[]): string[] => {
  const problemText = normalizeText(problem || 'Este tema matemático');
  const cleanedSteps = (steps || [])
    .map((step) => normalizeText(step))
    .filter(Boolean)
    .map((step) => step.replace(/^(Paso\s*\d+[:.-]?\s*|\d+[.)]\s*)/i, ''))
    .filter(Boolean);

  if (!cleanedSteps.length) {
    return [
      `Hoy vamos a resolver ${problemText}.`,
      'Observamos la estructura del problema y elegimos una estrategia clara.',
      'Seguimos cada paso con precisión para comprobar la respuesta final.',
    ];
  }

  return cleanedSteps.slice(0, 5).map((step, index) => {
    const sentence = step.endsWith('.') ? step : `${step}.`;

    if (index === 0) return `Primero, ${sentence}`;
    if (index === cleanedSteps.length - 1) return `Finalmente, ${sentence}`;
    return `Luego, ${sentence}`;
  });
};

const callLlm = async (systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> => {
  const priorities = getProviderPriority();

  for (const provider of priorities) {
    try {
      if (provider === 'openrouter') {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) continue;

        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: getOpenRouterModel(),
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: maxTokens,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
              'X-Title': 'Math Video Generator',
            },
          }
        );

        const text = parseOpenAiLikeContent(response.data);
        if (text) return normalizeText(text);
      }

      if (provider === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) continue;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent?key=${apiKey}`,
          {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: maxTokens,
            },
          }
        );

        const text = parseOpenAiLikeContent(response.data);
        if (text) return normalizeText(text);
      }

      if (provider === 'openai') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) continue;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: getOpenAiModel(),
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: maxTokens,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        const text = parseOpenAiLikeContent(response.data);
        if (text) return normalizeText(text);
      }
    } catch (error) {
      console.warn(`LLM provider failed: ${provider}`, error instanceof Error ? error.message : error);
    }
  }

  return '';
};

/**
 * OpenAI-compatible service for generating math video content.
 * Defaults to free/low-cost providers first: OpenRouter and Gemini.
 */
export const openai = {
  /**
   * Generar descripción mejorada para un video matemático
   */
  async enhanceDescription(mathContent: string, title: string): Promise<string> {
    try {
      const systemPrompt = `Eres un profesor de matemáticas experto. Crea una descripción clara y atractiva para un video educativo.
La descripción debe ser:
- Concisa (máx 100 palabras)
- Enfocada en el aprendizaje
- Incluir puntos clave a aprender`;

      const userPrompt = `Título: "${title}"\n\nContenido matemático:\n${mathContent}\n\nGenera una descripción atractiva para un video sobre este tema.`;

      const content = await callLlm(systemPrompt, userPrompt, 150);
      return content || 'Video educativo de matemáticas';
    } catch (error) {
      console.error('LLM generation error:', error);
      return 'Video educativo de matemáticas';
    }
  },

  /**
   * Generar pasos de solución usando IA
   */
  async generateSolutionSteps(problem: string): Promise<string[]> {
    try {
      const systemPrompt = `Eres un profesor de matemáticas. Genera pasos claros y concisos para resolver problemas.
Formato de respuesta: lista de pasos numerados, separados por "\n".`;

      const userPrompt = `Genera pasos para resolver este problema:\n${problem}`;
      const content = await callLlm(systemPrompt, userPrompt, 500);

      if (!content) return [];

      return content
        .split('\n')
        .map((step) => step.trim())
        .filter(Boolean);
    } catch (error) {
      console.error('LLM generation error:', error);
      return [];
    }
  },

  /**
   * Genera una narración didáctica para hablar paso a paso como un profesor experto.
   */
  async generateNarrationScript(problem: string, steps: string[]): Promise<string[]> {
    try {
      const systemPrompt = `Eres un profesor de matemáticas excelente, pedagógico y didáctico. Tus explicaciones son claras, naturales y enfocadas en enseñar.
Responde en español y crea una narración breve para video educativo, con 3 a 5 frases. Cada frase debe sonar como una explicación oral del paso que se muestra en pantalla.`;

      const userPrompt = `Problema a resolver:\n${problem}\n\nPasos sugeridos:\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nGenera una narración breve y didáctica en español para voz en off.`;
      const content = await callLlm(systemPrompt, userPrompt, 400);

      if (!content) return buildNarrationScript(problem, steps);

      const narration = content
        .split(/\n+/)
        .map((line) => normalizeText(line).replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, ''))
        .filter(Boolean)
        .slice(0, 5);

      return narration.length ? narration : buildNarrationScript(problem, steps);
    } catch (error) {
      console.error('Narration generation error:', error);
      return buildNarrationScript(problem, steps);
    }
  },
};
