import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServerClient();
    const now = new Date();
    const upcomingLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Get currently live sessions
    const { data: liveNow, error: liveError } = await supabase
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
        is_live,
        live_at,
        category:categories ( id, name, slug ),
        theme:themes ( id, name, slug, color )
      `)
      .eq('is_live', true)
      .eq('is_published', true);

    if (liveError) {
      console.error('Error fetching live sessions:', liveError);
    }

    // Get upcoming scheduled live sessions
    const { data: upcoming, error: upcomingError } = await supabase
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
        is_live,
        live_at,
        category:categories ( id, name, slug ),
        theme:themes ( id, name, slug, color )
      `)
      .eq('is_published', true)
      .gte('live_at', now.toISOString())
      .lte('live_at', upcomingLimit.toISOString())
      .order('live_at', { ascending: true })
      .limit(10);

    if (upcomingError) {
      console.error('Error fetching upcoming sessions:', upcomingError);
    }

    return NextResponse.json({
      liveNow: liveNow || [],
      upcoming: upcoming || [],
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live sessions' },
      { status: 500 }
    );
  }
}
