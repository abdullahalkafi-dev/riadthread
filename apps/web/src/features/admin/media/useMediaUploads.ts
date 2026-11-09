'use client';

import { useCallback, useRef, useState } from 'react';
import type { MediaType } from '@riad/shared';
import { useAdminDispatch } from '@/store/admin/hooks';
import { mediaApi, useLazyGetMediaQuery } from '@/store/admin/mediaApi';
import type { Media } from '@/types/api';
import { uploadMedia } from './uploadMedia';
import { validateUpload } from './validateUpload';

export type UploadPhase = 'uploading' | 'processing' | 'ready' | 'failed';

export interface UploadItem {
  key: string;
  name: string;
  phase: UploadPhase;
  /** 0 to 1 while the bytes are being sent. */
  progress: number;
  error?: string;
  media?: Media;
}

const POLL_MS = 1500;
const POLL_LIMIT = 80; // about two minutes: long videos finish well within it

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Options {
  /** Which kinds of file this upload area takes. */
  allowed?: readonly MediaType[];
  /** Called once per file when it has finished processing and is ready to use. */
  onReady?: (media: Media) => void;
}

/**
 * Validates, uploads and then watches each file until the server has finished
 * processing it. Used by the media library and by the picker, so both behave the same.
 */
export function useMediaUploads({ allowed, onReady }: Options = {}) {
  const dispatch = useAdminDispatch();
  const [fetchMedia] = useLazyGetMediaQuery();
  const [items, setItems] = useState<UploadItem[]>([]);
  const counter = useRef(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const patch = useCallback((key: string, change: Partial<UploadItem>) => {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...change } : i)));
  }, []);

  const watch = useCallback(
    async (key: string, first: Media) => {
      let media = first;
      for (let i = 0; i < POLL_LIMIT && media.status === 'processing'; i++) {
        await wait(POLL_MS);
        try {
          media = await fetchMedia(media.id).unwrap();
        } catch {
          break;
        }
      }
      if (media.status === 'ready') {
        patch(key, { phase: 'ready', media });
        onReadyRef.current?.(media);
      } else {
        patch(key, { phase: 'failed', media, error: media.error ?? 'Processing took too long. Open the file in the library to retry it' });
      }
      dispatch(mediaApi.util.invalidateTags([{ type: 'Media', id: 'LIST' }]));
    },
    [dispatch, fetchMedia, patch],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const key = `u${++counter.current}`;
        const message = await validateUpload(file, allowed);
        if (message) {
          setItems((list) => [...list, { key, name: file.name, phase: 'failed', progress: 0, error: message }]);
          continue;
        }
        setItems((list) => [...list, { key, name: file.name, phase: 'uploading', progress: 0 }]);
        try {
          const media = await uploadMedia(file, (progress) => patch(key, { progress }));
          patch(key, { phase: 'processing', progress: 1, media });
          dispatch(mediaApi.util.invalidateTags([{ type: 'Media', id: 'LIST' }]));
          void watch(key, media);
        } catch (err) {
          patch(key, { phase: 'failed', error: err instanceof Error ? err.message : 'The upload failed' });
        }
      }
    },
    [allowed, dispatch, patch, watch],
  );

  const dismiss = useCallback((key: string) => setItems((list) => list.filter((i) => i.key !== key)), []);
  const clearFinished = useCallback(() => setItems((list) => list.filter((i) => i.phase === 'uploading' || i.phase === 'processing')), []);

  return { items, addFiles, dismiss, clearFinished };
}
