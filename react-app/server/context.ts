import type { Request, Response } from 'express'

export interface Context {
  req: Request
  res: Response
  userId?: string
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  // Get user from session/token (will be implemented with Better Auth)
  const userId = req.headers.authorization?.replace('Bearer ', '')

  return {
    req,
    res,
    userId,
  }
}
