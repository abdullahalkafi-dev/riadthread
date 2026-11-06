import { rateLimit, type Options, type Store } from 'express-rate-limit';
import { AppError } from '../utils/AppError';

/** Set once at start-up when a shared (Redis) store is available. */
let sharedStoreFactory: ((prefix: string) => Store) | null = null;
export function useSharedRateLimitStore(factory: (prefix: string) => Store) {
  sharedStoreFactory = factory;
}

function limiter(name: string, opts: Pick<Options, 'windowMs' | 'limit'> & { message?: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // If the shared store is unreachable we prefer to serve the request.
    passOnStoreError: true,
    ...(sharedStoreFactory ? { store: sharedStoreFactory(name) } : {}),
    handler: (_req, _res, next) =>
      next(new AppError(429, opts.message ?? 'Too many requests. Please wait a moment and try again')),
  });
}

/** Builders, so the shared store (if any) is picked up at app creation time. */
export const limiters = {
  api: () => limiter('api', { windowMs: 60_000, limit: 600 }),
  login: () =>
    limiter('login', {
      windowMs: 15 * 60_000,
      limit: 10,
      message: 'Too many sign-in attempts. Please try again in a few minutes',
    }),
  enquiry: () =>
    limiter('enquiry', {
      windowMs: 60 * 60_000,
      limit: 20,
      message: 'You have sent several enquiries recently. Please try again later',
    }),
  tracking: () => limiter('tracking', { windowMs: 60_000, limit: 120 }),
  upload: () => limiter('upload', { windowMs: 60_000, limit: 60 }),
};
