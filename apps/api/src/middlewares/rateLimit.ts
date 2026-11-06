import { rateLimit, type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env';
import { queueRedis } from '../lib/redis';
import { AppError } from '../utils/AppError';

/** Counters live in Redis when available, so limits hold across restarts and instances. */
function limiter(name: string, opts: Pick<Options, 'windowMs' | 'limit'> & { message?: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    // Automated tests submit far more than a person would; real limits apply everywhere else.
    limit: env.NODE_ENV === 'test' ? 100_000 : opts.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // If the shared store is unreachable we prefer to serve the request.
    passOnStoreError: true,
    ...(queueRedis
      ? {
          store: new RedisStore({
            prefix: `rl:${name}:`,
            sendCommand: (command: string, ...args: string[]) =>
              queueRedis!.call(command, ...args) as Promise<never>,
          }),
        }
      : {}),
    handler: (_req, _res, next) =>
      next(new AppError(429, opts.message ?? 'Too many requests. Please wait a moment and try again')),
  });
}

/** Builders, so each route gets its own counter. */
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
