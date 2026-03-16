import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { supabase } from '../db'

export const categoryRouter = router({
  // Get all categories (public)
  getAll: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      throw new Error('Failed to fetch categories')
    }

    return data || []
  }),

  // Admin: Create category
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating category:', error)
        throw new Error(error.message || 'Failed to create category')
      }

      return { success: true, id: data.id }
    }),

  // Admin: Update category
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input

      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating category:', error)
        throw new Error(error.message || 'Failed to update category')
      }

      return { success: true }
    }),

  // Admin: Delete category
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', input.id)

      if (error) {
        console.error('Error deleting category:', error)
        throw new Error(error.message || 'Failed to delete category')
      }

      return { success: true }
    }),
})
