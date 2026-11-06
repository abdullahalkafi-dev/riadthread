import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createReadStream } from 'node:fs';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Object storage behind a small interface. MinIO today; any S3-compatible
 * service (Cloudflare R2, S3) can replace it by changing the environment.
 *
 * Two buckets:
 *  - private: original uploads, never served to the public
 *  - public:  processed renditions, posters and documents (read-only)
 */
const s3 = new S3Client({
  endpoint: env.MINIO_ENDPOINT,
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: env.MINIO_ACCESS_KEY, secretAccessKey: env.MINIO_SECRET_KEY },
});

const IMMUTABLE = 'public, max-age=31536000, immutable';

async function ensureBucket(bucket: string, publicRead: boolean) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    logger.info({ bucket }, 'Created storage bucket');
  }
  if (publicRead) {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
  }
}

export const storage = {
  async ensureBuckets() {
    await ensureBucket(env.MINIO_BUCKET_PRIVATE, false);
    await ensureBucket(env.MINIO_BUCKET_PUBLIC, true);
  },

  putPrivate(key: string, body: Buffer | string, contentType: string) {
    const stream = typeof body === 'string' ? createReadStream(body) : body;
    return s3.send(
      new PutObjectCommand({ Bucket: env.MINIO_BUCKET_PRIVATE, Key: key, Body: stream, ContentType: contentType }),
    );
  },

  putPublic(key: string, body: Buffer, contentType: string) {
    return s3.send(
      new PutObjectCommand({
        Bucket: env.MINIO_BUCKET_PUBLIC,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: IMMUTABLE,
      }),
    );
  },

  async getPrivate(key: string): Promise<Buffer> {
    const res = await s3.send(new GetObjectCommand({ Bucket: env.MINIO_BUCKET_PRIVATE, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  },

  async remove(bucket: 'private' | 'public', key: string) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket === 'private' ? env.MINIO_BUCKET_PRIVATE : env.MINIO_BUCKET_PUBLIC,
        Key: key,
      }),
    );
  },

  /** Path the browser uses; Caddy (or the dev server) maps /media to the public bucket. */
  publicUrl(key: string) {
    return `${env.MEDIA_BASE_URL}/${key}`;
  },
};
