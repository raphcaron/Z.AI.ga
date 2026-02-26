import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const upcomingLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Get currently live sessions
    const liveNow = await db.session.findMany({
      where: {
        isLive: true,
        isPublished: true,
      },
      include: {
        category: true,
        theme: true,
      },
    });

    // Get upcoming scheduled live sessions
    const upcoming = await db.session.findMany({
      where: {
        isPublished: true,
        liveAt: {
          gte: now,
          lte: upcomingLimit,
        },
      },
      include: {
        category: true,
        theme: true,
      },
      orderBy: {
        liveAt: 'asc',
      },
      take: 10,
    });

    return NextResponse.json({
      liveNow,
      upcoming,
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live sessions' },
      { status: 500 }
    );
  }
}
