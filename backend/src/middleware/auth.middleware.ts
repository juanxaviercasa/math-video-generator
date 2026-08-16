import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const AUTH_COOKIE = 'mvg_session';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    plan: string;
  };
}

const getToken = (req: Request): string | undefined => {
  const cookieHeader = req.headers.cookie;
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`));

  if (cookie) return decodeURIComponent(cookie.slice(`${AUTH_COOKIE}=`.length));

  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return undefined;
};

export const getAuthCookieName = () => AUTH_COOKIE;

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ code: 'AUTH_CONFIG_ERROR', error: 'JWT_SECRET no está configurado' });
    return;
  }

  const token = getToken(req);
  if (!token) {
    res.status(401).json({ code: 'UNAUTHENTICATED', error: 'Debes iniciar sesión' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      res.status(401).json({ code: 'INVALID_SESSION', error: 'La sesión no es válida' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ code: 'INVALID_SESSION', error: 'La sesión no es válida' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    };
    next();
  } catch (error) {
    res.status(401).json({ code: 'INVALID_SESSION', error: 'La sesión no es válida' });
  }
}
