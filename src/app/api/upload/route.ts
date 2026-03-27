import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
});

const VIDEOS_BUCKET = process.env.CLOUDFLARE_R2_VIDEOS_BUCKET || 'yoga-videos';
const THUMBNAILS_BUCKET = process.env.CLOUDFLARE_R2_THUMBNAILS_BUCKET || 'yoga-thumbnails';
const VIDEOS_URL = process.env.CLOUDFLARE_R2_VIDEOS_URL || '';
const THUMBNAILS_URL = process.env.CLOUDFLARE_R2_THUMBNAILS_URL || '';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = formData.get('slug') as string || randomUUID();
    const type = formData.get('type') as string || 'thumbnail';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let allowedTypes: string[];
    let maxSize: number;
    let bucket: string;
    let baseUrl: string;

    if (type === 'video') {
      allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      maxSize = 3 * 1024 * 1024 * 1024; // 3GB
      bucket = VIDEOS_BUCKET;
      baseUrl = VIDEOS_URL;
    } else {
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/webp'];
      maxSize = 5 * 1024 * 1024; // 5MB
      bucket = THUMBNAILS_BUCKET;
      baseUrl = THUMBNAILS_URL;
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File must be under ${maxMB}MB` },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg');
    const key = `${slug}/${type}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${baseUrl}/${key}`;

    return NextResponse.json({ success: true, url, key });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
