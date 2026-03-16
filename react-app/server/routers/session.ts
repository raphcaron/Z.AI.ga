import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { supabase } from '../db'

export const sessionRouter = router({
  // Get all published sessions (public)
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit || 10

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          slug,
          description,
          thumbnail,
          video_url,
          duration,
          difficulty,
          instructor,
          is_live,
          live_at,
          is_published,
          streaming_now,
          category_id,
          theme_id,
          created_at,
          category:categories(name),
          theme:themes(name)
        `)
        .eq('is_published', true)
        .is('live_at', null) // Not live sessions, just videos
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching sessions:', error)
        throw new Error('Failed to fetch sessions')
      }

      return {
        sessions: data || [],
        total: data?.length || 0,
      }
    }),

  // Get live sessions (public)
  getLive: publicProcedure.query(async () => {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        slug,
        description,
        thumbnail,
        duration,
        difficulty,
        instructor,
        live_at,
        streaming_now,
        category_id,
        theme_id,
        category:categories(name),
        theme:themes(name)
      `)
      .not('live_at', 'is', null)
      .or(`live_at.gte.${now},streaming_now.eq.true`)
      .order('live_at', { ascending: true })

    if (error) {
      console.error('Error fetching live sessions:', error)
      throw new Error('Failed to fetch live sessions')
    }

    return {
      sessions: data || [],
    }
  }),

  // Get single session by slug or ID (public)
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          slug,
          description,
          thumbnail,
          video_url,
          duration,
          difficulty,
          instructor,
          is_live,
          live_at,
          is_published,
          streaming_now,
          category_id,
          theme_id,
          created_at,
          category:categories(id, name, slug),
          theme:themes(id, name, slug, color)
        `)
        .or(`slug.eq.${input.slug},id.eq.${input.slug}`)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
        return null
      }

      return data
    }),

  // Admin: Get all sessions
  getAdmin: protectedProcedure.query(async ({ ctx }) => {
    const [sessionsResult, categoriesResult, themesResult] = await Promise.all([
      supabase
        .from('sessions')
        .select(`
          id,
          title,
          slug,
          description,
          thumbnail,
          video_url,
          duration,
          difficulty,
          instructor,
          is_live,
          live_at,
          is_published,
          streaming_now,
          category_id,
          theme_id,
          created_at,
          category:categories(name),
          theme:themes(name)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('themes').select('*'),
    ])

    if (sessionsResult.error) {
      console.error('Error fetching admin sessions:', sessionsResult.error)
    }

    return {
      sessions: sessionsResult.data || [],
      categories: categoriesResult.data || [],
      themes: themesResult.data || [],
    }
  }),

  // Admin: Create session
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      thumbnail: z.string().optional(),
      video_url: z.string().optional(),
      duration: z.number(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      instructor: z.string().optional(),
      is_live: z.boolean().optional(),
      live_at: z.string().optional(),
      is_published: z.boolean().optional(),
      category_id: z.string().optional(),
      theme_id: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          title: input.title,
          slug: input.slug,
          description: input.description || null,
          thumbnail: input.thumbnail || null,
          video_url: input.video_url || null,
          duration: input.duration,
          difficulty: input.difficulty,
          instructor: input.instructor || null,
          is_live: input.is_live || false,
          live_at: input.live_at || null,
          is_published: input.is_published ?? true,
          category_id: input.category_id || null,
          theme_id: input.theme_id || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating session:', error)
        throw new Error(error.message || 'Failed to create session')
      }

      return { success: true, id: data.id }
    }),

  // Admin: Update session
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      thumbnail: z.string().optional(),
      video_url: z.string().optional(),
      duration: z.number().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      instructor: z.string().optional(),
      is_published: z.boolean().optional(),
      category_id: z.string().optional().nullable(),
      theme_id: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input

      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating session:', error)
        throw new Error(error.message || 'Failed to update session')
      }

      return { success: true }
    }),

  // Admin: Delete session
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', input.id)

      if (error) {
        console.error('Error deleting session:', error)
        throw new Error(error.message || 'Failed to delete session')
      }

      return { success: true }
    }),

  // Toggle published status
  togglePublished: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      // First get current status
      const { data: session } = await supabase
        .from('sessions')
        .select('is_published')
        .eq('id', input.id)
        .single()

      if (!session) {
        throw new Error('Session not found')
      }

      const { error } = await supabase
        .from('sessions')
        .update({ is_published: !session.is_published })
        .eq('id', input.id)

      if (error) {
        console.error('Error toggling published:', error)
        throw new Error('Failed to toggle published status')
      }

      return { success: true, is_published: !session.is_published }
    }),
})
