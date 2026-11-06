import { z } from 'zod';
import { objectId, slugSchema } from './common';

/** Categories and collections share the same shape. */
export const taxonomyInput = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional(),
  description: z.string().trim().max(400).default(''),
  imageMediaId: objectId.nullable().default(null),
  order: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
  showOnHome: z.boolean().default(false),
});
export const taxonomyUpdate = taxonomyInput.partial();
export type TaxonomyInput = z.infer<typeof taxonomyInput>;
