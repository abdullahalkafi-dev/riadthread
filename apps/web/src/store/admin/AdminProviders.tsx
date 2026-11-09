'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeAdminStore, type AdminStore } from './store';

/** One store per browser tab for the whole dashboard (login included). */
export function AdminProviders({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AdminStore | null>(null);
  storeRef.current ??= makeAdminStore();
  return <Provider store={storeRef.current}>{children}</Provider>;
}
