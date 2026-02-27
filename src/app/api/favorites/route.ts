import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

async function getUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = getServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// GET - Get all favorites for the current user
export async function GET(request: Request) {
  try {
    const user = await getUser(request.headers.get('Authorization'));
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServerClient();

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id,
        user_id,
        session_id,
        created_at,
        session:sessions (
          id,
          title,
          slug,
          description,
          thumbnail,
          duration,
          difficulty,
          instructor,
          category:categories ( id, name, slug ),
          theme:themes ( id, name, slug, color )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorites: favorites || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST - Add a session to favorites
export async function POST(request: Request) {
  try {
    const user = await getUser(request.headers.get('Authorization'));
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // Check if session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .single();

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Already favorited' },
        { status: 400 }
      );
    }

    // Create favorite
    const { data: favorite, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        session_id: sessionId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding favorite:', insertError);
      return NextResponse.json(
        { error: 'Failed to add favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a session from favorites
export async function DELETE(request: Request) {
  try {
    const user = await getUser(request.headers.get('Authorization'));
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // Delete favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json(
        { error: 'Failed to remove favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
