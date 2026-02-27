import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  return NextResponse.json({
    error: 'Please use the "Seed Demo Data" button in the Admin Dashboard to seed data with your authentication.',
    hint: 'Go to /admin and click the "Seed Demo Data" button in the header.'
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided. Please log in.' },
        { status: 401 }
      );
    }
    
    // Create client with the user's token
    const supabase = createClient(
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
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Invalid token. Please log in again.' },
        { status: 401 }
      );
    }
    
    console.log('🌱 Starting seed process for user:', user.id);

    const insertErrors: string[] = [];
    
    // Step 1: Create categories (with slug!)
    const categories = [
      { name: 'Vinyasa', slug: 'vinyasa', description: 'Flowing sequences linking breath with movement' },
      { name: 'Hatha', slug: 'hatha', description: 'Traditional yoga postures held for longer durations' },
      { name: 'Yin', slug: 'yin', description: 'Slow-paced style targeting deep connective tissues' },
      { name: 'Power', slug: 'power', description: 'Intense, fitness-based approach to yoga' },
      { name: 'Meditation', slug: 'meditation', description: 'Guided mindfulness and breathwork practices' },
      { name: 'Restorative', slug: 'restorative', description: 'Gentle, relaxing poses for deep rest' },
      { name: 'Pilates', slug: 'pilates', description: 'Core-focused movement and strength' },
    ];

    // Check existing categories
    const { data: existingCategories, error: catFetchError } = await supabase
      .from('categories')
      .select('id, name');

    if (catFetchError) {
      console.error('Error fetching categories:', catFetchError);
      insertErrors.push(`Fetch categories error: ${catFetchError.message}`);
    }

    let categoryMap = new Map((existingCategories || []).map((c: any) => [c.name, c.id]));
    console.log(`Existing categories: ${categoryMap.size}`);

    // Insert missing categories one by one
    for (const cat of categories) {
      if (!categoryMap.has(cat.name)) {
        console.log(`Inserting category: ${cat.name}`);
        const { data, error } = await supabase
          .from('categories')
          .insert(cat)
          .select('id, name')
          .single();
        
        if (error) {
          console.error(`Error inserting category "${cat.name}":`, error);
          insertErrors.push(`Category "${cat.name}": ${error.message} (code: ${error.code})`);
        } else if (data) {
          console.log(`Inserted category: ${data.name} (${data.id})`);
          categoryMap.set(data.name, data.id);
        }
      }
    }

    console.log(`✅ Categories: ${categoryMap.size} available`);

    // Step 2: Create themes (with slug!)
    const themes = [
      { name: 'Morning Energy', slug: 'morning-energy', description: 'Start your day with vitality', color: '#F59E0B' },
      { name: 'Evening Relaxation', slug: 'evening-relaxation', description: 'Wind down and prepare for rest', color: '#8B5CF6' },
      { name: 'Stress Relief', slug: 'stress-relief', description: 'Release tension and find calm', color: '#10B981' },
      { name: 'Strength', slug: 'strength', description: 'Build power and resilience', color: '#EF4444' },
      { name: 'Flexibility', slug: 'flexibility', description: 'Increase range of motion', color: '#3B82F6' },
      { name: 'Balance', slug: 'balance', description: 'Find physical and mental equilibrium', color: '#EC4899' },
      { name: 'Focus', slug: 'focus', description: 'Sharpen concentration and clarity', color: '#6366F1' },
      { name: 'Core', slug: 'core', description: 'Strengthen your center', color: '#F97316' },
    ];

    // Check existing themes
    const { data: existingThemes, error: themeFetchError } = await supabase
      .from('themes')
      .select('id, name');

    if (themeFetchError) {
      console.error('Error fetching themes:', themeFetchError);
      insertErrors.push(`Fetch themes error: ${themeFetchError.message}`);
    }

    let themeMap = new Map((existingThemes || []).map((t: any) => [t.name, t.id]));
    console.log(`Existing themes: ${themeMap.size}`);

    // Insert missing themes one by one
    for (const theme of themes) {
      if (!themeMap.has(theme.name)) {
        console.log(`Inserting theme: ${theme.name}`);
        const { data, error } = await supabase
          .from('themes')
          .insert(theme)
          .select('id, name')
          .single();
        
        if (error) {
          console.error(`Error inserting theme "${theme.name}":`, error);
          insertErrors.push(`Theme "${theme.name}": ${error.message} (code: ${error.code})`);
        } else if (data) {
          console.log(`Inserted theme: ${data.name} (${data.id})`);
          themeMap.set(data.name, data.id);
        }
      }
    }

    console.log(`✅ Themes: ${themeMap.size} available`);

    // Return result with any errors
    if (insertErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Seeding completed with errors. Categories: ${categoryMap.size}, Themes: ${themeMap.size}`,
        errors: insertErrors,
        data: {
          categories: categoryMap.size,
          themes: themeMap.size,
        },
      });
    }

    // Step 3: Check if sessions already exist
    const { data: existingSessions } = await supabase
      .from('sessions')
      .select('id')
      .limit(1);

    if (existingSessions && existingSessions.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Seeded ${categoryMap.size} categories and ${themeMap.size} themes. Sessions already exist.`,
        data: {
          categories: categoryMap.size,
          themes: themeMap.size,
          sessionsSkipped: true,
        },
      });
    }

    // Insert sessions
    const videoSessions = [
      {
        title: 'Energizing Morning Flow',
        slug: 'energizing-morning-flow',
        description: 'Start your day with this energizing vinyasa flow designed to wake up your body and mind.',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
        video_url: 'https://example.com/video1.mp4',
        duration: 45,
        difficulty: 'intermediate',
        instructor: 'Sarah Johnson',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Vinyasa') || null,
        theme_id: themeMap.get('Morning Energy') || null,
      },
      {
        title: 'Gentle Hatha for Beginners',
        slug: 'gentle-hatha-beginners',
        description: 'A gentle introduction to hatha yoga poses.',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
        video_url: 'https://example.com/video2.mp4',
        duration: 30,
        difficulty: 'beginner',
        instructor: 'Emma Chen',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Hatha') || null,
        theme_id: themeMap.get('Evening Relaxation') || null,
      },
      {
        title: 'Deep Stretch Yin',
        slug: 'deep-stretch-yin',
        description: 'Relax and release tension with this deep yin practice.',
        thumbnail: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80',
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
        description: 'Build core strength with this intense power yoga session.',
        thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
        video_url: 'https://example.com/video4.mp4',
        duration: 40,
        difficulty: 'advanced',
        instructor: 'Michael Torres',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Power') || null,
        theme_id: themeMap.get('Core') || null,
      },
      {
        title: 'Meditation for Focus',
        slug: 'meditation-focus',
        description: 'Enhance your concentration with this guided meditation.',
        thumbnail: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80',
        video_url: 'https://example.com/video5.mp4',
        duration: 20,
        difficulty: 'beginner',
        instructor: 'Lisa Park',
        is_live: false,
        live_at: null,
        is_published: true,
        category_id: categoryMap.get('Meditation') || null,
        theme_id: themeMap.get('Focus') || null,
      },
    ];

    const now = new Date();
    const liveSessions = [
      {
        title: 'Live Morning Vinyasa',
        slug: 'live-morning-vinyasa',
        description: 'Join us live for an energizing morning vinyasa flow.',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
        video_url: null,
        duration: 60,
        difficulty: 'intermediate',
        instructor: 'Sarah Johnson',
        is_live: true,
        live_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        is_published: true,
        streaming_now: false,
        category_id: categoryMap.get('Vinyasa') || null,
        theme_id: themeMap.get('Morning Energy') || null,
      },
      {
        title: 'Live Guided Meditation',
        slug: 'live-guided-meditation',
        description: 'A live group meditation session.',
        thumbnail: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80',
        video_url: null,
        duration: 30,
        difficulty: 'beginner',
        instructor: 'Lisa Park',
        is_live: true,
        live_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        is_published: true,
        streaming_now: false,
        category_id: categoryMap.get('Meditation') || null,
        theme_id: themeMap.get('Stress Relief') || null,
      },
    ];

    const allSessions = [...videoSessions, ...liveSessions];
    
    const { data, error } = await supabase
      .from('sessions')
      .insert(allSessions)
      .select();

    if (error) {
      insertErrors.push(`Sessions: ${error.message}`);
    }

    return NextResponse.json({
      success: insertErrors.length === 0,
      message: insertErrors.length > 0 
        ? 'Seeding completed with errors' 
        : `Seeded ${categoryMap.size} categories, ${themeMap.size} themes, and ${data?.length || 0} sessions`,
      errors: insertErrors.length > 0 ? insertErrors : undefined,
      data: {
        categories: categoryMap.size,
        themes: themeMap.size,
        sessions: data?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error?.message },
      { status: 500 }
    );
  }
}
