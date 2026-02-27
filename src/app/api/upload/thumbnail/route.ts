import { NextResponse } from 'next/server';
import { uploadToR2, THUMBNAILS_BUCKET } from '@/lib/r2';

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB' },
        { status: 400 }
      );
    }

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Generate key: slug/thumbnail.jpg (SEO-friendly folder structure)
    const key = `${slug}/thumbnail.${extension}`;

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const result = await uploadToR2(THUMBNAILS_BUCKET, key, buffer, file.type);

    console.log('Thumbnail upload complete - key:', result.key, 'url:', result.url);

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.url,
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to upload thumbnail' },
      { status: 500 }
    );
  }
}
