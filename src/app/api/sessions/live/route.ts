import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  console.log('🔍 Live Sessions API called - using Supabase');
  try {
    // Fetch sessions with live_at dates from database
    const { data: dbSessions, error } = await supabase
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
    }

    // Generate mock scheduled sessions for demo purposes
    const now = new Date();
    const mockSessions = [];

    // Create sessions for the next 14 days
    for (let i = 0; i < 20; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() + Math.floor(i / 2));
      sessionDate.setHours(6 + (i % 2) * 6, 0, 0, 0); // 6am or 12pm

      // Random time offset so some are in the past
      if (i % 5 === 0) {
        sessionDate.setDate(sessionDate.getDate() - 1);
        sessionDate.setHours(10, 0, 0, 0);
      }

      const instructors = ['Sarah Johnson', 'Emma Chen', 'Michael Torres', 'Lisa Park', 'David Kim'];
      const titles = [
        'Morning Vinyasa Flow',
        'Sunset Yin Practice',
        'Power Yoga Challenge',
        'Gentle Hatha Yoga',
        'Meditation & Breathwork',
        'Core Strength Yoga',
        'Restorative Flow',
        'Advanced Asana Practice',
      ];
      const difficulties = ['beginner', 'intermediate', 'advanced'];
      const categories = ['Vinyasa', 'Hatha', 'Yin', 'Power', 'Meditation'];

      const isLive = sessionDate <= now && new Date(sessionDate.getTime() + 60 * 60 * 1000) >= now;

      mockSessions.push({
        id: `live_${i + 1}`,
        title: titles[i % titles.length],
        slug: `live-session-${i + 1}`,
        description: `Join us for an amazing ${titles[i % titles.length].toLowerCase()} session.`,
        thumbnail: null,
        duration: 45 + (i % 3) * 15,
        difficulty: difficulties[i % 3],
        instructor: instructors[i % instructors.length],
        isLive,
        liveAt: sessionDate.toISOString(),
        category: { name: categories[i % categories.length] },
        theme: null,
      });
    }

    // Combine database sessions with mock sessions
    const sessions = [...(dbSessions || []), ...mockSessions];

    // Sort by date
    sessions.sort((a, b) => new Date(a.liveAt || a.live_at).getTime() - new Date(b.liveAt || b.live_at).getTime());

    // Format response
    const formattedSessions = sessions.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      thumbnail: s.thumbnail,
      duration: s.duration,
      difficulty: s.difficulty,
      instructor: s.instructor,
      liveAt: s.live_at || s.liveAt,
      isLive: s.is_live ?? s.isLive ?? false,
      category: s.category,
      theme: s.theme,
    }));

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
