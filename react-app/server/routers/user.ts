import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { supabase } from '../db'

export const userRouter = router({
  // Admin: Get all users
  getAll: protectedProcedure.query(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }

    return { users: data || [] }
  }),

  // Admin: Toggle admin status
  toggleAdmin: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isAdmin: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: input.isAdmin })
        .eq('id', input.userId)

      if (error) {
        console.error('Error toggling admin:', error)
        throw new Error(error.message || 'Failed to update admin status')
      }

      return { success: true }
    }),

  // Get user by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', input.id)
        .single()

      if (error) {
        console.error('Error fetching user:', error)
        return null
      }

      return data
    }),
})
