import { logger } from '../config/logger';
import { cacheRedis } from './redis';

/**
 * Small, explicit read cache for published content. MongoDB stays the source
 * of truth: any Redis problem simply falls through to the loader.
 *
 * Keys look like rt:v1:<tag>:<generation>:<key>. Invalidating a tag bumps its
 * generation, so every old entry becomes unreachable at once and expires on
 * its own. Nothing is ever scanned or deleted one by one.
 */
const PREFIX = 'rt:v1';
const inflight = new Map<string, Promise<unknown>>();

const ready = () => cacheRedis !== null && cacheRedis.status === 'ready';
const jitter = (ttl: number) => Math.round(ttl * (0.9 + Math.random() * 0.2));

export async function cached<T>(tag: string, key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  if (!ready()) return loader();
  const redis = cacheRedis!;

  let fullKey: string;
  try {
    const generation = (await redis.get(`${PREFIX}:gen:${tag}`)) ?? '0';
    fullKey = `${PREFIX}:${tag}:${generation}:${key}`;
    const hit = await redis.get(fullKey);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    return loader();
  }

  // Many visitors asking for the same cold entry trigger one database read, not many.
  const running = inflight.get(fullKey);
  if (running) return running as Promise<T>;

  const promise = (async () => {
    const value = await loader();
    try {
      await redis.set(fullKey, JSON.stringify(value), 'EX', jitter(ttlSeconds));
    } catch (err) {
      logger.debug({ err }, 'Cache write skipped');
    }
    return value;
  })().finally(() => inflight.delete(fullKey));

  inflight.set(fullKey, promise);
  return promise;
}

/** Makes every cached entry under these tags unreachable. */
export async function invalidate(...tags: string[]): Promise<void> {
  if (!ready()) return;
  try {
    await Promise.all(tags.map((t) => cacheRedis!.incr(`${PREFIX}:gen:${t}`)));
  } catch (err) {
    logger.warn({ err, tags }, 'Cache invalidation failed; entries will expire by TTL');
  }
}

export const CACHE_TAGS = {
  catalog: 'catalog',
  site: 'site',
  overview: 'overview',
} as const;
