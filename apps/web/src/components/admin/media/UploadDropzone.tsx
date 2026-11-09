'use client';

import { useId, useState } from 'react';
import { UPLOAD_LIMITS, type MediaType } from '@riad/shared';
import { cn } from '@/lib/cn';
import { useMediaUploads } from '@/features/admin/media/useMediaUploads';
import { Button } from '../Button';
import { Icon } from '../Icon';
import type { Media } from '@/types/api';

const ACCEPT: Record<MediaType, string[]> = {
  image: [...UPLOAD_LIMITS.image.mimes],
  video: [...UPLOAD_LIMITS.video.mimes],
  model: ['.glb'],
  document: [...UPLOAD_LIMITS.document.mimes],
};

const RULES: Record<MediaType, string> = {
  image: `Images: JPG, PNG, WebP or AVIF, at least ${UPLOAD_LIMITS.image.minShortSide}px on the short side, up to ${UPLOAD_LIMITS.image.maxBytes / 1024 / 1024} MB`,
  video: `Video: MP4 or WebM, up to ${UPLOAD_LIMITS.video.maxBytes / 1024 / 1024} MB and ${UPLOAD_LIMITS.video.maxSeconds / 60} minutes`,
  model: `3D: GLB, up to ${UPLOAD_LIMITS.model.maxBytes / 1024 / 1024} MB`,
  document: `PDF, up to ${UPLOAD_LIMITS.document.maxBytes / 1024 / 1024} MB`,
};

interface UploadDropzoneProps {
  allowed?: readonly MediaType[];
  multiple?: boolean;
  /** Called for each file once it is processed and ready to use. */
  onReady?: (media: Media) => void;
  className?: string;
}

/** Drag-and-drop (or click) upload area with a live list of what is being uploaded and processed. */
export function UploadDropzone({ allowed = ['image', 'video', 'model', 'document'], multiple = true, onReady, className }: UploadDropzoneProps) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  const { items, addFiles, dismiss, clearFinished } = useMediaUploads({ allowed, ...(onReady ? { onReady } : {}) });

  const take = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    void addFiles(multiple ? Array.from(list) : [list[0]!]);
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-[14px] border-2 border-dashed bg-sand-50 p-5 text-center text-ink-soft transition',
          over ? 'border-terracotta-500 bg-[#f8e3d9]/40' : 'border-sand-400',
        )}
      >
        <Icon name="upload" className="mx-auto mb-1 h-6 w-6" />
        <p>
          <b className="font-semibold text-ink">Drop {multiple ? 'files' : 'a file'} here</b> or{' '}
          <label htmlFor={inputId} className="cursor-pointer underline">
            browse
          </label>
        </p>
        <ul className="mt-2 space-y-0.5 text-xs text-ink-mute">
          {allowed.map((t) => (
            <li key={t}>{RULES[t]}</li>
          ))}
        </ul>
        <input
          id={inputId}
          type="file"
          className="sr-only"
          multiple={multiple}
          accept={allowed.flatMap((t) => ACCEPT[t]).join(',')}
          onChange={(e) => {
            take(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-3 space-y-2" aria-live="polite">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3 rounded-[10px] border border-admin-line bg-white px-3 py-2 text-[13px]">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.name}</p>
                {item.phase === 'failed' ? (
                  <p className="text-admin-danger">{item.error}</p>
                ) : (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-200" role="progressbar" aria-valuenow={Math.round(item.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={cn('h-full rounded-full transition-all', item.phase === 'ready' ? 'bg-admin-ok' : 'bg-terracotta-500', item.phase === 'processing' && 'animate-pulse')}
                      style={{ width: `${Math.round(item.progress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-ink-soft">
                {item.phase === 'uploading' && `${Math.round(item.progress * 100)}%`}
                {item.phase === 'processing' && 'Processing…'}
                {item.phase === 'ready' && 'Ready'}
              </span>
              {(item.phase === 'failed' || item.phase === 'ready') && (
                <button type="button" onClick={() => dismiss(item.key)} className="text-ink-mute hover:text-ink" aria-label={`Dismiss ${item.name}`}>
                  <Icon name="x" className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {items.some((i) => i.phase === 'ready' || i.phase === 'failed') && (
            <Button size="sm" variant="ghost" onClick={clearFinished}>
              Clear finished
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
