import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { getAuthCookieName, requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const router = Router();
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const publicUser = (user: { id: string; email: string; name: string; plan: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.plan,
});

const issueSession = (res: Response, userId: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está configurado');

  const token = jwt.sign({}, secret, {
    subject: userId,
    expiresIn: '7d',
  });

  res.cookie(getAuthCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
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

  try {
    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ code: 'EMAIL_EXISTS', error: 'El correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: passwordHash, name },
    });

    issueSession(res, user.id);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.error('[Auth] Register failed:', error);
    return res.status(500).json({ code: 'REGISTER_FAILED', error: 'No se pudo crear la cuenta' });
  }
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

  try {
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !valid) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', error: 'Correo o contraseña incorrectos' });
    }

    issueSession(res, user.id);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    return res.status(500).json({ code: 'LOGIN_FAILED', error: 'No se pudo iniciar sesión' });
  }
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie(getAuthCookieName(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return res.json({ success: true });
});

export const authRoutes = router;
