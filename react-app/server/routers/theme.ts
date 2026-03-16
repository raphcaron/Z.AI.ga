import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { supabase } from '../db'

export const themeRouter = router({
  // Get all themes (public)
  getAll: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching themes:', error)
      throw new Error('Failed to fetch themes')
    }

    return data || []
  }),

  // Admin: Create theme
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('themes')
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description || null,
          color: input.color || '#6366F1',
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating theme:', error)
        throw new Error(error.message || 'Failed to create theme')
      }

      return { success: true, id: data.id }
    }),

  // Admin: Update theme
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input

      const { error } = await supabase
        .from('themes')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating theme:', error)
        throw new Error(error.message || 'Failed to update theme')
      }

      return { success: true }
    }),

  // Admin: Delete theme
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', input.id)

      if (error) {
        console.error('Error deleting theme:', error)
        throw new Error(error.message || 'Failed to delete theme')
      }

      return { success: true }
    }),
})
