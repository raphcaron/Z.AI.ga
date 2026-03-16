import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials not found. Database operations will fail.')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Type exports for database schema
export interface Session {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  video_url: string | null
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructor: string | null
  is_live: boolean
  live_at: string | null
  is_published: boolean
  streaming_now: boolean
  category_id: string | null
  theme_id: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface Theme {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
}

export interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  is_admin: boolean
}
