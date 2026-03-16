import { router } from '../trpc'
import { sessionRouter } from './session'
import { categoryRouter } from './category'
import { themeRouter } from './theme'
import { userRouter } from './user'
import { uploadRouter } from './upload'
import { authRouter } from './auth'

export const appRouter = router({
  session: sessionRouter,
  category: categoryRouter,
  theme: themeRouter,
  user: userRouter,
  upload: uploadRouter,
  auth: authRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
