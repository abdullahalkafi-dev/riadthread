'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { accept, POLICY_VERSION } from '@/store/site/consent.slice';
import { captureLanding, sessionAttribution } from './attribution';
import { drainEvents, onQueueGrow, pendingEvents, requeueEvents, setEventsEnabled, trackEvent } from './events';
import { journey } from './journey';
import { useGetTrackingSettingsQuery, useSendEventsMutation, type EventBatch } from './trackingApi';

const FLUSH_EVERY_MS = 10_000;
const SESSION_KEY = 'rt:session:v1';

const humanise = (slug: string) => slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** A readable step name for a page, before the page itself can say something better. */
export function labelForPath(pathname: string): string {
  const [first, second] = pathname.split('/').filter(Boolean);
  if (!first) return 'Home';
  if (first === 'collections') return second ? `Collection · ${humanise(second)}` : 'Collection';
  if (first === 'products') return second ? `Product · ${humanise(second)}` : 'Collection';
  if (first === 'enquiry') return 'Enquiry list';
  return humanise(first);
}

function deviceInfo(): NonNullable<EventBatch['device']> {
  const w = window.innerWidth;
  const ua = navigator.userAgent;
  const browser = /edg\//i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other';
  const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ios/i.test(ua) ? 'iOS' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other';
  return { type: w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop', browser, os, viewport: `${w}x${window.innerHeight}` };
}

/**
 * Records page views and engagement for visitors who accepted tracking, and
 * keeps the journey the enquiry form attaches. For everyone else it does nothing
 * at all: no ids are created and no requests are made.
 */
export function Tracker() {
  const dispatch = useSiteDispatch();
  const pathname = usePathname();
  const consent = useSiteSelector((s) => s.consent);
  const { data: settings } = useGetTrackingSettingsQuery();
  const [send] = useSendEventsMutation();

  const accepted = consent.hydrated && consent.status === 'accepted' && !!consent.visitorId && !!consent.sessionId;
  const idsRef = useRef({ visitorId: '', sessionId: '', policyVersion: POLICY_VERSION });
  const attributionSent = useRef(false);

  // The landing page is noted in memory right away, before any choice is made.
  useEffect(() => {
    captureLanding();
  }, []);

  // A new browser session gets a new session id; the visitor id stays.
  useEffect(() => {
    if (!accepted || !consent.visitorId) return;
    let sessionId = consent.sessionId ?? '';
    try {
      const saved = window.sessionStorage.getItem(SESSION_KEY);
      if (saved) sessionId = saved;
      else {
        sessionId = crypto.randomUUID();
        window.sessionStorage.setItem(SESSION_KEY, sessionId);
      }
    } catch {
      /* session storage unavailable: keep the stored id */
    }
    idsRef.current = { visitorId: consent.visitorId, sessionId, policyVersion: consent.policyVersion };
    if (sessionId !== consent.sessionId) dispatch(accept({ visitorId: consent.visitorId, sessionId }));
  }, [accepted, consent.visitorId, consent.sessionId, consent.policyVersion, dispatch]);

  // Switch recording on and off with the visitor's choice and the owner's settings.
  const journeyOn = accepted && settings?.tracking.journey !== false;
  useEffect(() => {
    setEventsEnabled(accepted);
    journey.setEnabled(journeyOn);
    return () => {
      setEventsEnabled(false);
      journey.setEnabled(false);
    };
  }, [accepted, journeyOn]);

  // One page view and one journey step per page, with the time spent when leaving it.
  useEffect(() => {
    if (!accepted) return;
    const enteredAt = Date.now();
    trackEvent({ type: 'page_view', path: pathname });
    journey.enter(labelForPath(pathname));
    return () => {
      const spent = Date.now() - enteredAt;
      if (spent >= 1000) trackEvent({ type: 'page_engaged', path: pathname, durationMs: Math.min(spent, 3_600_000) });
    };
  }, [accepted, pathname]);

  const flush = useCallback(
    async (useBeacon = false) => {
      const events = drainEvents();
      const { visitorId, sessionId, policyVersion } = idsRef.current;
      if (events.length === 0 || !visitorId) return;
      const batch: EventBatch = {
        consent: true,
        policyVersion,
        visitorId,
        sessionId,
        events,
        device: deviceInfo(),
        ...(attributionSent.current ? {} : { attribution: sessionAttribution(true) }),
      };
      if (useBeacon) {
        // The page is closing: sendBeacon survives it. text/plain avoids a pre-flight request.
        const ok = navigator.sendBeacon('/api/v1/tracking/events', new Blob([JSON.stringify(batch)], { type: 'text/plain' }));
        if (!ok) requeueEvents(events);
        else attributionSent.current = true;
        return;
      }
      try {
        await send(batch).unwrap();
        attributionSent.current = true;
      } catch {
        requeueEvents(events);
      }
    },
    [send],
  );

  useEffect(() => {
    if (!accepted) return;
    const timer = window.setInterval(() => void flush(), FLUSH_EVERY_MS);
    onQueueGrow(() => void flush());
    const onHide = () => {
      if (document.visibilityState === 'hidden' && pendingEvents() > 0) void flush(true);
    };
    const onPageHide = () => {
      if (pendingEvents() > 0) void flush(true);
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(timer);
      onQueueGrow(null);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [accepted, flush]);

  return null;
}
