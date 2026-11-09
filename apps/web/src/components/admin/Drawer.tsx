'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the panel. */
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * A right-hand panel over a dimmed page. Escape and a click on the dimmed area
 * close it, the page behind stops scrolling, and focus returns to whatever
 * opened it.
 */
export function Drawer({ open, onClose, label, children, className }: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[60] bg-night-900/45 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!open}
        className={cn(
          'fixed bottom-0 right-0 top-0 z-[70] flex w-[min(620px,100%)] flex-col bg-admin-bg shadow-drawer outline-none transition-transform duration-[350ms] ease-[cubic-bezier(.2,.8,.2,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
      >
        {open && children}
      </aside>
    </>
  );
}

export function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('border-b border-admin-line bg-white px-[22px] py-[18px]', className)} {...props} />;
}
export function DrawerBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex-1 overflow-auto px-[22px] pb-[30px] pt-[18px]', className)} {...props} />;
}
export function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-wrap gap-2 border-t border-admin-line bg-white px-[22px] py-3', className)} {...props} />;
}
