import { Router, type Request, type Response, type NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { handleMathMcpRequest } from './protocol.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false }));

const authorized = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.MCP_BEARER_TOKEN;
  if (!expected || expected.length < 32) {
    return res.status(404).json({ error: 'MCP remote server is disabled' });
  }
  const provided = req.header('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: 'Unauthorized MCP client' });
  }
  return next();
};

router.use(authorized);
router.post('/', (req: Request, res: Response) => {
  const reply = handleMathMcpRequest(req.body);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('MCP-Protocol-Version', req.header('mcp-protocol-version') || '2025-06-18');
  if (!reply) return res.status(202).end();
  return res.status(200).type('application/json').json(reply);
});
router.get('/', (_req, res) => res.status(405).setHeader('Allow', 'POST').end());
router.delete('/', (_req, res) => res.status(405).setHeader('Allow', 'POST').end());

export const mcpHttpRouter = router;
