import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes');

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * A true partial for PATCH requests. Zod 4's .partial() still applies field
 * defaults, so a request that sent only { name } would silently reset every
 * other field. Here a missing key stays missing, and only keys that are sent
 * are validated and applied.
 */
export function partialWithoutDefaults<T extends z.ZodObject>(schema: T) {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    const inner = (field instanceof z.ZodDefault ? field.unwrap() : field) as z.ZodType;
    shape[key] = inner.optional();
  }
  return z.object(shape) as z.ZodObject<{ [K in keyof T['shape']]: z.ZodOptional<z.ZodType<z.output<T['shape'][K]>>> }>;
}
