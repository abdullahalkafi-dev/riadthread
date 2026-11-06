import type { Types } from 'mongoose';
import { publishChecks, type PublishCheck } from '@riad/shared';
import type { MediaDto } from '../media/media.dto';
import type { ProductDoc } from './product.model';

export type MediaWithAlt = MediaDto & { alt: string };

const id = (v: Types.ObjectId | string | null | undefined) => (v ? String(v) : null);

/** Admin: the full product with every referenced file resolved. */
export function toAdminProductDto(p: ProductDoc, media: Map<string, MediaDto>) {
  const mediaType = (mid: string) => media.get(mid)?.type;
  const checks: PublishCheck[] = publishChecks(
    {
      name: p.name,
      code: p.code,
      categoryId: id(p.categoryId) ?? undefined,
      colours: p.colours.map((c) => ({ swatchMediaId: id(c.swatchMediaId) })),
      sizes: p.sizes,
      media: p.media.map((m) => ({ mediaId: String(m.mediaId), alt: m.alt ?? '' })),
      wholesale: { moq: p.wholesale.moq, packText: p.wholesale.packText },
    },
    mediaType,
  );
  // A file that is still processing, or failed, must not go live.
  const notReady = [...p.media.map((m) => String(m.mediaId)), ...p.colours.map((c) => id(c.swatchMediaId))]
    .filter((v): v is string => !!v)
    .filter((mid) => media.get(mid)?.status !== 'ready').length;
  if (notReady > 0) {
    checks.push({ key: 'ready', label: `${notReady} file${notReady > 1 ? 's are' : ' is'} still processing or failed`, ok: false, tab: 'media' });
  }

  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    code: p.code,
    categoryId: String(p.categoryId),
    collectionId: String(p.collectionId),
    badge: p.badge,
    status: p.status,
    order: p.order,
    featured: p.featured,
    newArrival: p.newArrival,
    summary: p.summary,
    descriptionHtml: p.descriptionHtml,
    specs: p.specs,
    wholesale: p.wholesale,
    colours: p.colours.map((c) => ({
      id: String(c._id),
      name: c.name,
      hex: c.hex,
      family: c.family,
      sku: c.sku,
      stock: c.stock,
      swatchMediaId: id(c.swatchMediaId),
      swatch: c.swatchMediaId ? (media.get(String(c.swatchMediaId)) ?? null) : null,
    })),
    sizes: p.sizes,
    sizeGuide: p.sizeGuide,
    media: p.media.map((m) => ({
      mediaId: String(m.mediaId),
      colourId: id(m.colourId),
      alt: m.alt ?? '',
      media: media.get(String(m.mediaId)) ?? null,
    })),
    overrides: p.overrides,
    relatedIds: p.relatedIds.map(String),
    seo: p.seo,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    checks,
    ready: checks.every((c) => c.ok),
  };
}

/** Public card: what the catalogue, home page and related lists need. */
export function toCardDto(
  p: ProductDoc,
  media: Map<string, MediaDto>,
  tax: { category?: { slug: string; name: string }; collection?: { slug: string; name: string } },
) {
  const withAlt = (ref?: { mediaId: Types.ObjectId; alt: string }): MediaWithAlt | null => {
    const m = ref ? media.get(String(ref.mediaId)) : undefined;
    return m && m.status === 'ready' ? { ...m, alt: ref!.alt || p.name } : null;
  };
  const images = p.media.filter((m) => media.get(String(m.mediaId))?.type === 'image');
  const cover = withAlt(images[0]);
  const hover = withAlt(images[1]);

  return {
    id: String(p._id),
    slug: p.slug,
    code: p.code,
    name: p.name,
    badge: p.badge,
    summary: p.summary,
    moq: p.wholesale.moq,
    packText: p.wholesale.packText,
    newArrival: p.newArrival,
    featured: p.featured,
    category: tax.category ?? null,
    collection: tax.collection ?? null,
    cover,
    hover,
    // Each colour dot swaps the card image: its own tagged photo, else its swatch, else the cover.
    colours: p.colours.map((c) => {
      const tagged = images.find((m) => String(m.colourId) === String(c._id));
      const swatch = c.swatchMediaId ? media.get(String(c.swatchMediaId)) : undefined;
      return {
        id: String(c._id),
        name: c.name,
        hex: c.hex,
        family: c.family,
        image: withAlt(tagged) ?? (swatch && swatch.status === 'ready' ? { ...swatch, alt: `${p.name} in ${c.name}` } : cover),
      };
    }),
  };
}

/** Every media id a card needs, so one query can load them all. */
export function cardMediaIds(p: ProductDoc): string[] {
  return [...p.media.map((m) => String(m.mediaId)), ...p.colours.map((c) => id(c.swatchMediaId)).filter((v): v is string => !!v)];
}
