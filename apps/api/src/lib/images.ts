import sharp, { type Sharp } from 'sharp';
import { IMAGE_WIDTHS } from '@riad/shared';

export type ImageFormat = 'webp' | 'avif' | 'jpg';

export interface ImageVariant {
  width: number;
  height: number;
  format: ImageFormat;
  mime: string;
  buffer: Buffer;
}

export interface ProcessedImage {
  width: number;
  height: number;
  variants: ImageVariant[];
  /** A tiny blurred preview used while the real image loads. */
  blurDataUrl: string;
}

const MIME: Record<ImageFormat, string> = { webp: 'image/webp', avif: 'image/avif', jpg: 'image/jpeg' };

export interface ImageInfo {
  width: number;
  height: number;
}

/** Reads the real dimensions, applying EXIF orientation. Throws if the file is not a decodable image. */
export async function readImageInfo(input: Buffer | string): Promise<ImageInfo> {
  const meta = await sharp(input, { limitInputPixels: 100_000_000 }).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;
  if (!width || !height) throw new Error('The image could not be read');
  return { width, height };
}

/**
 * Produces responsive WebP, AVIF and JPEG renditions. Widths larger than the
 * source are skipped (never upscaled); EXIF data such as GPS is dropped.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const { width, height } = await readImageInfo(input);
  const widths = IMAGE_WIDTHS.filter((w) => w <= width);
  if (widths.length === 0) widths.push(IMAGE_WIDTHS[0]);

  const base = sharp(input, { limitInputPixels: 100_000_000 }).rotate();
  const variants: ImageVariant[] = [];

  for (const w of widths) {
    const target = Math.min(w, width);
    const resized = base.clone().resize({ width: target, withoutEnlargement: true });
    const info = async (format: ImageFormat, pipeline: Sharp) => {
      const { data, info: i } = await pipeline.toBuffer({ resolveWithObject: true });
      variants.push({ width: i.width, height: i.height, format, mime: MIME[format], buffer: data });
    };
    await info('webp', resized.clone().webp({ quality: 80 }));
    await info('avif', resized.clone().avif({ quality: 55, effort: 3 }));
    await info('jpg', resized.clone().jpeg({ quality: 82, mozjpeg: true }));
  }

  const blur = await base.clone().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  return { width, height, variants, blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}` };
}
