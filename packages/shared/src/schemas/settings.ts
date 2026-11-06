import { z } from 'zod';
import { CONTENT_BLOCK_KEYS, PAGE_KEYS } from '../constants';
import { objectId } from './common';

export const settingsInput = z.object({
  business: z.object({
    name: z.string().trim().max(120),
    email: z.string().trim().toLowerCase().email().max(200),
    phone: z.string().trim().max(40),
    address: z.string().trim().max(300).default(''),
  }),
  whatsapp: z.object({
    number: z.string().trim().max(30),
    template: z.string().trim().max(300),
  }),
  social: z
    .object({
      instagram: z.string().trim().max(200).default(''),
      tiktok: z.string().trim().max(200).default(''),
      facebook: z.string().trim().max(200).default(''),
    })
    .default({ instagram: '', tiktok: '', facebook: '' }),
  notifications: z.object({
    emails: z.array(z.string().trim().toLowerCase().email()).max(10),
    sendConfirmation: z.boolean(),
  }),
  tracking: z.object({
    banner: z.boolean(),
    journey: z.boolean(),
  }),
  productDefaults: z.object({
    dispatch: z.string().trim().max(120),
    samples: z.string().trim().max(120),
    priceLine: z.string().trim().max(120),
    shipText: z.string().trim().max(1500),
    tiersFootnote: z.string().trim().max(300),
  }),
  lineSheet: z.object({
    enabled: z.boolean(),
    mediaId: objectId.nullable(),
  }),
});
export type SettingsInput = z.infer<typeof settingsInput>;

const cta = z.object({ text: z.string().trim().max(60), href: z.string().trim().max(300) });
const item = z.object({
  title: z.string().trim().max(120),
  text: z.string().trim().max(500).default(''),
});

/** Typed data for every editable homepage block. */
export const blockData = {
  announcement: z.object({
    enabled: z.boolean(),
    message: z.string().trim().max(200),
    href: z.string().trim().max(300).default(''),
  }),
  hero: z.object({
    slides: z
      .array(
        z.object({
          title: z.string().trim().max(120),
          subtitle: z.string().trim().max(300).default(''),
          mediaId: objectId.nullable().default(null),
          cta: cta.optional(),
        }),
      )
      .max(4),
  }),
  ramadan: z.object({
    enabled: z.boolean(),
    heading: z.string().trim().max(120),
    text: z.string().trim().max(400).default(''),
    orderByDate: z.string().max(10).nullable().default(null),
    startDate: z.string().max(10).nullable().default(null),
  }),
  trust: z.object({ items: z.array(item).max(6) }),
  steps: z.object({ heading: z.string().trim().max(120).default(''), items: z.array(item).max(6) }),
  faq: z.object({
    items: z
      .array(z.object({ q: z.string().trim().max(200), a: z.string().trim().max(2000) }))
      .max(20),
  }),
  supply: z.object({ heading: z.string().trim().max(120).default(''), items: z.array(item).max(8) }),
  heritage: z.object({
    heading: z.string().trim().max(120),
    body: z.string().trim().max(2000),
    mediaId: objectId.nullable().default(null),
  }),
  craft: z.object({ heading: z.string().trim().max(120), items: z.array(item).max(8) }),
  lookbook: z.object({
    heading: z.string().trim().max(120),
    mediaIds: z.array(objectId).max(8).default([]),
  }),
  brandFilm: z.object({
    heading: z.string().trim().max(120),
    mediaId: objectId.nullable().default(null),
    posterMediaId: objectId.nullable().default(null),
  }),
} as const;

export const contentBlockInput = z.object({
  visible: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()),
});

export const homeLayoutInput = z.object({
  sections: z.array(z.object({ key: z.string().max(40), visible: z.boolean() })).max(20),
});

export const pageInput = z.object({
  title: z.string().trim().min(1).max(120),
  bodyHtml: z.string().max(60000),
  seoTitle: z.string().trim().max(120).default(''),
  seoDescription: z.string().trim().max(300).default(''),
});

export const isBlockKey = (k: string): k is (typeof CONTENT_BLOCK_KEYS)[number] =>
  (CONTENT_BLOCK_KEYS as readonly string[]).includes(k);
export const isPageKey = (k: string): k is (typeof PAGE_KEYS)[number] =>
  (PAGE_KEYS as readonly string[]).includes(k);
