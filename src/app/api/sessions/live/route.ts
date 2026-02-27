import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  console.log('🔍 Live Sessions API called - using Supabase');
  try {
    // Fetch sessions that have a scheduled live time
    const { data: sessions, error } = await supabase
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
        category:categories ( name ),
        theme:themes ( name, color )
      `)
      .eq('is_published', true)
      .not('live_at', 'is', null)
      .order('live_at', { ascending: true });

    if (error) {
      console.error('Error fetching live sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch live sessions' },
        { status: 500 }
      );
    }

    // Determine which sessions are currently live
    const now = new Date();
    const formattedSessions = (sessions || []).map((s: any) => {
      const liveAt = new Date(s.live_at);
      const liveEndTime = new Date(liveAt.getTime() + (s.duration || 60) * 60 * 1000);
      const isCurrentlyLive = liveAt <= now && now <= liveEndTime;

      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        description: s.description,
        thumbnail: s.thumbnail,
        duration: s.duration,
        difficulty: s.difficulty,
        instructor: s.instructor,
        liveAt: s.live_at,
        isLive: isCurrentlyLive,
        category: s.category,
        theme: s.theme,
      };
    });

    return NextResponse.json({
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live sessions' },
      { status: 500 }
    );
  }
}
