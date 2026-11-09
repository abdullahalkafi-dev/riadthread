'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { closeDrawer } from '@/store/site/ui.slice';

/**
 * The dimmed backdrop behind an open drawer. It also owns the behaviour every
 * drawer shares: Escape closes it, and the page behind it stops scrolling.
 */
export function Overlay() {
  const dispatch = useSiteDispatch();
  const open = useSiteSelector((s) => s.ui.drawer !== null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeDrawer());
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, dispatch]);

  return (
    <div
      aria-hidden="true"
      onClick={() => dispatch(closeDrawer())}
      className={cn(
        'fixed inset-0 z-[55] bg-night-950/50 backdrop-blur-[2px] transition-opacity duration-[350ms]',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    />
  );
}
