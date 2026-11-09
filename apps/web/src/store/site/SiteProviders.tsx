'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { hydrateConsent } from './consent.slice';
import { hydrate as hydrateList, type EnquiryLine } from './enquiry.slice';
import { makeSiteStore, type SiteStore } from './store';

const LIST_KEY = 'rt:enquiry-list:v1';
const CONSENT_KEY = 'rt:consent:v1';

/** localStorage can be missing or throw (private windows, blocked storage); the site must work without it. */
const read = <T,>(key: string): T | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the choice simply lasts for this visit */
  }
};

/**
 * Creates the public site's store once per tab, restores the saved enquiry list
 * and consent choice after the first render (so server and browser HTML match),
 * and saves them again whenever they change.
 */
export function SiteProviders({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<SiteStore | null>(null);
  storeRef.current ??= makeSiteStore();
  const store = storeRef.current;

  useEffect(() => {
    store.dispatch(hydrateList(read<EnquiryLine[]>(LIST_KEY) ?? []));
    store.dispatch(hydrateConsent(read(CONSENT_KEY) ?? {}));

    let last = store.getState();
    return store.subscribe(() => {
      const state = store.getState();
      if (state.enquiryList.hydrated && state.enquiryList.lines !== last.enquiryList.lines) {
        write(LIST_KEY, state.enquiryList.lines);
      }
      if (state.consent.hydrated && state.consent !== last.consent) {
        const { status, visitorId, sessionId, policyVersion } = state.consent;
        write(CONSENT_KEY, { status, visitorId, sessionId, policyVersion });
      }
      last = state;
    });
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
