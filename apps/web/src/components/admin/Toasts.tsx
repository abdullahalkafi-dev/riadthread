'use client';

import { useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useAdminDispatch, useAdminSelector } from '@/store/admin/hooks';
import { dismissToast, pushToast } from '@/store/admin/toast.slice';
import { Icon } from './Icon';

/** `const toast = useToast(); toast('Saved'); toast('Could not save', 'error');` */
export function useToast() {
  const dispatch = useAdminDispatch();
  return useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      dispatch(pushToast(message, tone));
    },
    [dispatch],
  );
}

function ToastItem({ id, message, tone }: { id: string; message: string; tone: 'success' | 'error' }) {
  const dispatch = useAdminDispatch();
  useEffect(() => {
    // Errors stay a little longer so they can be read.
    const timer = setTimeout(() => dispatch(dismissToast(id)), tone === 'error' ? 6000 : 2800);
    return () => clearTimeout(timer);
  }, [dispatch, id, tone]);

  return (
    <div
      className={cn(
        'admin-toast-in flex max-w-full items-center gap-[9px] rounded-xl px-[18px] py-[11px] text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,.5)]',
        tone === 'error' ? 'bg-admin-danger' : 'bg-ink',
      )}
    >
      <Icon name={tone === 'error' ? 'alert' : 'check'} className={tone === 'error' ? 'text-white' : 'text-brass-300'} />
      <span>{message}</span>
    </div>
  );
}

/** Rendered once, in the dashboard shell. */
export function ToastHost() {
  const toasts = useAdminSelector((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-24px)] -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  );
}
