import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const columns = await prisma.$queryRaw<Array<Record<string, unknown>>>
`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position`;
const triggers = await prisma.$queryRaw<Array<Record<string, unknown>>>
`SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND tgname='on_auth_user_created'`;
const functionDef = await prisma.$queryRaw<Array<Record<string, unknown>>>
`SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure) AS definition`;
const authUsers = await prisma.$queryRaw<Array<Record<string, unknown>>>
`SELECT id, email FROM auth.users WHERE email LIKE 'mvg-auth-%@example.test' ORDER BY created_at DESC LIMIT 5`;

let reversibleInsert = 'passed';
try {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO public.users (id, email, name, password)
      VALUES ('00000000-0000-0000-0000-000000000001', 'rollback@example.test', 'Rollback', NULL)
    `;
    throw new Error('ROLLBACK_SENTINEL');
  });
} catch (error) {
  if (!(error instanceof Error) || error.message !== 'ROLLBACK_SENTINEL') reversibleInsert = error instanceof Error ? error.message : String(error);
}

console.log(JSON.stringify({ columns, triggers, functionDef, authUsers, reversibleInsert }, null, 2));
await prisma.$disconnect();
