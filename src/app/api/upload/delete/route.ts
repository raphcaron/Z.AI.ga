import { NextResponse } from 'next/server';
import { deleteFolderFromR2, VIDEOS_BUCKET, THUMBNAILS_BUCKET } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: 'No slug provided' }, { status: 400 });
    }

    // Validate slug - must be at least 3 characters to prevent accidental broad matches
    if (slug.length < 3) {
      return NextResponse.json({ error: 'Invalid slug - too short' }, { status: 400 });
    }

    // Add trailing slash to ensure we only delete that exact folder, not partial matches
    // e.g., "test" won't match "test-video", only "test/" folder
    const folderPrefix = `${slug}/`;

    // Delete files from both buckets
    const videosDeleted = await deleteFolderFromR2(VIDEOS_BUCKET, folderPrefix);
    const thumbnailsDeleted = await deleteFolderFromR2(THUMBNAILS_BUCKET, folderPrefix);

    console.log(`Deleted ${videosDeleted} video(s) and ${thumbnailsDeleted} thumbnail(s) for slug: ${slug}`);

    return NextResponse.json({
      success: true,
      deleted: {
        videos: videosDeleted,
        thumbnails: thumbnailsDeleted,
      },
    });
  } catch (error) {
    console.error('Error deleting files from R2:', error);
    return NextResponse.json(
      { error: 'Failed to delete files from R2' },
      { status: 500 }
    );
  }
}
