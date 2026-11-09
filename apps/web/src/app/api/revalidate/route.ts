import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';

/** Compares two secrets without leaking, through timing, how many leading characters matched. */
function sameSecret(sent: string | null): boolean {
  if (!sent || !serverEnv.revalidateSecret) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(serverEnv.revalidateSecret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the API (server to server) after something is published, so the
 * affected pages are rebuilt on their next visit instead of waiting for their
 * time-based refresh. The shared secret never reaches a browser.
 */
export async function POST(request: NextRequest) {
  if (!sameSecret(request.headers.get('x-revalidate-secret'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === 'string' && t.length <= 256).slice(0, 50) : [];
  if (tags.length === 0) return NextResponse.json({ success: false, message: 'No tags given' }, { status: 400 });

  // expire: 0 means the next visitor gets fresh content straight away, not a stale copy.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ success: true, revalidated: tags });
}
