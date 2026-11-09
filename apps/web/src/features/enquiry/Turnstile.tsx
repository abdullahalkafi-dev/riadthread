'use client';

import { useEffect, useRef } from 'react';

interface TurnstileApi {
  render: (el: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** True when a Cloudflare Turnstile site key is configured. Without one, no widget is shown. */
export const turnstileEnabled = Boolean(SITE_KEY);

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Turnstile failed to load')));
    if (!existing) {
      script.src = SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/**
 * The anti-spam check shown before sending a form. A token is only valid once,
 * so the parent remounts this (by changing its `key`) after a failed attempt.
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !host.current) return;
    let widget: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile || !host.current) return;
        widget = window.turnstile.render(host.current, {
          sitekey: SITE_KEY,
          callback: onToken,
          'expired-callback': () => onToken(''),
        });
      })
      .catch(() => onToken(''));
    return () => {
      cancelled = true;
      if (widget) window.turnstile?.remove(widget);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={host} className="min-h-[65px]" />;
}
