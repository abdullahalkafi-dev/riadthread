import { z } from 'zod';
import {
  BADGES,
  BELOW_MOQ,
  COLOUR_FAMILIES,
  LIMITS,
  PRICE_MODES,
  PRODUCT_STATUSES,
  STOCK_STATUSES,
} from '../constants';
import { objectId, paginationQuery, slugSchema } from './common';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour');

export const colourSchema = z.object({
  /** Clients may supply an id so media can be tagged before the first save. */
  _id: objectId.optional(),
  name: z.string().trim().min(1).max(60),
  hex,
  family: z.enum(COLOUR_FAMILIES),
  sku: z.string().trim().max(60).default(''),
  stock: z.enum(STOCK_STATUSES).default('In stock'),
  swatchMediaId: objectId.nullable().default(null),
});

export const sizeSchema = z.object({
  label: z.string().trim().min(1).max(20),
  available: z.boolean().default(true),
});

export const tierSchema = z.object({
  range: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(60),
});

export const sizeGuideRow = z.object({
  size: z.string().trim().max(20),
  chest: z.string().trim().max(20).default(''),
  length: z.string().trim().max(20).default(''),
  uk: z.string().trim().max(20).default(''),
});

export const mediaRefSchema = z.object({
  mediaId: objectId,
  /** null = shown for every colour. */
  colourId: objectId.nullable().default(null),
  alt: z.string().trim().max(200).default(''),
});

export const productInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  code: z.string().trim().min(2).max(40),
  categoryId: objectId,
  collectionId: objectId,
  badge: z.enum(BADGES).default(''),
  status: z.enum(PRODUCT_STATUSES).default('draft'),
  order: z.number().int().min(0).max(100000).default(0),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  summary: z.string().trim().max(400).default(''),
  descriptionHtml: z.string().max(50000).default(''),
  specs: z
    .object({
      fabric: z.string().trim().max(80).default(''),
      origin: z.string().trim().max(80).default('Morocco'),
      care: z.string().trim().max(200).default(''),
      fit: z.string().trim().max(200).default(''),
    })
    .default({ fabric: '', origin: 'Morocco', care: '', fit: '' }),
  wholesale: z
    .object({
      moq: z.number().int().min(1).max(100000).default(12),
      packText: z.string().trim().max(120).default(''),
      packSize: z.number().int().min(1).max(10000).default(6),
      priceMode: z.enum(PRICE_MODES).default('hidden'),
      belowMoq: z.enum(BELOW_MOQ).default('allow'),
      tiers: z.array(tierSchema).max(8).default([]),
    })
    .default({
      moq: 12,
      packText: '',
      packSize: 6,
      priceMode: 'hidden',
      belowMoq: 'allow',
      tiers: [],
    }),
  colours: z.array(colourSchema).max(24).default([]),
  sizes: z.array(sizeSchema).max(24).default([]),
  sizeGuide: z.array(sizeGuideRow).max(24).default([]),
  media: z.array(mediaRefSchema).max(40).default([]),
  overrides: z
    .object({
      dispatch: z.string().trim().max(120).default(''),
      samples: z.string().trim().max(120).default(''),
      shipText: z.string().trim().max(1500).default(''),
    })
    .default({ dispatch: '', samples: '', shipText: '' }),
  relatedIds: z.array(objectId).max(LIMITS.relatedProducts).default([]),
  seo: z
    .object({
      title: z.string().trim().max(120).default(''),
      description: z.string().trim().max(300).default(''),
    })
    .default({ title: '', description: '' }),
});
export const productUpdate = productInput.partial();
export type ProductInput = z.infer<typeof productInput>;

export const mediaOrderInput = z.object({
  /** Full list of media references in the desired order. */
  media: z.array(mediaRefSchema).max(40),
});

export const adminProductQuery = paginationQuery.extend({
  q: z.string().trim().max(80).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  categoryId: objectId.optional(),
  collectionId: objectId.optional(),
});

export const publicProductQuery = paginationQuery.extend({
  limit: z.coerce.number().int().min(1).max(48).default(24),
  category: slugSchema.optional(),
  collection: slugSchema.optional(),
  /** Comma separated colour families, e.g. "Green,Blue". */
  colour: z.string().trim().max(200).optional(),
  /** Comma separated fabric words, e.g. "Satin,Cotton". */
  fabric: z.string().trim().max(200).optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(['order', 'newest']).default('order'),
});

/* ------------------------------------------------------------------ */
/* Publish checklist: used by the API to block publishing and by the  */
/* dashboard to render the "Ready to publish?" panel.                 */
/* ------------------------------------------------------------------ */

export interface PublishCheckInput {
  name: string;
  code: string;
  categoryId?: string | undefined;
  colours: { swatchMediaId: string | null }[];
  sizes: unknown[];
  media: { mediaId: string; alt: string }[];
  wholesale: { moq: number; packText: string };
}

export interface PublishCheck {
  key: string;
  label: string;
  ok: boolean;
  tab: 'basics' | 'variants' | 'media' | 'wholesale';
}

export function publishChecks(
  p: PublishCheckInput,
  mediaTypeOf: (mediaId: string) => string | undefined,
): PublishCheck[] {
  const missingAlt = p.media.filter((m) => !m.alt.trim()).length;
  const first = p.media[0];
  return [
    {
      key: 'basics',
      label: 'Name, code and category',
      ok: !!(p.name.trim() && p.code.trim() && p.categoryId),
      tab: 'basics',
    },
    {
      key: 'cover',
      label: 'Cover image first in the media order',
      ok: !!first && mediaTypeOf(first.mediaId) === 'image',
      tab: 'media',
    },
    {
      key: 'alt',
      label: missingAlt
        ? `${missingAlt} media item${missingAlt > 1 ? 's' : ''} missing alt text`
        : 'Alt text on every media item',
      ok: missingAlt === 0,
      tab: 'media',
    },
    { key: 'colour', label: 'At least one colour variant', ok: p.colours.length > 0, tab: 'variants' },
    {
      key: 'swatch',
      label: 'Every colour has a swatch image',
      ok: p.colours.length > 0 && p.colours.every((c) => !!c.swatchMediaId),
      tab: 'variants',
    },
    { key: 'size', label: 'At least one size', ok: p.sizes.length > 0, tab: 'variants' },
    {
      key: 'moq',
      label: 'MOQ and pack info set',
      ok: p.wholesale.moq > 0 && !!p.wholesale.packText.trim(),
      tab: 'wholesale',
    },
  ];
}
