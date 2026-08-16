import { z } from 'zod';

export const videoGenerationSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1, 'El identificador no puede estar vacío')
      .max(80, 'El identificador es demasiado largo')
      .regex(/^[a-zA-Z0-9_-]+$/, 'El identificador contiene caracteres no permitidos')
      .optional(),
    title: z
      .string()
      .trim()
      .min(1, 'El título es obligatorio')
      .max(120, 'El título no puede superar 120 caracteres'),
    content: z
      .string()
      .trim()
      .min(1, 'El contenido matemático es obligatorio')
      .max(10000, 'El contenido no puede superar 10000 caracteres'),
    quality: z.enum(['low', 'medium', 'high']).default('medium'),
    enableNarration: z.boolean().default(true),
    aiProvider: z.enum(['openrouter', 'gemini', 'openai']).default('openrouter'),
    enableComfyUI: z.boolean().default(false),
  })
  .strict();

export type VideoGenerationInput = z.infer<typeof videoGenerationSchema>;
