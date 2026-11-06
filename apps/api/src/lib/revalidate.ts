import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Tells the website to refresh pages after a publish. This is a protected
 * server-to-server call: the secret is shared, never sent to browsers.
 * It is best-effort here; pages also expire on their own TTL.
 */
export async function revalidateWeb(tags: string[]): Promise<boolean> {
  if (!env.WEB_REVALIDATE_URL || !env.REVALIDATE_SECRET) return false;
  try {
    const res = await fetch(env.WEB_REVALIDATE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Web app answered ${res.status}`);
    return true;
  } catch (err) {
    logger.warn({ err, tags }, 'Website refresh failed; pages will update when their cache expires');
    return false;
  }
}
