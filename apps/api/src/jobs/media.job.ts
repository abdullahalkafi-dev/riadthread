import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../config/logger';
import { processImage } from '../lib/images';
import { registerHandler, QUEUES } from '../lib/queue';
import { storage } from '../lib/storage';
import { extractPoster, ffmpegAvailable, probeDuration } from '../lib/video';
import { UPLOAD_LIMITS } from '@riad/shared';
import { Media } from '../modules/media/media.model';

const EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'model/gltf-binary': 'glb',
  'application/pdf': 'pdf',
};

/**
 * Turns a private original into public, optimised files.
 * Images become responsive WebP/AVIF/JPEG; video, 3D and PDF are published as-is
 * (video also gets a poster frame when ffmpeg is installed).
 * A failure is recorded on the media document so the dashboard can offer a retry.
 */
export async function processMedia(mediaId: string): Promise<void> {
  const media = await Media.findById(mediaId);
  if (!media) return;
  const tmp = await mkdtemp(join(tmpdir(), 'riad-media-'));

  try {
    const original = await storage.getPrivate(media.originalKey);

    if (media.type === 'image') {
      const result = await processImage(original);
      const variants = [];
      for (const v of result.variants) {
        const key = `images/${media._id}/${v.width}.${v.format}`;
        await storage.putPublic(key, v.buffer, v.mime);
        variants.push({ width: v.width, height: v.height, format: v.format, key, bytes: v.buffer.length });
      }
      media.set({ width: result.width, height: result.height, variants, blurDataUrl: result.blurDataUrl });
    } else {
      const ext = EXT[media.mime] ?? 'bin';
      const fileKey = `${media.type}s/${media._id}/file.${ext}`;

      if (media.type === 'video') {
        const input = join(tmp, `input.${ext}`);
        await writeFile(input, original);
        const duration = await probeDuration(input);
        if (duration !== null && duration > UPLOAD_LIMITS.video.maxSeconds) {
          throw new Error(`The video is ${duration}s long. The limit is ${UPLOAD_LIMITS.video.maxSeconds}s`);
        }
        if (duration !== null) media.durationSec = duration;

        if (await ffmpegAvailable()) {
          const posterPath = join(tmp, 'poster.jpg');
          await extractPoster(input, posterPath);
          const posterKey = `videos/${media._id}/poster.jpg`;
          await storage.putPublic(posterKey, await readFile(posterPath), 'image/jpeg');
          media.posterKey = posterKey;
        } else {
          logger.warn({ mediaId }, 'ffmpeg is not installed: no poster generated for this video');
        }
      }

      await storage.putPublic(fileKey, original, media.mime);
      media.fileKey = fileKey;
    }

    media.status = 'ready';
    media.error = undefined as never;
    await media.save();
    logger.info({ mediaId, type: media.type }, 'Media processed');
  } catch (err) {
    media.status = 'failed';
    media.error = err instanceof Error ? err.message.slice(0, 300) : 'Processing failed';
    await media.save();
    logger.warn({ mediaId, err }, 'Media processing failed');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

registerHandler(QUEUES.media, async (job) => {
  if (job.name === 'process') await processMedia(String(job.data.mediaId));
});
