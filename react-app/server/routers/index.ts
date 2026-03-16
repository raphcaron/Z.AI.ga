import { router } from '../trpc'
import { sessionRouter } from './session'
import { categoryRouter } from './category'
import { themeRouter } from './theme'
import { userRouter } from './user'

export const appRouter = router({
  session: sessionRouter,
  category: categoryRouter,
  theme: themeRouter,
  user: userRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
