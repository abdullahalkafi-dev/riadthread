'use client';

import { useState } from 'react';
import type { MediaType } from '@riad/shared';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetMediaQuery } from '@/store/admin/mediaApi';
import { Button } from '../Button';
import { MediaPicker } from './MediaPicker';
import { MediaThumb, mediaKindLabel } from './MediaThumb';

interface MediaFieldProps {
  /** The id stored in the form, or null when nothing is chosen. */
  mediaId: string | null;
  onChange: (mediaId: string | null) => void;
  allowed?: readonly MediaType[];
  /** Shown on the choose button and as the dialog title, e.g. "slide image". */
  noun?: string;
}

/** A form field for one library file: thumbnail, name, and choose / replace / remove. */
export function MediaField({ mediaId, onChange, allowed = ['image'], noun = 'file' }: MediaFieldProps) {
  const [picking, setPicking] = useState(false);
  const { data: media, isLoading, isError } = useGetMediaQuery(mediaId ?? '', { skip: !mediaId });

  return (
    <div className="flex items-center gap-3">
      <div className="h-[72px] w-14 flex-none overflow-hidden rounded-[10px] border border-admin-line bg-sand-200">
        {mediaId && isLoading && <Skeleton className="h-full w-full rounded-none" />}
        {media && <MediaThumb media={media} sizes="112px" />}
      </div>
      <div className="min-w-0 flex-1">
        {media ? (
          <p className="truncate text-[13px] font-semibold">{media.originalName ?? 'Untitled'}</p>
        ) : (
          <p className="text-[13px] text-ink-soft">{mediaId && isError ? 'This file is no longer in the library.' : `No ${noun} chosen`}</p>
        )}
        {media && <p className="text-xs text-ink-mute">{mediaKindLabel(media.type)}</p>}
        <div className="mt-1.5 flex gap-1.5">
          <Button size="sm" onClick={() => setPicking(true)}>
            {mediaId ? `Replace ${noun}` : `Choose ${noun}`}
          </Button>
          {mediaId && (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={picking} onClose={() => setPicking(false)} onSelect={(files) => files[0] && onChange(files[0].id)} allowed={allowed} title={`Choose a ${noun}`} />
    </div>
  );
}
