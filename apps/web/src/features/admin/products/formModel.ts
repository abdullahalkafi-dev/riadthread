import { productInput, SIZE_PRESETS } from '@riad/shared';
import type { ProductCreateBody, ProductPatchBody } from '@/store/admin/productsApi';
import type { AdminProduct, Media } from '@/types/api';

/* -------------------------------------------------------------------------- */
/* The editor works on a "draft": a plain copy of the product that the forms   */
/* change freely. Saving turns the draft into exactly what the API accepts.    */
/* -------------------------------------------------------------------------- */

export interface ColourDraft {
  /** Created in the browser for new colours, so photos can be tagged before the first save. */
  id: string;
  name: string;
  hex: string;
  family: string;
  sku: string;
  stock: string;
  swatchMediaId: string | null;
  /** Display only: the resolved swatch file. */
  swatch: Media | null;
}

export interface MediaDraft {
  mediaId: string;
  colourId: string | null;
  alt: string;
  /** Display only: the resolved file. */
  media: Media | null;
}

export interface ProductDraft {
  name: string;
  slug: string;
  code: string;
  categoryId: string;
  collectionId: string;
  badge: string;
  order: number;
  featured: boolean;
  newArrival: boolean;
  summary: string;
  descriptionHtml: string;
  specs: AdminProduct['specs'];
  wholesale: AdminProduct['wholesale'];
  colours: ColourDraft[];
  sizes: AdminProduct['sizes'];
  sizeGuide: AdminProduct['sizeGuide'];
  media: MediaDraft[];
  overrides: AdminProduct['overrides'];
  relatedIds: string[];
  seo: AdminProduct['seo'];
}

/** A MongoDB-style id made in the browser (24 hex characters). */
export function newObjectId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function blankDraft(defaults: { categoryId: string; collectionId: string; order: number }): ProductDraft {
  return {
    name: '',
    slug: '',
    code: '',
    categoryId: defaults.categoryId,
    collectionId: defaults.collectionId,
    badge: '',
    order: defaults.order,
    featured: false,
    newArrival: false,
    summary: '',
    descriptionHtml: '',
    specs: { fabric: '', fabricType: '', origin: 'Morocco', care: '', fit: '' },
    wholesale: {
      moq: 12,
      packText: 'Pack of 6',
      packSize: 6,
      priceMode: 'hidden',
      belowMoq: 'allow',
      tiers: [{ range: '12 – 47 units', label: 'Trade price' }],
      tiersFootnote: '',
      priceLine: '',
    },
    colours: [],
    sizes: [],
    sizeGuide: [],
    media: [],
    overrides: { dispatch: '', samples: '', shipText: '' },
    relatedIds: [],
    seo: { title: '', description: '' },
  };
}

export function toDraft(p: AdminProduct): ProductDraft {
  return {
    name: p.name,
    slug: p.slug,
    code: p.code,
    categoryId: p.categoryId,
    collectionId: p.collectionId,
    badge: p.badge,
    order: p.order,
    featured: p.featured,
    newArrival: p.newArrival,
    summary: p.summary,
    descriptionHtml: p.descriptionHtml,
    specs: { ...p.specs },
    wholesale: { ...p.wholesale, tiers: p.wholesale.tiers.map((t) => ({ ...t })) },
    colours: p.colours.map((c) => ({ ...c })),
    sizes: p.sizes.map((s) => ({ ...s })),
    sizeGuide: p.sizeGuide.map((r) => ({ ...r })),
    media: p.media.map((m) => ({ ...m })),
    overrides: { ...p.overrides },
    relatedIds: [...p.relatedIds],
    seo: { ...p.seo },
  };
}

/* ------------------------------ to the API ------------------------------- */

/** Size guide rows always follow the sizes: one row per size, in the same order. */
export function guideRows(draft: Pick<ProductDraft, 'sizes' | 'sizeGuide'>): AdminProduct['sizeGuide'] {
  return draft.sizes.map((s) => draft.sizeGuide.find((r) => r.size === s.label) ?? { size: s.label, chest: '', length: '', uk: '' });
}

