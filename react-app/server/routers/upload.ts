import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

// R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
})

const VIDEOS_BUCKET = process.env.CLOUDFLARE_R2_VIDEOS_BUCKET || 'yoga-videos'
const THUMBNAILS_BUCKET = process.env.CLOUDFLARE_R2_THUMBNAILS_BUCKET || 'yoga-thumbnails'
const VIDEOS_URL = process.env.CLOUDFLARE_R2_VIDEOS_URL || ''
const THUMBNAILS_URL = process.env.CLOUDFLARE_R2_THUMBNAILS_URL || ''

async function uploadToR2(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  const baseUrl = bucket === VIDEOS_BUCKET ? VIDEOS_URL : THUMBNAILS_URL
  return { key, url: `${baseUrl}/${key}` }
}

async function deleteFolderFromR2(bucket: string, prefix: string): Promise<number> {
  let deletedCount = 0

  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  })

  const response = await r2Client.send(listCommand)

  if (response.Contents) {
    for (const object of response.Contents) {
      if (object.Key) {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: object.Key,
          })
        )
        deletedCount++
      }
    }
  }

  return deletedCount
}

export const uploadRouter = router({
  // Get presigned URL for direct upload (alternative approach)
  getPresignedUrl: protectedProcedure
    .input(z.object({
      type: z.enum(['video', 'thumbnail']),
      slug: z.string(),
      extension: z.string(),
    }))
    .mutation(async ({ input }) => {
      const bucket = input.type === 'video' ? VIDEOS_BUCKET : THUMBNAILS_BUCKET
      const key = `${input.slug}/${input.type}.${input.extension}`

      // For now, return the key - client will upload directly
      return {
        key,
        bucket,
        uploadUrl: null, // Would need presigned URL generation
      }
    }),

  // Delete files for a session
  deleteSessionFiles: protectedProcedure
    .input(z.object({
      slug: z.string().min(3),
    }))
    .mutation(async ({ input }) => {
      const folderPrefix = `${input.slug}/`

      const [videosDeleted, thumbnailsDeleted] = await Promise.all([
        deleteFolderFromR2(VIDEOS_BUCKET, folderPrefix),
        deleteFolderFromR2(THUMBNAILS_BUCKET, folderPrefix),
      ])

      console.log(`Deleted ${videosDeleted} video(s) and ${thumbnailsDeleted} thumbnail(s) for slug: ${input.slug}`)

      return {
        success: true,
        videosDeleted,
        thumbnailsDeleted,
      }
    }),
})
