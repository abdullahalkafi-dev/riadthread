import { describe, expect, it, vi } from 'vitest';

// With no Redis configured the cache must be a transparent pass-through.
vi.mock('./redis', () => ({ cacheRedis: null, queueRedis: null }));

import { cached, invalidate } from './cache';

describe('cache without Redis', () => {
  it('calls the loader every time and never throws', async () => {
    const loader = vi.fn().mockResolvedValue({ ok: true });
    await expect(cached('catalog', 'k', 60, loader)).resolves.toEqual({ ok: true });
    await cached('catalog', 'k', 60, loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('invalidate is a safe no-op', async () => {
    await expect(invalidate('catalog', 'site')).resolves.toBeUndefined();
  });
});
