import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream } from 'node:fs';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Object storage behind a small interface. SeaweedFS today; any S3-compatible
 * service (Cloudflare R2, S3) can replace it by changing the environment.
 *
 * Two buckets:
 *  - private: original uploads, never served to the public
 *  - public:  processed renditions, posters and documents (read-only)
 */
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
  // SeaweedFS and other S3-compatible servers do not all accept the newer
  // default checksum headers, so send them only when an operation needs them.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
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
    await allowPublicRead(bucket);
  }
}

/**
 * Applies a read-only bucket policy where the server supports one. SeaweedFS
 * grants anonymous read through its identity file instead (see
 * docker/seaweedfs), so a refusal here is expected and not an error.
 */
async function allowPublicRead(bucket: string) {
  try {
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
  } catch (err) {
    logger.info(
      { bucket, reason: (err as Error).name },
      'Bucket policy not applied; public read must be granted by the storage server config',
    );
  }
}

export const storage = {
  async ensureBuckets() {
    await ensureBucket(env.S3_BUCKET_PRIVATE, false);
    await ensureBucket(env.S3_BUCKET_PUBLIC, true);
  },

  putPrivate(key: string, body: Buffer | string, contentType: string) {
    const stream = typeof body === 'string' ? createReadStream(body) : body;
    return s3.send(
      new PutObjectCommand({ Bucket: env.S3_BUCKET_PRIVATE, Key: key, Body: stream, ContentType: contentType }),
    );
  },

  /** A Buffer for small renditions, or a file path so large files are streamed, never held in memory. */
  putPublic(key: string, body: Buffer | string, contentType: string) {
    return s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_PUBLIC,
        Key: key,
        Body: typeof body === 'string' ? createReadStream(body) : body,
        ContentType: contentType,
        CacheControl: IMMUTABLE,
      }),
    );
  },

  /** Streams a private original straight to disk (videos can be 150 MB). */
  async downloadPrivate(key: string, destPath: string): Promise<void> {
    const res = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET_PRIVATE, Key: key }));
    await pipeline(res.Body as Readable, createWriteStream(destPath));
  },

  /** Small originals only (images are capped at 8 MB); use downloadPrivate for anything larger. */
  async getPrivate(key: string): Promise<Buffer> {
    const res = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET_PRIVATE, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  },

  async remove(bucket: 'private' | 'public', key: string) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket === 'private' ? env.S3_BUCKET_PRIVATE : env.S3_BUCKET_PUBLIC,
        Key: key,
      }),
    );
  },

  /** Path the browser uses; Caddy (or the dev server) maps /media to the public bucket. */
  publicUrl(key: string) {
    return `${env.MEDIA_BASE_URL}/${key}`;
  },
};
