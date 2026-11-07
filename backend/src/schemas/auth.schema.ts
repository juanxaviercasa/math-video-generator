import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('El correo no es válido').max(320),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
    name: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('El correo no es válido').max(320),
    password: z.string().min(1, 'La contraseña es obligatoria').max(128),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
