import type { RequestHandler } from 'express';
import { allowedOrigins } from '../config/env';
import { AppError } from '../utils/AppError';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protects cookie-authenticated writes. A browser form on another site can send
 * our cookies but cannot set a custom header or a matching Origin, so both are
 * required for every unsafe request.
 */
export const csrfGuard: RequestHandler = (req, _res, next) => {
  if (SAFE.has(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return next(AppError.forbidden('This request came from an untrusted origin'));
  }
  if (req.headers['x-riad-csrf'] !== '1') {
    return next(AppError.forbidden('Missing request header'));
  }
  next();
};
