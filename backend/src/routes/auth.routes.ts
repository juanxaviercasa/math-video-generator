import { Router, type Request, type Response } from 'express';
import { supabaseAuth } from '../lib/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { syncSupabaseProfile } from '../services/profile.service.js';

const router = Router();
const ACCESS_COOKIE = 'mvg_access_token';
const REFRESH_COOKIE = 'mvg_refresh_token';
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge,
  path: '/',
});

const publicUser = (user: { id: string; email: string; name: string; plan: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.plan,
});


const issueSession = (res: Response, session: { access_token: string; refresh_token: string; expires_in?: number }) => {
  const accessMaxAge = Math.max(60, session.expires_in || 3600) * 1000;
  res.cookie(ACCESS_COOKIE, session.access_token, cookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, session.refresh_token, cookieOptions(REFRESH_MAX_AGE));
};

const clearSession = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, cookieOptions(0));
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0));
};

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: 'Los datos de registro no son válidos',
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, password, name } = parsed.data;
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    const duplicate = /already registered|already exists/i.test(error.message);
    return res.status(duplicate ? 409 : 400).json({
      code: duplicate ? 'EMAIL_EXISTS' : 'AUTH_SIGNUP_FAILED',
      error: duplicate ? 'El correo ya está registrado' : error.message,
    });
  }

  if (!data.user) return res.status(502).json({ code: 'AUTH_USER_MISSING', error: 'Supabase Auth no creó el usuario' });
  const user = await syncSupabaseProfile(data.user);

  if (!data.session) {
    return res.status(202).json({
      user: publicUser(user),
      requiresEmailConfirmation: true,
      message: 'Revisa tu correo para confirmar la cuenta antes de iniciar sesión.',
    });
  }

  issueSession(res, data.session);
  return res.status(201).json({ user: publicUser(user) });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: 'Los datos de inicio de sesión no son válidos',
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parsed.data;
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', error: 'Correo o contraseña incorrectos' });
  }

  const user = await syncSupabaseProfile(data.user);
  issueSession(res, data.session);
  return res.json({ user: publicUser(user) });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

const readCookie = (req: Request, name: string): string | undefined => {
  const header = req.headers.cookie || '';
  const part = header.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : undefined;
};

router.post('/logout', async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : readCookie(req, ACCESS_COOKIE);
  const refreshToken = readCookie(req, REFRESH_COOKIE);

  try {
    if (accessToken && refreshToken) {
      const session = await supabaseAuth.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (session.data.session) await supabaseAuth.auth.signOut();
    }
  } catch (error) {
    console.warn('[Auth] Supabase signout failed; clearing local session cookies anyway:', error);
  } finally {
    clearSession(res);
  }
  return res.json({ success: true });
});

export { ACCESS_COOKIE, REFRESH_COOKIE };
export const authRoutes = router;
