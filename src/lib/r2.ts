import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// R2 Client - lazy initialization to avoid build-time errors
let r2Client: S3Client | null = null;

function getR2Client() {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
      },
    });
  }
  return r2Client;
}

// Bucket names
export const VIDEOS_BUCKET = process.env.CLOUDFLARE_R2_VIDEOS_BUCKET || 'yoga-videos';
export const THUMBNAILS_BUCKET = process.env.CLOUDFLARE_R2_THUMBNAILS_BUCKET || 'yoga-thumbnails';

// Public URLs
export const VIDEOS_URL = process.env.CLOUDFLARE_R2_VIDEOS_URL || '';
export const THUMBNAILS_URL = process.env.CLOUDFLARE_R2_THUMBNAILS_URL || '';

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Determine the public URL based on bucket
  const baseUrl = bucket === VIDEOS_BUCKET ? VIDEOS_URL : THUMBNAILS_URL;
  const url = `${baseUrl}/${key}`;

  return { key, url };
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(bucket: string, key: string): Promise<void> {
  const client = getR2Client();
  
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Generate a unique file key
 */
export function generateFileKey(sessionId: string, extension: string): string {
  return `${sessionId}/${Date.now()}.${extension}`;
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, key: string): string {
  const baseUrl = bucket === VIDEOS_BUCKET ? VIDEOS_URL : THUMBNAILS_URL;
  return `${baseUrl}/${key}`;
}
