'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

interface ThumbImageProps {
  src: string | null | undefined;
  className?: string;
}

/**
 * A small stored picture (an enquiry's product snapshot, a ranking row). Those
 * URLs are frozen when the enquiry is saved, so the file can be gone later;
 * a neutral placeholder is shown instead of the browser's broken-image icon.
 */
export function ThumbImage({ src, className }: ThumbImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div aria-hidden className={cn('grid place-items-center bg-sand-200 text-ink-mute', className)}>
        <Icon name="img" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- tiny stored thumbnail, no srcset needed
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={cn('bg-sand-200 object-cover', className)} />;
}
