import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Cloudflare Turnstile check for public forms. Without TURNSTILE_SECRET (local
 * development) the check is skipped; in production a missing secret is an error.
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return env.NODE_ENV !== 'production';
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, ...(ip ? { remoteip: ip } : {}) });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch (err) {
    // If the captcha service is unreachable we fail closed: better a retry than a spam flood.
    logger.warn({ err }, 'Turnstile verification failed');
    return false;
  }
}
