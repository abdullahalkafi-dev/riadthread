/**
 * Where a visitor came from (campaign tags and referring site). It is read from
 * the landing page and kept in memory only; it is written to sessionStorage
 * once, and only after the visitor accepts tracking.
 */
export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPath?: string;
  referrerOrigin?: string;
}

const KEY = 'rt:attribution:v1';
let landing: Attribution | null = null;

const clip = (value: string | null, max: number) => (value ? value.trim().slice(0, max) : undefined);

function readLanding(): Attribution {
  const sp = new URLSearchParams(window.location.search);
  let referrerOrigin: string | undefined;
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    // A visit from our own pages is not a source.
    if (ref && ref.origin !== window.location.origin) referrerOrigin = ref.origin.slice(0, 200);
  } catch {
    referrerOrigin = undefined;
  }
  const out: Attribution = {
    source: clip(sp.get('utm_source'), 60),
    medium: clip(sp.get('utm_medium'), 60),
    campaign: clip(sp.get('utm_campaign'), 80),
    content: clip(sp.get('utm_content'), 80),
    term: clip(sp.get('utm_term'), 80),
    landingPath: window.location.pathname.slice(0, 300),
    referrerOrigin,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as Attribution;
}

/** Remembers the landing page in memory. Safe to call on every page load; only the first call counts. */
export function captureLanding() {
  if (typeof window === 'undefined' || landing) return;
  landing = readLanding();
}

/** The attribution for this session, saved for later page loads once tracking is accepted. */
export function sessionAttribution(accepted: boolean): Attribution | undefined {
  if (typeof window === 'undefined' || !accepted) return undefined;
  try {
    const saved = window.sessionStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as Attribution;
    const current = landing ?? readLanding();
    window.sessionStorage.setItem(KEY, JSON.stringify(current));
    return current;
  } catch {
    return landing ?? undefined;
  }
}
