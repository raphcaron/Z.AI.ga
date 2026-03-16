import { betterAuth } from "better-auth"
import { Pool } from "better-auth/adapters/drizzle"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { supabase } from './db'
import type { User, Session } from 'better-auth/types'

// Better Auth configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
    enabled: true,
  },
})

export type Auth = typeof auth
