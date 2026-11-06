import { fileTypeFromFile } from 'file-type';
import { closeSync, openSync, readSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { UPLOAD_LIMITS, type MediaType } from '@riad/shared';
import { logger } from '../../config/logger';
import { readImageInfo } from '../../lib/images';
import { enqueue, QUEUES } from '../../lib/queue';
import { storage } from '../../lib/storage';
import { AppError } from '../../utils/AppError';
import { escapeRegex } from '../../utils/text';
import { toMediaDto, type MediaDto } from './media.dto';
import { Media, type MediaDoc } from './media.model';
import { isMediaReferenced } from './media.refs';

/** Reads the first bytes: glTF and PDF are identified by their magic numbers. */
function sniff(path: string): 'model/gltf-binary' | 'application/pdf' | null {
  const fd = openSync(path, 'r');
  try {
    const head = Buffer.alloc(8);
    readSync(fd, head, 0, 8, 0);
    if (head.subarray(0, 4).toString('latin1') === 'glTF') return 'model/gltf-binary';
    if (head.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
    return null;
  } finally {
    closeSync(fd);
  }
}

function kindOf(mime: string): MediaType | null {
  if ((UPLOAD_LIMITS.image.mimes as readonly string[]).includes(mime)) return 'image';
  if ((UPLOAD_LIMITS.video.mimes as readonly string[]).includes(mime)) return 'video';
  if ((UPLOAD_LIMITS.model.mimes as readonly string[]).includes(mime)) return 'model';
  if ((UPLOAD_LIMITS.document.mimes as readonly string[]).includes(mime)) return 'document';
  return null;
}

export interface UploadedFile {
  path: string;
  originalname: string;
  size: number;
}

/**
 * Validates an upload from its real bytes, stores the original privately and
 * queues processing. The temporary file is always removed.
 */
export async function createFromUpload(file: UploadedFile, userId: string): Promise<MediaDto> {
  try {
    const detected = (await fileTypeFromFile(file.path))?.mime ?? sniff(file.path);
    const kind = detected ? kindOf(detected) : null;
    if (!detected || !kind) {
      throw AppError.unprocessable('That file type is not supported. Use JPG, PNG, WebP, AVIF, MP4, WebM, GLB or PDF');
    }

    const limits = UPLOAD_LIMITS[kind];
    if (file.size > limits.maxBytes) {
      throw AppError.unprocessable(`That file is too large. The limit is ${Math.round(limits.maxBytes / 1024 / 1024)} MB`);
    }

    let dimensions: { width: number; height: number } | undefined;
    if (kind === 'image') {
      try {
        dimensions = await readImageInfo(file.path);
      } catch {
        throw AppError.unprocessable('That image could not be read. It may be damaged');
      }
      if (Math.min(dimensions.width, dimensions.height) < UPLOAD_LIMITS.image.minShortSide) {
        throw AppError.unprocessable(
          `The image is too small (${dimensions.width}×${dimensions.height}). The shortest side must be at least ${UPLOAD_LIMITS.image.minShortSide}px`,
        );
      }
    }

    const media = await Media.create({
      type: kind,
      status: 'processing',
      originalName: file.originalname.slice(0, 200),
      mime: detected,
      bytes: file.size,
      originalKey: 'pending',
      ...(dimensions ?? {}),
      createdBy: userId,
    });
    const originalKey = `originals/${media._id}`;
    try {
      await storage.putPrivate(originalKey, file.path, detected);
    } catch (err) {
      await media.deleteOne();
      throw err;
    }
    media.originalKey = originalKey;
    await media.save();

    await enqueue(QUEUES.media, 'process', { mediaId: String(media._id) }, { jobId: `media-${media._id}` });
    return toMediaDto(media.toObject() as unknown as MediaDoc);
  } finally {
    await unlink(file.path).catch(() => undefined);
  }
}

export async function retryProcessing(id: string) {
  const media = await Media.findById(id);
  if (!media) throw AppError.notFound('Media not found');
  if (media.status !== 'failed') throw AppError.conflict('Only failed uploads can be retried');
  media.status = 'processing';
  media.error = undefined as never;
  await media.save();
  // A fresh job id is required: BullMQ ignores a job id it has already seen.
  await enqueue(QUEUES.media, 'process', { mediaId: id }, { jobId: `media-${id}-${Date.now()}` });
  return toMediaDto(media.toObject() as unknown as MediaDoc);
}

export async function listMedia(q: { type?: string; status?: string; q?: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = {};
  if (q.type) filter.type = q.type;
  if (q.status) filter.status = q.status;
  if (q.q) filter.originalName = new RegExp(escapeRegex(q.q), 'i');
  const [docs, total] = await Promise.all([
    Media.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Media.countDocuments(filter),
  ]);
  return { items: docs.map((d) => toMediaDto(d as unknown as MediaDoc)), total };
}

export async function getMedia(id: string) {
  const doc = await Media.findById(id).lean();
  if (!doc) throw AppError.notFound('Media not found');
  return toMediaDto(doc as unknown as MediaDoc);
}

/**
 * Loads many media documents with ONE query and returns them keyed by id.
 * Every module that needs images uses this instead of looking them up one by one.
 */
export async function loadMedia(ids: Array<string | null | undefined>): Promise<Map<string, MediaDto>> {
  const unique = [...new Set(ids.filter((v): v is string => !!v))];
  if (unique.length === 0) return new Map();
  const docs = await Media.find({ _id: { $in: unique } }).lean();
  return new Map(docs.map((d) => [String(d._id), toMediaDto(d as unknown as MediaDoc)]));
}

export async function deleteMedia(id: string) {
  const media = await Media.findById(id);
  if (!media) throw AppError.notFound('Media not found');
  if (await isMediaReferenced(id)) {
    throw AppError.conflict('This file is used on the website. Replace it before deleting');
  }
  const keys = [
    ...(media.variants ?? []).map((v) => v.key),
    ...(media.fileKey ? [media.fileKey] : []),
    ...(media.posterKey ? [media.posterKey] : []),
  ];
  await Promise.allSettled([
    storage.remove('private', media.originalKey),
    ...keys.map((k) => storage.remove('public', k)),
  ]);
  await media.deleteOne();
  logger.info({ id }, 'Media deleted');
}
