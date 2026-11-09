'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useSiteSelector } from '@/store/site/hooks';
import type { Drawer as DrawerName } from '@/store/site/ui.slice';

type Side = 'left' | 'right' | 'top';

const POSITION: Record<Side, string> = {
  left: 'left-0 top-0 h-full',
  right: 'right-0 top-0 h-full',
  top: 'inset-x-0 top-0',
};

/** Where a closed panel waits. It must not be on the element while open: both translate classes would compete. */
const HIDDEN: Record<Side, string> = {
  left: '-translate-x-[105%]',
  right: 'translate-x-[105%]',
  top: '-translate-y-[105%]',
};

interface Props {
  /** Which entry of the ui slice opens this panel. */
  name: Exclude<DrawerName, null>;
  side: Side;
  /** Accessible name of the dialog. */
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * A side panel that slides in over the page. Open state lives in the ui slice,
 * so any component can open it with openDrawer(name). Closed panels are inert,
 * which keeps their contents out of tab order and away from screen readers.
 */
export function Drawer({ name, side, label, className, children }: Props) {
  const open = useSiteSelector((s) => s.ui.drawer === name);
  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        'fixed z-[60] transition-transform duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] will-change-transform',
        POSITION[side],
        open ? 'translate-x-0 translate-y-0' : HIDDEN[side],
        className,
      )}
    >
      {children}
    </aside>
  );
}
