-- Prisma @updatedAt is client-side; database inserts also need a safe default.
ALTER TABLE public.users ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.videos ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.users ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.videos ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
