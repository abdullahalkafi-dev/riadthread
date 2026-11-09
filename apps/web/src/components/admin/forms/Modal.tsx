'use client';

import { useEffect, useId } from 'react';
import { cn } from '@/lib/cn';
import { IconButton } from '../Button';
import { Icon } from '../Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Wide dialogs (the media picker) pass a larger max width. */
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** A centred dialog. Closes on Escape and on a click outside; the page behind it does not scroll. */
export function Modal({ open, onClose, title, className, children, footer }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div className="absolute inset-0 bg-night-900/45" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn('relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-[18px] bg-admin-bg shadow-2xl', className)}
      >
        <header className="flex items-center justify-between gap-3 rounded-t-[18px] border-b border-admin-line bg-white px-5 py-4">
          <h2 id={titleId} className="font-display text-xl">
            {title}
          </h2>
          <IconButton aria-label="Close" onClick={onClose} className="h-9 w-9">
            <Icon name="x" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 rounded-b-[18px] border-t border-admin-line bg-white px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
