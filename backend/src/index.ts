import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { randomUUID } from 'node:crypto'
import { videoRoutes } from './routes/video.routes.js'
import { authRoutes } from './routes/auth.routes.js'
import { mediaRoutes } from './routes/media.routes.js'
import { prisma } from './lib/prisma.js'
import { videoQueue } from './services/job.service.js'

dotenv.config()

const app: Express = express()
const PORT = process.env.BACKEND_PORT || 3001

app.use((req, res, next) => {
  const requestId = req.header('x-request-id') || randomUUID()
  res.setHeader('x-request-id', requestId)
  res.locals.requestId = requestId
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'AUTH_RATE_LIMITED', error: 'Demasiados intentos. Espera unos minutos.' },
})

const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'GENERATION_RATE_LIMITED', error: 'Has alcanzado el límite temporal de generación.' },
})

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

const allowedOrigin = process.env.APP_URL || 'http://localhost:5173'
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ limit: '1mb', extended: true }))

const csrfOriginGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  const origin = req.header('origin')
  if (mutating && origin && origin !== allowedOrigin) {
    return res.status(403).json({ code: 'CSRF_ORIGIN_REJECTED', error: 'Origen no autorizado' })
  }
  return next()
}
app.use(csrfOriginGuard)

// Health checks: liveness is cheap; readiness verifies dependencies.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/readyz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    await videoQueue.instance.client.ping()
    return res.json({ status: 'ready', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('[Readiness] Dependency check failed:', { requestId: res.locals.requestId, error })
    return res.status(503).json({ status: 'not_ready', error: 'Dependencias no disponibles' })
  }
})

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Math Video Generator API v0.1.0' })
})

// Generated media is private and authorization-scoped by video ownership.
app.use('/api/media', mediaRoutes)

// Authentication routes
app.use('/api/auth', authLimiter, authRoutes)

// Video generation routes. Only creation is rate-limited; polling remains available.
app.use('/api/generate-video', (req, res, next) => {
  if (req.method === 'POST') return generationLimiter(req, res, next)
  next()
})
app.use('/api', videoRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[HTTP Error]', { requestId: res.locals.requestId, method: req.method, path: req.path, error: err?.stack || err })
  res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', error: 'Internal Server Error', requestId: res.locals.requestId })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`)
})

const shutdown = async (signal: string) => {
  console.log(`[Shutdown] Received ${signal}; draining HTTP, Redis and Prisma.`)
  server.close(async () => {
    try {
      await videoQueue.instance.close()
      await prisma.$disconnect()
      process.exit(0)
    } catch (error) {
      console.error('[Shutdown] Failed:', error)
      process.exit(1)
    }
  })
}

process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))
