import type { ProductDetail } from '@/types/api';

export type GalleryItem = ProductDetail['media'][number];

/**
 * The photos and videos shown for a product, in the order set in the dashboard.
 * When a colour is chosen, photos tagged with that colour come first, then the
 * untagged ones, then photos of other colours. 3D files and documents are left
 * out: the page has no viewer for them.
 */
export function galleryFor(detail: Pick<ProductDetail, 'media'>, colourId: string | null): GalleryItem[] {
  const usable = detail.media.filter((m) => m.media.type === 'image' || m.media.type === 'video');
  if (!colourId) return usable;
  const rank = (m: GalleryItem) => (m.colourId === colourId ? 0 : m.colourId === null ? 1 : 2);
  // Array.sort is stable, so the dashboard order is kept inside each group.
  return [...usable].sort((a, b) => rank(a) - rank(b));
}

/** The best single picture for a colour: its own photo, else its swatch, else the first image. */
export function imageForColour(detail: ProductDetail, colourId: string | null): GalleryItem['media'] | null {
  const images = galleryFor(detail, colourId).filter((m) => m.media.type === 'image');
  const colour = detail.colours.find((c) => c.id === colourId);
  const tagged = images.find((m) => m.colourId === colourId);
  return tagged?.media ?? colour?.swatch ?? images[0]?.media ?? null;
}
