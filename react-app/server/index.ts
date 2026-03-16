import express from 'express'
import cors from 'cors'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routers/index'
import { createContext } from './context'

const app = express()

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`)
})

export type AppRouter = typeof appRouter
