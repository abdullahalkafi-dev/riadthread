import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates body, query and params with Zod. The parsed values are placed on
 * req.validated (Express 5 makes req.query read-only), so handlers only ever
 * see data that passed validation.
 */
export function validateRequest(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    req.validated = {};
    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        const sources = result.error.issues.map((i) => ({
          path: [part, ...i.path].join('.'),
          message: i.message,
        }));
        return next(new AppError(400, 'Please check the highlighted fields', sources));
      }
      req.validated[part] = result.data;
    }
    next();
  };
}
