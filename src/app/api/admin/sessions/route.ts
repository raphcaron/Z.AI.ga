import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin Sessions API
 * Returns ALL sessions (including unpublished) for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided.' },
        { status: 401 }
      );
    }
    
    // Verify user is admin
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token.' },
        { status: 401 }
      );
    }
    
    const isAdmin = user.user_metadata?.is_admin === true;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }
    
    // Use service role to fetch all sessions
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Fetch ALL sessions (including unpublished)
    const { data: sessions, error: sessionsError } = await supabaseAdmin
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
        category:categories ( name ),
        theme:themes ( name )
      `)
      .order('created_at', { ascending: false });
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions: ' + sessionsError.message },
        { status: 500 }
      );
    }
    
    // Fetch categories
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, description')
      .order('name');
    
    // Fetch themes
    const { data: themes, error: themesError } = await supabaseAdmin
      .from('themes')
      .select('id, name, slug, description, color')
      .order('name');
    
    return NextResponse.json({
      sessions: sessions || [],
      categories: categories || [],
      themes: themes || [],
    });
  } catch (error) {
    console.error('Error in admin sessions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
