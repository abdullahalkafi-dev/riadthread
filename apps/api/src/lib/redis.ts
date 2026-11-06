import { Redis, type RedisOptions } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

function create(name: string, url: string, options: RedisOptions) {
  const client = new Redis(url, options);
  let lastLogged = 0;
  // Redis being down is expected to be survivable, so log it calmly and not on every retry.
  client.on('error', (err) => {
    if (Date.now() - lastLogged > 30_000) {
      logger.warn({ redis: name, reason: err.message }, 'Redis connection problem');
      lastLogged = Date.now();
    }
  });
  client.on('ready', () => logger.info({ redis: name }, 'Redis connected'));
  return client;
}

/**
 * Cache instance (may evict keys). Commands fail fast while it is unreachable,
 * and callers fall back to MongoDB.
 */
export const cacheRedis: Redis | null = env.REDIS_CACHE_URL
  ? create('cache', env.REDIS_CACHE_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 3000,
      retryStrategy: (times: number) => Math.min(times * 500, 5000),
    })
  : null;

/** Queue instance (persistent, no eviction). BullMQ requires maxRetriesPerRequest: null. */
export const queueRedis: Redis | null = env.REDIS_QUEUE_URL
  ? create('queue', env.REDIS_QUEUE_URL, { maxRetriesPerRequest: null })
  : null;

export async function closeRedis() {
  await Promise.allSettled([cacheRedis?.quit(), queueRedis?.quit()]);
}
