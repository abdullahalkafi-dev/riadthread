import { storage } from '../../lib/storage';
import type { MediaDoc } from './media.model';

export interface MediaVariantDto {
  width: number;
  height: number;
  format: 'webp' | 'avif' | 'jpg';
  url: string;
}

export interface MediaDto {
  id: string;
  type: string;
  status: string;
  error: string | null;
  mime: string;
  bytes: number;
  originalName: string | null;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  /** Largest available image, ready to use as a plain src. */
  url: string | null;
  /** Responsive renditions for srcset / <picture>. */
  variants: MediaVariantDto[];
  posterUrl: string | null;
  blurDataUrl: string | null;
  createdAt: Date;
}

/** Pure mapping from a stored document, so building a list never needs another query. */
export function toMediaDto(m: MediaDoc): MediaDto {
  const variants = (m.variants ?? []).map((v) => ({
    width: v.width,
    height: v.height,
    format: v.format as MediaVariantDto['format'],
    url: storage.publicUrl(v.key),
  }));
  const largestWebp = [...variants].filter((v) => v.format === 'webp').sort((a, b) => b.width - a.width)[0];

  return {
    id: String(m._id),
    type: m.type,
    status: m.status ?? 'processing',
    error: m.error ?? null,
    mime: m.mime,
    bytes: m.bytes,
    originalName: m.originalName ?? null,
    width: m.width ?? null,
    height: m.height ?? null,
    durationSec: m.durationSec ?? null,
    url: m.type === 'image' ? (largestWebp?.url ?? null) : m.fileKey ? storage.publicUrl(m.fileKey) : null,
    variants,
    posterUrl: m.posterKey ? storage.publicUrl(m.posterKey) : null,
    blurDataUrl: m.blurDataUrl ?? null,
    createdAt: m.createdAt,
  };
}
