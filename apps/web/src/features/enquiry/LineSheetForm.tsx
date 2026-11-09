'use client';

import { useCallback, useRef, useState, type FormEvent } from 'react';
import { lineSheetRequestSchema } from '@riad/shared';
import { errorMessage } from '@/store/baseApi';
import { useSiteStore } from '@/store/site/hooks';
import { trackEvent } from '../tracking/events';
import { buildTrackingContext } from '../tracking/trackingContext';
import { useGetTrackingSettingsQuery } from '../tracking/trackingApi';
import { useRequestLineSheetMutation } from './enquiryApi';
import { Turnstile, turnstileEnabled } from './Turnstile';

/**
 * "Email me the line sheet": one field, one button. The request becomes a lead
 * in the dashboard and the PDF link is e-mailed to the address given.
 */
export function LineSheetForm() {
  const store = useSiteStore();
  const { data: settings } = useGetTrackingSettingsQuery();
  const [request, { isLoading }] = useRequestLineSheetMutation();
  const key = useRef<{ email: string; value: string } | null>(null);

  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [token, setToken] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const onToken = useCallback((t: string) => setToken(t), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    // One key per address: a retry is safe, a different address is a different request.
    const address = email.trim().toLowerCase();
    if (key.current?.email !== address) key.current = { email: address, value: crypto.randomUUID() };

    const parsed = lineSheetRequestSchema.safeParse({
      submissionKey: key.current.value,
      email: address,
      ...(token ? { turnstileToken: token } : {}),
      ...(honeypot ? { website_url: honeypot } : {}),
      tracking: buildTrackingContext(store.getState().consent, settings?.tracking.journey !== false),
    });
    if (!parsed.success) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      await request(parsed.data).unwrap();
      key.current = null;
      setSent(true);
      setEmail('');
      trackEvent({ type: 'form_submit', label: 'line_sheet' });
    } catch (err) {
      setError(errorMessage(err));
      if (turnstileEnabled) {
        setToken('');
        setWidgetKey((k) => k + 1);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-3 rounded-[22px] bg-sand-50/10 p-2 ring-1 ring-sand-50/20 backdrop-blur sm:flex-row sm:rounded-full">
        <label className="sr-only" htmlFor="line-sheet-email">Email address</label>
        <input
          id="line-sheet-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourshop.co.uk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-transparent px-5 py-3 outline-none placeholder:text-sand-300"
        />
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>
        <button type="submit" disabled={isLoading} className="btn-brass rounded-full px-7 py-3.5 text-[15px] font-medium disabled:opacity-60">
          {isLoading ? 'Sending…' : 'Email me the line sheet'}
        </button>
      </div>
      {turnstileEnabled && (
        <div className="mt-4">
          <Turnstile key={widgetKey} onToken={onToken} />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-brass-200">
          {error}
        </p>
      )}
      {sent && (
        <p role="status" className="mt-4 text-brass-200">
          Thank you. It&apos;s on its way to your inbox.
        </p>
      )}
      <p className="mt-4 text-sm text-sand-300">Trade customers only. No spam, unsubscribe any time.</p>
    </form>
  );
}
