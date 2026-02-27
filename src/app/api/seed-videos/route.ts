import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = getServerClient();
    
    // Get existing categories and themes
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');
    
    const { data: themes } = await supabase
      .from('themes')
      .select('id, name');

    const categoryMap = new Map((categories || []).map((c: any) => [c.name, c.id]));
    const themeMap = new Map((themes || []).map((t: any) => [t.name, t.id]));

    // Create on-demand video sessions (no live_at)
    const videoSessions = [
      {
        title: 'Energizing Morning Flow',
        slug: 'energizing-morning-flow',
        description: 'Start your day with this energizing vinyasa flow designed to wake up your body and mind. Perfect for all levels.',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
        video_url: 'https://example.com/video1.mp4',
        duration: 45,
        difficulty: 'intermediate',
        instructor: 'Sarah Johnson',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Vinyasa') || null,
        theme_id: themeMap.get('Morning Energy') || themeMap.get('Morning Flow') || null,
      },
      {
        title: 'Gentle Hatha for Beginners',
        slug: 'gentle-hatha-beginners',
        description: 'A gentle introduction to hatha yoga poses, perfect for beginners or those looking for a relaxing practice.',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
        video_url: 'https://example.com/video2.mp4',
        duration: 30,
        difficulty: 'beginner',
        instructor: 'Emma Chen',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Hatha') || null,
        theme_id: themeMap.get('Evening Relaxation') || themeMap.get('Stress Relief') || null,
      },
      {
        title: 'Deep Stretch Yin',
        slug: 'deep-stretch-yin',
        description: 'Relax and release tension with this deep yin practice. Hold poses longer to target deep connective tissues.',
        thumbnail: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800',
        video_url: 'https://example.com/video3.mp4',
        duration: 60,
        difficulty: 'beginner',
        instructor: 'Lisa Park',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Yin') || null,
        theme_id: themeMap.get('Flexibility') || null,
      },
      {
        title: 'Power Core Workout',
        slug: 'power-core-workout',
        description: 'Build core strength with this intense power yoga session. Challenge yourself and feel the burn!',
        thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
        video_url: 'https://example.com/video4.mp4',
        duration: 40,
        difficulty: 'advanced',
        instructor: 'Michael Torres',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Power') || null,
        theme_id: themeMap.get('Strength') || null,
      },
      {
        title: 'Evening Wind Down',
        slug: 'evening-wind-down',
        description: 'Relax your mind and body before sleep with this gentle practice. Perfect for ending your day.',
        thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800',
        video_url: 'https://example.com/video5.mp4',
        duration: 35,
        difficulty: 'beginner',
        instructor: 'Sarah Johnson',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Yin') || null,
        theme_id: themeMap.get('Evening Relaxation') || themeMap.get('Stress Relief') || null,
      },
      {
        title: 'Chakra Balancing Flow',
        slug: 'chakra-balancing-flow',
        description: 'Align your chakras through mindful movement and breath. A journey through all seven energy centers.',
        thumbnail: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800',
        video_url: 'https://example.com/video6.mp4',
        duration: 55,
        difficulty: 'intermediate',
        instructor: 'Emma Chen',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Vinyasa') || null,
        theme_id: themeMap.get('Balance') || themeMap.get('Stress Relief') || null,
      },
      {
        title: 'Meditation for Focus',
        slug: 'meditation-focus',
        description: 'Enhance your concentration with this guided meditation. Clear your mind and sharpen your focus.',
        thumbnail: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800',
        video_url: 'https://example.com/video7.mp4',
        duration: 20,
        difficulty: 'beginner',
        instructor: 'Lisa Park',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Meditation') || null,
        theme_id: themeMap.get('Balance') || null,
      },
      {
        title: 'Advanced Inversions',
        slug: 'advanced-inversions',
        description: 'Master challenging inversions with proper technique. Build confidence going upside down.',
        thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
        video_url: 'https://example.com/video8.mp4',
        duration: 50,
        difficulty: 'advanced',
        instructor: 'Michael Torres',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Power') || null,
        theme_id: themeMap.get('Strength') || null,
      },
    ];

    // Insert sessions
    const { data, error } = await supabase
      .from('sessions')
      .upsert(videoSessions, { 
        onConflict: 'slug',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error seeding video sessions:', error);
      return NextResponse.json(
        { error: 'Failed to seed video sessions', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${videoSessions.length} video sessions`,
      sessions: data,
    });
  } catch (error) {
    console.error('Error seeding video sessions:', error);
    return NextResponse.json(
      { error: 'Failed to seed video sessions' },
      { status: 500 }
    );
  }
}
