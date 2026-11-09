import type { z } from 'zod';
import type { blockData, PublishCheck, SettingsInput } from '@riad/shared';

/** Response envelope used by every API route. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PageMeta & Record<string, unknown>;
}
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface ApiErrorBody {
  success: false;
  message: string;
  errorSources: Array<{ path: string; message: string }>;
}

/* ---------------------------------- media --------------------------------- */

export interface MediaVariant {
  width: number;
  height: number;
  format: 'webp' | 'avif' | 'jpg';
  url: string;
}
export interface Media {
  id: string;
  type: 'image' | 'video' | 'model' | 'document';
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
  mime: string;
  bytes: number;
  originalName: string | null;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  /** Largest rendition, usable as a plain src. */
  url: string | null;
  variants: MediaVariant[];
  posterUrl: string | null;
  blurDataUrl: string | null;
  createdAt: string;
}
export type MediaWithAlt = Media & { alt: string };

/* -------------------------------- taxonomy -------------------------------- */

export interface TaxonomyRef {
  slug: string;
  name: string;
}
export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
  image: Media | null;
  /** Admin only. */
  productCount?: number;
  publishedCount: number;
}

/* -------------------------------- products -------------------------------- */

export interface ProductCardColour {
  id: string;
  name: string;
  hex: string;
  family: string;
  image: MediaWithAlt | null;
}
export interface ProductCard {
  id: string;
  slug: string;
  code: string;
  name: string;
  badge: string;
  summary: string;
  moq: number;
  packText: string;
  newArrival: boolean;
  featured: boolean;
  category: TaxonomyRef | null;
  collection: TaxonomyRef | null;
  cover: MediaWithAlt | null;
  hover: MediaWithAlt | null;
  colours: ProductCardColour[];
}

export interface ProductDetail {
  id: string;
  slug: string;
  code: string;
  name: string;
  badge: string;
  summary: string;
  descriptionHtml: string;
  category: TaxonomyRef | null;
  collection: TaxonomyRef | null;
  specs: { fabric: string; fabricType: string; origin: string; care: string; fit: string };
  wholesale: {
    moq: number;
    packText: string;
    packSize: number;
    priceMode: 'hidden' | 'from' | 'tiers';
    belowMoq: 'allow' | 'block';
    tiers: Array<{ range: string; label: string }>;
    tiersFootnote: string;
    priceLine: string;
  };
  colours: Array<{ id: string; name: string; hex: string; family: string; stock: string; swatch: Media | null }>;
  sizes: Array<{ label: string; available: boolean }>;
  sizeGuide: Array<{ size: string; chest: string; length: string; uk: string }>;
  media: Array<{ colourId: string | null; alt: string; media: Media }>;
  info: { dispatch: string; samples: string; shipText: string };
  related: ProductCard[];
  seo: { title: string; description: string; canonicalPath: string; image: string | null };
  updatedAt: string;
}

export interface ProductFilters {
  categories: Array<{ slug: string; name: string; count: number }>;
  collections: Array<{ slug: string; name: string; count: number }>;
  colours: Array<{ name: string; count: number }>;
  fabrics: Array<{ name: string; count: number }>;
}

/** The admin editor and list shapes come from the API as-is. */
export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  code: string;
  badge: string;
  status: 'draft' | 'published' | 'archived';
  order: number;
  category: string | null;
  collection: string | null;
  moq: number;
  packText: string;
  colours: Array<{ name: string; hex: string }>;
  sizeCount: number;
  cover: Media | null;
  enquiryCount: number;
  updatedAt: string;
}
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  code: string;
  categoryId: string;
  collectionId: string;
  badge: string;
  status: 'draft' | 'published' | 'archived';
  order: number;
  featured: boolean;
  newArrival: boolean;
  summary: string;
  descriptionHtml: string;
  specs: { fabric: string; fabricType: string; origin: string; care: string; fit: string };
  wholesale: ProductDetail['wholesale'];
  colours: Array<{
    id: string;
    name: string;
    hex: string;
    family: string;
    sku: string;
    stock: string;
    swatchMediaId: string | null;
    swatch: Media | null;
  }>;
  sizes: Array<{ label: string; available: boolean }>;
  sizeGuide: Array<{ size: string; chest: string; length: string; uk: string }>;
  media: Array<{ mediaId: string; colourId: string | null; alt: string; media: Media | null }>;
  overrides: { dispatch: string; samples: string; shipText: string };
  relatedIds: string[];
  seo: { title: string; description: string };
  publishedAt: string | null;
  updatedAt: string;
  checks: PublishCheck[];
  ready: boolean;
}

/* ------------------------------ site / content ----------------------------- */

export type BlockKey = keyof typeof blockData;
export type BlockData<K extends BlockKey> = z.infer<(typeof blockData)[K]>;

export interface PublicSettings {
  business: SettingsInput['business'];
  whatsapp: SettingsInput['whatsapp'];
  social: SettingsInput['social'];
  tracking: SettingsInput['tracking'];
  productDefaults: SettingsInput['productDefaults'];
  lineSheetEnabled: boolean;
  lineSheetUrl: string | null;
}
export interface SitePayload {
  settings: PublicSettings;
  /** Ordered, visible home sections. */
  layout: string[];
  blocks: { [K in BlockKey]?: BlockData<K> };
  media: Record<string, Media>;
}
export interface PageContent {
  key: string;
  title: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string | null;
}

/* -------------------------------- enquiries -------------------------------- */

export type EmailState = 'pending' | 'sent' | 'failed' | 'skipped';
export interface EnquiryRow {
  id: string;
  ref: string;
  kind: 'product' | 'general' | 'line_sheet';
  contact: { name: string; business: string; city: string; email: string; phone: string };
  status: 'new' | 'contacted' | 'discussion' | 'quote' | 'confirmed' | 'lost' | 'spam';
  unread: boolean;
  score: { level: 'hot' | 'warm' | 'cold'; factors: string[] };
  itemCount: number;
  qtyTotal: number;
  thumbs: string[];
  source: string | null;
  followUpAt: string | null;
  confirmedAt: string | null;
  emailState?: { confirmation?: EmailState; notification?: EmailState };
  createdAt: string;
}
export interface EnquiryDetail extends EnquiryRow {
  message: string;
  contact: EnquiryRow['contact'] & { type: string; website: string };
  preferredContact: string | null;
  deliveryBy: string | null;
  estimatedQty: number | null;
  entryPoint: string | null;
  pageUrl: string | null;
  items: Array<{
    productId: string;
    name: string;
    code: string;
    slug: string;
    colour: string | null;
    sizes: Array<{ label?: string; qty?: number }>;
    qty: number;
    thumb: string | null;
  }>;
  /** null when the visitor did not accept tracking. */
  journey: Array<{ t?: string; m?: string; k?: string; at?: number }> | null;
  trackingAccepted: boolean;
  sourceDetail: Record<string, string | undefined> | null;
  notes: Array<{ id: string; text: string; author: string; at: string }>;
  activity: Array<{ type?: string; text?: string; at?: string }>;
}

export interface Overview {
  generatedAt: string;
  counts: Record<string, number>;
  newCount: number;
  openLeads: number;
  confirmedThisMonth: number;
  hotOpen: number;
  needsAttention: EnquiryRow[];
  latest: EnquiryRow[];
  series: Array<{ date: string; count: number }>;
  topProducts: Array<{ productId: string; name: string; thumb: string | null; enquiries: number }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  lastLoginAt: string | null;
}
