import { z } from 'zod';
import { EVENT_TYPES, LIMITS } from '../constants';
import { objectId } from './common';
import { attributionSchema } from './enquiry';

export const trackingEvent = z.object({
  eventId: z.string().min(8).max(64),
  type: z.enum(EVENT_TYPES),
  path: z.string().max(300),
  productId: objectId.optional(),
  /** Client time in epoch ms; the server also records its own receive time. */
  at: z.number().int(),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
  label: z.string().max(80).optional(),
  value: z.number().optional(),
});

export const trackingBatch = z.object({
  /** The collector only accepts batches from visitors who gave permission. */
  consent: z.literal(true),
  policyVersion: z.string().max(20).optional(),
  visitorId: z.string().min(16).max(64),
  sessionId: z.string().min(16).max(64),
  events: z.array(trackingEvent).min(1).max(LIMITS.eventBatch),
  attribution: attributionSchema.optional(),
  device: z
    .object({
      type: z.enum(['mobile', 'tablet', 'desktop']).optional(),
      browser: z.string().max(40).optional(),
      os: z.string().max(40).optional(),
      viewport: z.string().max(20).optional(),
    })
    .optional(),
});
export type TrackingBatch = z.infer<typeof trackingBatch>;
