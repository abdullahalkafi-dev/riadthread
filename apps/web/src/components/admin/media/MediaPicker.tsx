'use client';

import { useEffect, useState } from 'react';
import type { MediaType } from '@riad/shared';
import { cn } from '@/lib/cn';
import { useListMediaQuery } from '@/store/admin/mediaApi';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Media } from '@/types/api';
import { Button } from '../Button';
import { Input } from '../Field';
import { Icon } from '../Icon';
import { Modal } from '../forms/Modal';
import { MediaThumb } from './MediaThumb';
import { UploadDropzone } from './UploadDropzone';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  /** Receives the chosen files (one when `multiple` is off). */
  onSelect: (media: Media[]) => void;
  /** Which kinds of file can be chosen. Defaults to images. */
  allowed?: readonly MediaType[];
  multiple?: boolean;
  title?: string;
  /** Files already in use here, shown as ticked and not selectable twice. */
  excludeIds?: readonly string[];
}

const PAGE_SIZE = 18;

/**
 * Pick files from the media library, or upload new ones without leaving the
 * form. Used by the product editor, the content blocks, categories and the
 * line sheet setting. Only files that finished processing can be chosen.
 */
export function MediaPicker({ open, onClose, onSelect, allowed = ['image'], multiple = false, title, excludeIds = [] }: MediaPickerProps) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<Media[]>([]);
  const single = allowed.length === 1 ? allowed[0] : undefined;

  // Start fresh each time the picker opens.
  useEffect(() => {
    if (open) {
      setChosen([]);
      setQ('');
      setPage(1);
    }
  }, [open]);

  const { data, isFetching, isLoading } = useListMediaQuery(
    { page, limit: PAGE_SIZE, status: 'ready', ...(single ? { type: single } : {}), ...(q.trim() ? { q: q.trim() } : {}) },
    { skip: !open },
  );
  const items = (data?.items ?? []).filter((m) => allowed.includes(m.type));

  const toggle = (m: Media) =>
    setChosen((list) => {
      if (list.some((x) => x.id === m.id)) return list.filter((x) => x.id !== m.id);
      return multiple ? [...list, m] : [m];
    });

  const confirm = () => {
    onSelect(chosen);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? (multiple ? 'Choose files' : 'Choose a file')}
      className="max-w-4xl"
      footer={
        <>
          <span className="mr-auto self-center text-sm text-ink-soft">{chosen.length ? `${chosen.length} selected` : 'Nothing selected'}</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={chosen.length === 0} onClick={confirm}>
            Use {multiple && chosen.length > 1 ? `${chosen.length} files` : 'this file'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <UploadDropzone
          allowed={allowed}
          multiple={multiple}
          onReady={(m) => setChosen((list) => (multiple ? [...list, m] : [m]))}
        />

        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by file name…"
            aria-label="Search files"
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-ink-soft">No files found. Upload one above.</p>
        ) : (
          <ul className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6', isFetching && 'opacity-60')}>
            {items.map((m) => {
              const picked = chosen.some((x) => x.id === m.id);
              const used = excludeIds.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={used}
                    onClick={() => toggle(m)}
                    aria-pressed={picked}
                    className={cn(
                      'group relative block w-full overflow-hidden rounded-xl border bg-white text-left transition',
                      picked ? 'border-terracotta-500 ring-2 ring-terracotta-500' : 'border-admin-line hover:border-sand-400',
                      used && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <div className="aspect-[4/5]">
                      <MediaThumb media={m} sizes="160px" />
                    </div>
                    {picked && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-terracotta-500 text-white">
                        <Icon name="check" className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="block truncate px-2 py-1.5 text-xs text-ink-soft">{m.originalName ?? 'Untitled'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-ink-soft">
              Page {page} of {data.meta.totalPages}
            </span>
            <Button size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
