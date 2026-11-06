import { z } from 'zod';
import {
  BUSINESS_TYPES,
  ENQUIRY_STATUSES,
  ENTRY_POINTS,
  LEAD_LEVELS,
  LIMITS,
  PREFERRED_CONTACT,
} from '../constants';
import { objectId, paginationQuery } from './common';

export const journeyStep = z.object({
  /** Short label such as "Home" or "Fez Chiffon Djellaba". */
  t: z.string().trim().min(1).max(120),
  /** Detail such as "2m 10s, watched video". */
  m: z.string().trim().max(160).default(''),
  k: z.enum(['start', 'end']).optional(),
  at: z.number().int().optional(),
});

export const attributionSchema = z.object({
  source: z.string().trim().max(60).optional(),
  medium: z.string().trim().max(60).optional(),
  campaign: z.string().trim().max(80).optional(),
  content: z.string().trim().max(80).optional(),
  term: z.string().trim().max(80).optional(),
  landingPath: z.string().trim().max(300).optional(),
  referrerOrigin: z.string().trim().max(200).optional(),
});

export const trackingContext = z.object({
  consent: z.boolean(),
  policyVersion: z.string().max(20).optional(),
  visitorId: z.string().min(16).max(64).optional(),
  sessionId: z.string().min(16).max(64).optional(),
  journey: z.array(journeyStep).max(LIMITS.journeySteps).optional(),
  attribution: attributionSchema.optional(),
});

export const enquiryItemInput = z.object({
  productId: objectId,
  /** Colour name as shown on the site; the server matches it against the product. */
  colour: z.string().trim().max(60).optional(),
  sizes: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(20),
        qty: z.number().int().min(0).max(100000),
      }),
    )
    .max(24)
    .default([]),
});

const phone = z
  .string()
  .trim()
  .min(6, 'Please enter a phone number')
  .max(30)
  .regex(/^[+\d][\d\s()\-.]+$/, 'Please enter a valid phone number');

export const createEnquirySchema = z
  .object({
    /** One per logical attempt; makes retries and double clicks safe. */
    submissionKey: z.string().trim().min(16).max(80),
    entryPoint: z.enum(ENTRY_POINTS),
    contact: z.object({
      name: z.string().trim().min(2).max(80),
      business: z.string().trim().min(2).max(120),
      email: z.string().trim().toLowerCase().email().max(200),
      phone,
      type: z.enum(BUSINESS_TYPES).optional(),
      city: z.string().trim().max(80).optional(),
      website: z.string().trim().max(200).optional(),
    }),
    message: z.string().trim().max(4000).default(''),
    preferredContact: z.enum(PREFERRED_CONTACT).optional(),
    deliveryBy: z.string().trim().max(80).optional(),
    estimatedQty: z.number().int().min(0).max(1_000_000).optional(),
    items: z.array(enquiryItemInput).max(LIMITS.enquiryItems).default([]),
    pageUrl: z.string().trim().max(500).optional(),
    turnstileToken: z.string().max(2048).optional(),
    /** Honeypot field: real people never fill this in. */
    website_url: z.string().max(0).optional(),
    tracking: trackingContext.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.items.length === 0 && v.message.length < 5) {
      ctx.addIssue({
        code: 'custom',
        path: ['message'],
        message: 'Please tell us what you are looking for',
      });
    }
  });
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

export const lineSheetRequestSchema = z.object({
  submissionKey: z.string().trim().min(16).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(2).max(80).optional(),
  business: z.string().trim().max(120).optional(),
  turnstileToken: z.string().max(2048).optional(),
  website_url: z.string().max(0).optional(),
  tracking: trackingContext.optional(),
});
export type LineSheetRequestInput = z.infer<typeof lineSheetRequestSchema>;

export const updateStatusSchema = z.object({ status: z.enum(ENQUIRY_STATUSES) });
export const addNoteSchema = z.object({ text: z.string().trim().min(1).max(2000) });
export const followUpSchema = z.object({ followUpAt: z.coerce.date().nullable() });

export const adminEnquiryQuery = paginationQuery.extend({
  status: z.enum(ENQUIRY_STATUSES).optional(),
  score: z.enum(LEAD_LEVELS).optional(),
  productId: objectId.optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

export const enquiryExportQuery = adminEnquiryQuery.omit({ page: true, limit: true });
