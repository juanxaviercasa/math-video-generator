import { prisma } from '../lib/prisma.js';

export async function syncSupabaseProfile(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) throw new Error('Supabase Auth no devolvió un correo electrónico');

  const metadataName = typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name.trim() : '';
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });

  if (existing) {
    return prisma.user.update({
      where: { id: authUser.id },
      data: { email, ...(metadataName ? { name: metadataName } : {}) },
    });
  }

  return prisma.user.create({
    data: {
      id: authUser.id,
      email,
      name: metadataName || email.split('@')[0],
      password: null,
    },
  });
}
