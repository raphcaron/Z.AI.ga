import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    // Get existing categories and themes
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');
    
    const { data: themes } = await supabase
      .from('themes')
      .select('id, name');

    const categoryMap = new Map((categories || []).map((c: any) => [c.name, c.id]));
    const themeMap = new Map((themes || []).map((t: any) => [t.name, t.id]));

    // Generate live sessions for the next 14 days
    const now = new Date();
    const liveSessions = [];
    
    const sessionTemplates = [
      { title: 'Morning Vinyasa Flow', difficulty: 'intermediate', instructor: 'Sarah Johnson', duration: 45 },
      { title: 'Sunset Yin Practice', difficulty: 'beginner', instructor: 'Emma Chen', duration: 60 },
      { title: 'Power Yoga Challenge', difficulty: 'advanced', instructor: 'Michael Torres', duration: 50 },
      { title: 'Gentle Hatha Yoga', difficulty: 'beginner', instructor: 'Lisa Park', duration: 45 },
      { title: 'Meditation & Breathwork', difficulty: 'beginner', instructor: 'David Kim', duration: 30 },
      { title: 'Core Strength Yoga', difficulty: 'intermediate', instructor: 'Sarah Johnson', duration: 40 },
      { title: 'Restorative Flow', difficulty: 'beginner', instructor: 'Emma Chen', duration: 55 },
      { title: 'Advanced Asana Practice', difficulty: 'advanced', instructor: 'Michael Torres', duration: 60 },
    ];

    const categoryNames = ['Vinyasa', 'Hatha', 'Yin', 'Power', 'Meditation'];
    const themeNames = ['Morning Energy', 'Evening Relaxation', 'Strength', 'Flexibility', 'Balance'];

    // Create sessions for next 14 days, 2 per day
    for (let day = 0; day < 14; day++) {
      for (let slot = 0; slot < 2; slot++) {
        const template = sessionTemplates[(day * 2 + slot) % sessionTemplates.length];
        const liveAt = new Date(now);
        liveAt.setDate(now.getDate() + day);
        liveAt.setHours(6 + slot * 8, 0, 0, 0); // 6am and 2pm

        const categoryName = categoryNames[(day + slot) % categoryNames.length];
        const themeName = themeNames[(day + slot) % themeNames.length];

        liveSessions.push({
          title: template.title,
          slug: `live-${template.title.toLowerCase().replace(/\s+/g, '-')}-${day}-${slot}`,
          description: `Join ${template.instructor} for an amazing ${template.title.toLowerCase()} session. Perfect for ${template.difficulty} level practitioners.`,
          thumbnail: null,
          video_url: null,
          duration: template.duration,
          difficulty: template.difficulty,
          instructor: template.instructor,
          is_live: false,
          live_at: liveAt.toISOString(),
          is_published: true,
          category_id: categoryMap.get(categoryName) || null,
          theme_id: themeMap.get(themeName) || null,
        });
      }
    }

    // Insert sessions
    const { data, error } = await supabase
      .from('sessions')
      .upsert(liveSessions, { 
        onConflict: 'slug',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error seeding live sessions:', error);
      return NextResponse.json(
        { error: 'Failed to seed live sessions', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${liveSessions.length} live sessions`,
      sessions: data,
    });
  } catch (error) {
    console.error('Error seeding live sessions:', error);
    return NextResponse.json(
      { error: 'Failed to seed live sessions' },
      { status: 500 }
    );
  }
}
