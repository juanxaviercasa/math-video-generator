-- Supabase Auth owns credentials; the public profile stores only application metadata.
ALTER TABLE public.users ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

DROP POLICY IF EXISTS videos_select_own ON public.videos;
CREATE POLICY videos_select_own ON public.videos
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS videos_insert_own ON public.videos;
CREATE POLICY videos_insert_own ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS videos_update_own ON public.videos;
CREATE POLICY videos_update_own ON public.videos
  FOR UPDATE TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS videos_delete_own ON public.videos;
CREATE POLICY videos_delete_own ON public.videos
  FOR DELETE TO authenticated
  USING ("userId" = auth.uid()::text);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.videos TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, password)
  VALUES (
    NEW.id::text,
    lower(NEW.email),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name,
        "updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
