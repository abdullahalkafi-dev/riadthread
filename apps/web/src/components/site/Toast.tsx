'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { clearToast, openDrawer } from '@/store/site/ui.slice';

const VISIBLE_MS = 3200;

/** Short confirmation ("Added to your enquiry list") with a shortcut to the list. */
export function Toast() {
  const dispatch = useSiteDispatch();
  const toast = useSiteSelector((s) => s.ui.toast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(clearToast()), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-3 pl-4 pr-5 text-sm text-sand-50 shadow-2xl transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] max-lg:bottom-24',
        toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-24 opacity-0',
      )}
    >
      <span className="h-2 w-2 rounded-full bg-brass-400" />
      <span>{toast?.message}</span>
      <button
        type="button"
        onClick={() => {
          dispatch(clearToast());
          dispatch(openDrawer('enquiry'));
        }}
        className="text-brass-300 underline underline-offset-4"
      >
        View list
      </button>
    </div>
  );
}
