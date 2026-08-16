import { createRequire } from 'node:module';

let client: any;
const require = createRequire(import.meta.url);

const getClient = () => {
  if (client) return client;

  try {
    const prismaPackage = require('@prisma/client');
    const PrismaClient = prismaPackage.PrismaClient;
    if (!PrismaClient) throw new Error('PrismaClient no está generado');

    client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    return client;
  } catch (error) {
    throw new Error(
      `Prisma no está disponible. Ejecuta prisma generate y configura DATABASE_URL. Detalle: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

export const prisma = {
  get user() {
    return getClient().user;
  },
  get video() {
    return getClient().video;
  },
  async $disconnect() {
    if (client) await client.$disconnect();
  },
};
