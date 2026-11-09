import 'server-only';
import type { ApiEnvelope } from '@/types/api';
import { serverEnv } from './env';

export class ServerApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Options {
  /** Cache tags, so a publish in the dashboard can refresh exactly these pages. */
  tags?: string[];
  /** Seconds before the cached copy is considered stale. */
  revalidate?: number;
}

/**
 * Server-side GET against the API. Responses are cached by Next and refreshed
 * by tag when the API tells us something was published.
 */
export async function apiGet<T>(path: string, { tags = [], revalidate = 60 }: Options = {}) {
  const res = await fetch(`${serverEnv.apiUrl}/api/v1${path}`, {
    headers: serverEnv.internalKey ? { 'x-internal-key': serverEnv.internalKey } : {},
    next: { revalidate, tags },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ServerApiError(res.status, body?.message ?? `API answered ${res.status}`);
  }
  return (await res.json()) as ApiEnvelope<T>;
}

/** Like apiGet, but returns null on a 404 so pages can call notFound(). */
export async function apiGetOrNull<T>(path: string, options?: Options) {
  try {
    return await apiGet<T>(path, options);
  } catch (err) {
    if (err instanceof ServerApiError && err.status === 404) return null;
    throw err;
  }
}
