import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Create categories
    const categories = await Promise.all([
      db.category.upsert({
        where: { slug: 'vinyasa' },
        update: {},
        create: {
          name: 'Vinyasa',
          slug: 'vinyasa',
          description: 'Flowing sequences linking breath with movement',
          icon: 'flame',
          order: 1,
        },
      }),
      db.category.upsert({
        where: { slug: 'hatha' },
        update: {},
        create: {
          name: 'Hatha',
          slug: 'hatha',
          description: 'Traditional yoga focusing on physical postures',
          icon: 'sun',
          order: 2,
        },
      }),
      db.category.upsert({
        where: { slug: 'yin' },
        update: {},
        create: {
          name: 'Yin',
          slug: 'yin',
          description: 'Slow-paced style targeting deep connective tissues',
          icon: 'moon',
          order: 3,
        },
      }),
      db.category.upsert({
        where: { slug: 'power' },
        update: {},
        create: {
          name: 'Power',
          slug: 'power',
          description: 'Athletic, fitness-based yoga approach',
          icon: 'dumbbell',
          order: 4,
        },
      }),
      db.category.upsert({
        where: { slug: 'meditation' },
        update: {},
        create: {
          name: 'Meditation',
          slug: 'meditation',
          description: 'Mindfulness and breathing practices',
          icon: 'wind',
          order: 5,
        },
      }),
    ]);

    // Create themes
    const themes = await Promise.all([
      db.theme.upsert({
        where: { slug: 'morning-flow' },
        update: {},
        create: {
          name: 'Morning Flow',
          slug: 'morning-flow',
          description: 'Energize your morning with these flows',
          color: '#f59e0b',
        },
      }),
      db.theme.upsert({
        where: { slug: 'stress-relief' },
        update: {},
        create: {
          name: 'Stress Relief',
          slug: 'stress-relief',
          description: 'Release tension and find calm',
          color: '#10b981',
        },
      }),
      db.theme.upsert({
        where: { slug: 'flexibility' },
        update: {},
        create: {
          name: 'Flexibility',
          slug: 'flexibility',
          description: 'Improve your range of motion',
          color: '#8b5cf6',
        },
      }),
      db.theme.upsert({
        where: { slug: 'strength' },
        update: {},
        create: {
          name: 'Strength',
          slug: 'strength',
          description: 'Build muscular strength and endurance',
          color: '#ef4444',
        },
      }),
    ]);

    // Create sample sessions
    const sessionsData = [
      {
        title: 'Energizing Morning Flow',
        slug: 'energizing-morning-flow',
        description: 'Start your day with this energizing vinyasa flow designed to wake up your body and mind.',
        duration: 45,
        difficulty: 'intermediate' as const,
        instructor: 'Sarah Johnson',
        categoryId: categories[0].id, // Vinyasa
        themeId: themes[0].id, // Morning Flow
      },
      {
        title: 'Gentle Hatha for Beginners',
        slug: 'gentle-hatha-beginners',
        description: 'A gentle introduction to hatha yoga poses, perfect for beginners.',
        duration: 30,
        difficulty: 'beginner' as const,
        instructor: 'Emma Chen',
        categoryId: categories[1].id, // Hatha
        themeId: themes[1].id, // Stress Relief
      },
      {
        title: 'Deep Stretch Yin',
        slug: 'deep-stretch-yin',
        description: 'Relax and release tension with this deep yin practice.',
        duration: 60,
        difficulty: 'beginner' as const,
        instructor: 'Lisa Park',
        categoryId: categories[2].id, // Yin
        themeId: themes[2].id, // Flexibility
      },
      {
        title: 'Power Core Workout',
        slug: 'power-core-workout',
        description: 'Build core strength with this intense power yoga session.',
        duration: 40,
        difficulty: 'advanced' as const,
        instructor: 'Michael Torres',
        categoryId: categories[3].id, // Power
        themeId: themes[3].id, // Strength
      },
      {
        title: 'Evening Wind Down',
        slug: 'evening-wind-down',
        description: 'Relax your mind and body before sleep with this gentle practice.',
        duration: 35,
        difficulty: 'beginner' as const,
        instructor: 'Sarah Johnson',
        categoryId: categories[2].id, // Yin
        themeId: themes[1].id, // Stress Relief
      },
      {
        title: 'Chakra Balancing Flow',
        slug: 'chakra-balancing-flow',
        description: 'Align your chakras through mindful movement and breath.',
        duration: 55,
        difficulty: 'intermediate' as const,
        instructor: 'Emma Chen',
        categoryId: categories[0].id, // Vinyasa
        themeId: themes[1].id, // Stress Relief
      },
      {
        title: 'Meditation for Focus',
        slug: 'meditation-focus',
        description: 'Enhance your concentration with this guided meditation.',
        duration: 20,
        difficulty: 'beginner' as const,
        instructor: 'Lisa Park',
        categoryId: categories[4].id, // Meditation
      },
      {
        title: 'Advanced Inversions',
        slug: 'advanced-inversions',
        description: 'Master challenging inversions with proper technique.',
        duration: 50,
        difficulty: 'advanced' as const,
        instructor: 'Michael Torres',
        categoryId: categories[3].id, // Power
        themeId: themes[3].id, // Strength
      },
    ];

    const sessions = await Promise.all(
      sessionsData.map((session) =>
        db.session.upsert({
          where: { slug: session.slug },
          update: {},
          create: session,
        })
      )
    );

    // Create a live session (happening now)
    await db.session.upsert({
      where: { slug: 'live-morning-vinyasa' },
      update: {},
      create: {
        title: 'Morning Vinyasa Flow',
        slug: 'live-morning-vinyasa',
        description: 'Join us live for an energizing morning vinyasa practice.',
        duration: 45,
        difficulty: 'intermediate',
        instructor: 'Sarah Johnson',
        isLive: true,
        liveAt: new Date(),
        categoryId: categories[0].id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        categories: categories.length,
        themes: themes.length,
        sessions: sessions.length,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
