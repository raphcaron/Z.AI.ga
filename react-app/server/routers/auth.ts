import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { supabase } from '../db'

export const authRouter = router({
  // Sign up with email
  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
          },
        },
      })

      if (error) {
        throw new Error(error.message || 'Failed to sign up')
      }

      return { success: true, user: data.user }
    }),

  // Sign in with email
  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      })

      if (error) {
        throw new Error(error.message || 'Invalid credentials')
      }

      return { success: true, session: data.session }
    }),

  // Sign out
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new Error('Failed to sign out')
      }

      return { success: true }
    }),

  // Get current session
  getSession: publicProcedure.query(async () => {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
        return { session: null, user: null }
      }

    return { session, user: session?.user }
    }),

  // OAuth sign in with Google
  signInWithGoogle: publicProcedure.mutation(async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (error) {
        throw new Error(error.message || 'OAuth failed')
      }

      return { url: data.url }
    }),

  // OAuth sign in with GitHub
  signInWithGithub: publicProcedure.mutation(async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      })

      if (error) {
        throw new Error(error.message || 'OAuth failed')
      }

      return { url: data.url }
    }),

  // Get user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', ctx.userId)
      .single()

    if (error) {
      throw new Error('Profile not found')
    }

    return data
  }),
})
