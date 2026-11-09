import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { ApiEnvelope } from '@/types/api';

/**
 * One RTK Query API for the whole app. The public site and the dashboard each
 * inject their own endpoints into it (publicApi.ts, adminApi.ts), so they share
 * one cache, one error format and one session-refresh behaviour.
 *
 * Calls go to this site's own origin (/api is proxied to the Express API), so
 * the httpOnly session cookies are same-site. The CSRF header is required by
 * the API for every cookie-authenticated write.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('x-riad-csrf', '1');
    return headers;
  },
});

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time, however many requests failed together. */
function refreshSession(api: Parameters<BaseQueryFn>[1], extra: Parameters<BaseQueryFn>[2]) {
  refreshing ??= (async () => {
    const res = await rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extra);
    return !res.error;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Paths that must never trigger a refresh (they are how the session starts or ends). */
const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout'];

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && !NO_REFRESH.includes(url)) {
    if (await refreshSession(api, extra)) {
      result = await rawBaseQuery(args, api, extra);
    }
  }
  return result;
};

export const TAGS = ['Me', 'Product', 'Enquiry', 'Overview', 'Media', 'Category', 'Collection', 'Content', 'Settings', 'Site'] as const;

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [...TAGS],
  endpoints: () => ({}),
});

/** Most endpoints only want the payload inside the envelope. */
export const unwrap = <T>(res: ApiEnvelope<T>) => res.data;

/** A readable message from any RTK Query error. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again'): string {
  const e = error as { status?: number | string; data?: { message?: string } } | undefined;
  if (e?.data?.message) return e.data.message;
  if (e?.status === 'FETCH_ERROR') return 'We could not reach the server. Check your connection and try again';
  return fallback;
}

/** Field-level messages from a 400 response, keyed by field path. */
export function fieldErrors(error: unknown): Record<string, string> {
  const sources = (error as { data?: { errorSources?: Array<{ path: string; message: string }> } } | undefined)?.data?.errorSources ?? [];
  return Object.fromEntries(sources.map((s) => [s.path.replace(/^(body|query|params)\./, ''), s.message]));
}
