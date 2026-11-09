'use client';

import Link from 'next/link';
import { accept, decline } from '@/store/site/consent.slice';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { useGetTrackingSettingsQuery } from './trackingApi';

/**
 * Asks once whether anonymous visit analytics may be recorded. It shows only
 * when the owner has switched the banner on and the visitor has not chosen yet.
 * Choosing "No thanks" is as easy as accepting, and enquiries work either way.
 */
export function ConsentBanner() {
  const dispatch = useSiteDispatch();
  const consent = useSiteSelector((s) => s.consent);
  const { data: settings } = useGetTrackingSettingsQuery();

  if (!settings?.tracking.banner || !consent.hydrated || consent.status !== 'unknown') return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics choice"
      className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-md rounded-2xl bg-sand-50 p-5 shadow-[0_30px_60px_-20px_rgba(43,33,25,.45)] ring-1 ring-ink/10 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:mx-0"
    >
      <p className="font-display text-xl leading-tight">Help us improve the site?</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        With your permission we record which pages you look at, anonymously, so we can show our team what
        retailers were interested in when they enquire. Your enquiry works either way. See our{' '}
        <Link href="/cookies" className="underline underline-offset-2 hover:text-terracotta-600">cookies</Link> and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-terracotta-600">privacy</Link> pages.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => dispatch(accept({ visitorId: crypto.randomUUID(), sessionId: crypto.randomUUID() }))}
          className="rounded-full bg-terracotta-500 px-6 py-3 text-sm text-sand-50 transition hover:bg-terracotta-600"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => dispatch(decline())}
          className="rounded-full border border-ink/25 px-6 py-3 text-sm transition hover:border-ink hover:bg-ink hover:text-sand-50"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
