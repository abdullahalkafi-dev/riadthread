import type { RequestHandler } from 'express';

/**
 * Removes MongoDB operator keys ("$where", "a.b") from request bodies so a
 * crafted JSON payload can never be interpreted as a query. Zod validation
 * is the main defence; this is a second layer for anything that slips past.
 */
function clean(value: unknown, depth = 0): unknown {
  if (depth > 12) return undefined;
  if (Array.isArray(value)) return value.map((v) => clean(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v, depth + 1);
    }
    return out;
  }
  return value;
}

export const sanitizeBody: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  next();
};
