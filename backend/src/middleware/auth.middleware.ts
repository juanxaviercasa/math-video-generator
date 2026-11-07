import type { NextFunction, Request, Response } from 'express';
import { supabaseAuth } from '../lib/supabase.js';
import { syncSupabaseProfile } from '../services/profile.service.js';

const ACCESS_COOKIE = 'mvg_access_token';
const REFRESH_COOKIE = 'mvg_refresh_token';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    plan: string;
  };
}

const getCookie = (req: Request, name: string): string | undefined => {
  const cookieHeader = req.headers.cookie;
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(`${name}=`.length)) : undefined;
};

const getAccessToken = (req: Request) => {
  const authorization = req.headers.authorization;
  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : getCookie(req, ACCESS_COOKIE);
};

const setRefreshedSession = (res: Response, session: { access_token: string; refresh_token: string; expires_in?: number }) => {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: Math.max(60, session.expires_in || 3600) * 1000,
    path: '/',
  });
  res.cookie(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const resolveUser = async (req: Request, res: Response) => {
  let accessToken = getAccessToken(req);
  const refreshToken = getCookie(req, REFRESH_COOKIE);

  if (!accessToken && !refreshToken) return undefined;

  let authUser;
  if (accessToken) {
    const result = await supabaseAuth.auth.getUser(accessToken);
    authUser = result.data.user;
  }

  if (!authUser && refreshToken) {
    const refreshed = await supabaseAuth.auth.setSession({
      access_token: accessToken || '',
      refresh_token: refreshToken,
    });
    if (refreshed.error || !refreshed.data.user || !refreshed.data.session) return undefined;
    setRefreshedSession(res, refreshed.data.session);
    authUser = refreshed.data.user;
    accessToken = refreshed.data.session.access_token;
  }

  if (!authUser) return undefined;
  const user = await syncSupabaseProfile(authUser);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
  };
};

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    req.user = await resolveUser(req, res);
  } catch {
    req.user = undefined;
  }
  next();
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await resolveUser(req, res);
    if (!user) {
      res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Supabase token validation failed:', error);
    res.status(401).json({ code: 'INVALID_SESSION', error: 'La sesión no es válida' });
  }
}
