export const ENQUIRY_STATUSES = [
  'new',
  'contacted',
  'discussion',
  'quote',
  'confirmed',
  'lost',
  'spam',
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** Human labels used by the dashboard and in e-mails. */
export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  discussion: 'In discussion',
  quote: 'Quote sent',
  confirmed: 'Confirmed',
  lost: 'Lost',
  spam: 'Spam',
};

export const ENQUIRY_KINDS = ['product', 'general', 'line_sheet'] as const;
export const ENTRY_POINTS = [
  'product_page',
  'quick_enquiry',
  'enquiry_list',
  'enquiry_page',
  'home',
  'line_sheet',
] as const;
export type EntryPoint = (typeof ENTRY_POINTS)[number];

export const BUSINESS_TYPES = [
  'Boutique',
  'Online store',
  'Mosque or centre shop',
  'Distributor',
  'Other',
] as const;
export const PREFERRED_CONTACT = ['whatsapp', 'phone', 'email'] as const;

export const LEAD_LEVELS = ['hot', 'warm', 'cold'] as const;
export type LeadLevel = (typeof LEAD_LEVELS)[number];

export const PRODUCT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const BADGES = ['', 'New arrival', 'New', 'Bestseller', 'Low stock', 'Gift set'] as const;
export const STOCK_STATUSES = ['In stock', 'Low stock', 'Pre-order', 'Out of stock'] as const;
export const COLOUR_FAMILIES = [
  'Green',
  'Blue',
  'Neutral',
  'Black',
  'Purple',
  'Pink',
  'Red',
  'Brown',
  'Gold',
] as const;
export const PRICE_MODES = ['hidden', 'from', 'tiers'] as const;
export const BELOW_MOQ = ['allow', 'block'] as const;

export const SIZE_PRESETS: Record<string, string[]> = {
  'S–XXL': ['S', 'M', 'L', 'XL', 'XXL'],
  'M–XXL': ['M', 'L', 'XL', 'XXL'],
  'S–XL': ['S', 'M', 'L', 'XL'],
  'One size': ['One size'],
  'Shoes 38–45': ['38–39', '40–41', '42–43', '44–45'],
};

export const MEDIA_TYPES = ['image', 'video', 'model', 'document'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
export const MEDIA_STATUSES = ['processing', 'ready', 'failed'] as const;

/** Upload rules, enforced on the server from the real file bytes. */
export const UPLOAD_LIMITS = {
  image: {
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxBytes: 8 * 1024 * 1024,
    minShortSide: 1000,
  },
  video: { mimes: ['video/mp4', 'video/webm'], maxBytes: 150 * 1024 * 1024, maxSeconds: 180 },
  model: { mimes: ['model/gltf-binary'], maxBytes: 25 * 1024 * 1024 },
  document: { mimes: ['application/pdf'], maxBytes: 15 * 1024 * 1024 },
} as const;

/** Widths generated for every image. */
export const IMAGE_WIDTHS = [320, 640, 960, 1200, 1600] as const;

export const EVENT_TYPES = [
  'page_view',
  'page_engaged',
  'product_view',
  'variant_select',
  'media_open',
  'video_progress',
  'list_add',
  'list_remove',
  'form_open',
  'form_submit',
  'whatsapp_click',
  'search',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const CONTENT_BLOCK_KEYS = [
  'announcement',
  'hero',
  'ramadan',
  'trust',
  'steps',
  'faq',
  'supply',
  'heritage',
  'craft',
  'lookbook',
  'brandFilm',
] as const;
export const PAGE_KEYS = ['about', 'contact', 'faq-page', 'privacy', 'cookies', 'terms'] as const;

/** Homepage sections, in the order used by the design. */
export const HOME_SECTIONS = [
  'hero',
  'trust',
  'shopByCategory',
  'brandFilm',
  'showcase',
  'heritage',
  'craft',
  'lookbook',
  'steps',
  'supply',
  'faq',
  'lineSheet',
  'enquiry',
] as const;

export const LIMITS = {
  journeySteps: 30,
  eventBatch: 50,
  enquiryItems: 30,
  pageSize: 100,
  relatedProducts: 4,
} as const;