function fields(d: ProductDraft) {
  return {
    name: d.name.trim(),
    code: d.code.trim(),
    categoryId: d.categoryId,
    collectionId: d.collectionId,
    badge: d.badge as ProductCreateBody['badge'],
    order: d.order,
    featured: d.featured,
    newArrival: d.newArrival,
    summary: d.summary,
    descriptionHtml: d.descriptionHtml,
    specs: d.specs,
    wholesale: {
      moq: d.wholesale.moq,
      packText: d.wholesale.packText,
      packSize: d.wholesale.packSize,
      priceMode: d.wholesale.priceMode,
      belowMoq: d.wholesale.belowMoq,
      tiers: d.wholesale.tiers.filter((t) => t.range.trim() || t.label.trim()),
    },
    colours: d.colours.map((c) => ({
      _id: c.id,
      name: c.name.trim(),
      hex: c.hex,
      family: c.family as NonNullable<ProductCreateBody['colours']>[number]['family'],
      sku: c.sku,
      stock: c.stock as NonNullable<ProductCreateBody['colours']>[number]['stock'],
      swatchMediaId: c.swatchMediaId,
    })),
    sizes: d.sizes,
    sizeGuide: guideRows(d),
    media: d.media.map((m) => ({ mediaId: m.mediaId, colourId: m.colourId, alt: m.alt.trim() })),
    overrides: d.overrides,
    relatedIds: d.relatedIds,
    seo: d.seo,
  } satisfies ProductCreateBody;
}

/** Everything the API needs to create the product. The slug is only sent when it was typed by hand. */
export function createBody(d: ProductDraft): ProductCreateBody {
  return { ...fields(d), ...(d.slug.trim() ? { slug: d.slug.trim() } : {}) };
}

/**
 * Only the fields that differ from the saved product. The API treats PATCH as a
 * true partial, so untouched fields are never overwritten by a stale copy.
 */
export function patchBody(saved: ProductDraft, d: ProductDraft): ProductPatchBody {
  const before = fields(saved);
  const after = fields(d);
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(after) as Array<keyof typeof after>) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) patch[key] = after[key];
  }
  if (d.slug.trim() && d.slug.trim() !== saved.slug) patch.slug = d.slug.trim();
  return patch as ProductPatchBody;
}

export const isDirty = (saved: ProductDraft, d: ProductDraft) => Object.keys(patchBody(saved, d)).length > 0;

/* ----------------------------- client checks ----------------------------- */

export type FieldErrors = Record<string, string>;

/** Runs the same schema as the API, so the form shows what the server would reject. */
export function validateDraft(d: ProductDraft): FieldErrors {
  const result = productInput.safeParse(createBody(d));
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] ??= issue.message;
  }
  return errors;
}

/** Which editor tab a field belongs to, so errors can point at the right place. */
export function tabOfField(path: string): ProductTab {
  const head = path.split('.')[0] ?? '';
  if (['summary', 'descriptionHtml', 'specs', 'overrides'].includes(head)) return 'description';
  if (['colours', 'sizes', 'sizeGuide'].includes(head)) return 'variants';
  if (head === 'media') return 'media';
  if (head === 'wholesale') return 'wholesale';
  if (['seo', 'relatedIds'].includes(head)) return 'seo';
  return 'basics';
}

export const PRODUCT_TABS = [
  { key: 'basics', label: 'Basics' },
  { key: 'description', label: 'Description & specs' },
  { key: 'variants', label: 'Colours & sizes' },
  { key: 'media', label: 'Media' },
  { key: 'wholesale', label: 'Wholesale' },
  { key: 'seo', label: 'SEO & related' },
] as const;
export type ProductTab = (typeof PRODUCT_TABS)[number]['key'];

/** Typical measurements offered as a starting point when a size is added. */
export const GUIDE_DEFAULTS: Record<string, [string, string, string]> = {
  S: ['104', '138', '8–10'],
  M: ['110', '141', '12–14'],
  L: ['116', '144', '16–18'],
  XL: ['122', '147', '20–22'],
  XXL: ['128', '150', '24–26'],
};

export const SIZE_PRESET_NAMES = Object.keys(SIZE_PRESETS);
