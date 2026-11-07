-- Mirrors the private server-only Prisma model.
-- Applied in Supabase project jplhbgyhswvbghhzhjvm as migration 20261107185018.
-- RLS is intentionally enabled with no policies: only the server's privileged
-- PostgreSQL connection may access these tables; direct Data API roles cannot.
CREATE TABLE public.users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password text,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.videos (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  progress integer NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT 'Video en cola...',
  "errorCode" text,
  "lastError" text,
  attempts integer NOT NULL DEFAULT 0,
  "heartbeatAt" timestamp(3),
  "workerId" text,
  "idempotencyKey" text UNIQUE,
  "outputDir" text,
  "requestJson" text,
  "startedAt" timestamp(3),
  "completedAt" timestamp(3),
  "videoUrl" text,
  "thumbnailUrl" text,
  duration integer,
  "fileSize" integer,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX videos_user_created_idx ON public.videos ("userId", "createdAt" DESC);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users, public.videos FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.users IS 'Owner profile; server-only via Prisma, not exposed to Supabase Data API.';
COMMENT ON TABLE public.videos IS 'Owner video jobs; server-only via Prisma, not exposed to Supabase Data API.';
