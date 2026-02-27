import { NextResponse } from 'next/server';
import { uploadToR2, VIDEOS_BUCKET } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = formData.get('slug') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: 'No slug provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP4, WebM, MOV' },
        { status: 400 }
      );
    }

    // Validate file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Max 2GB' },
        { status: 400 }
      );
    }

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    
    // Generate key: slug/video.mp4 (SEO-friendly folder structure)
    const key = `${slug}/video.${extension}`;

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const result = await uploadToR2(VIDEOS_BUCKET, key, buffer, file.type);

    console.log('Video upload complete - key:', result.key, 'url:', result.url);

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.url,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}
