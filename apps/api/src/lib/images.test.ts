import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { processImage, readImageInfo } from './images';

async function sample(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: '#b9603f' } })
    .jpeg()
    .toBuffer();
}

describe('processImage', () => {
  it('creates WebP, AVIF and JPEG renditions and never upscales', async () => {
    const result = await processImage(await sample(1000, 1400));
    const widths = new Set(result.variants.map((v) => v.width));

    // 320, 640 and 960 fit inside a 1000px source; 1200 and 1600 would be upscales.
    expect([...widths].sort((a, b) => a - b)).toEqual([320, 640, 960]);
    for (const format of ['webp', 'avif', 'jpg']) {
      expect(result.variants.filter((v) => v.format === format)).toHaveLength(3);
    }
    expect(result.blurDataUrl.startsWith('data:image/webp;base64,')).toBe(true);
  }, 30_000);

  it('keeps a single small rendition for a tiny source', async () => {
    const result = await processImage(await sample(200, 300));
    expect(result.variants.every((v) => v.width <= 200)).toBe(true);
    expect(result.variants.length).toBeGreaterThan(0);
  }, 30_000);
});

describe('readImageInfo', () => {
  it('reports real dimensions', async () => {
    await expect(readImageInfo(await sample(800, 600))).resolves.toEqual({ width: 800, height: 600 });
  });

  it('rejects data that is not an image', async () => {
    await expect(readImageInfo(Buffer.from('definitely not an image'))).rejects.toThrow();
  });
});
