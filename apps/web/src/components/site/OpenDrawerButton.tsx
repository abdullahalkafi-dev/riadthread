'use client';

import type { ReactNode } from 'react';
import { useSiteDispatch } from '@/store/site/hooks';
import { openDrawer, type Drawer } from '@/store/site/ui.slice';

/** A button that opens one of the site's drawers, for use inside server-rendered sections. */
export function OpenDrawerButton({ drawer, className, children }: { drawer: Exclude<Drawer, null>; className?: string; children: ReactNode }) {
  const dispatch = useSiteDispatch();
  return (
    <button type="button" className={className} onClick={() => dispatch(openDrawer(drawer))}>
      {children}
    </button>
  );
}
