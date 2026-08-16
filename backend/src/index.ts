import express, { Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { videoRoutes } from './routes/video.routes.js'
import { authRoutes } from './routes/auth.routes.js'

dotenv.config()

const app: Express = express()
const PORT = process.env.BACKEND_PORT || 3001

// Middleware
const allowedOrigin = process.env.APP_URL || 'http://localhost:5173'
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ limit: '1mb', extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Math Video Generator API v0.1.0' })
})

// Authentication routes
app.use('/api/auth', authRoutes)

// Video generation routes
app.use('/api', videoRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`)
})
