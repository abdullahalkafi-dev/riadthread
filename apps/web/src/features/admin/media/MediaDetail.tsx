'use client';

import { useState } from 'react';
import { Badge, Button, Callout, Drawer, DrawerBody, DrawerFooter, DrawerHeader, Icon, IconButton, useToast } from '@/components/admin';
import { ConfirmDialog } from '@/components/admin/forms/ConfirmDialog';
import { MediaThumb, mediaKindLabel } from '@/components/admin/media/MediaThumb';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { useDeleteMediaMutation, useRetryMediaMutation } from '@/store/admin/mediaApi';
import { errorMessage } from '@/store/baseApi';
import type { Media } from '@/types/api';
import { formatBytes, formatDateTime } from '../shared/format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-mute">{label}</dt>
      <dd className="m-0 break-words font-medium">{children}</dd>
    </>
  );
}

function Preview({ media }: { media: Media }) {
  if (media.type === 'image' && media.status === 'ready') {
    return (
      <div className="overflow-hidden rounded-xl bg-sand-200">
        <ResponsiveImage media={media} alt={media.originalName ?? ''} sizes="560px" className="mx-auto max-h-[420px] w-auto object-contain" />
      </div>
    );
  }
  if (media.type === 'video' && media.url) {
    return <video src={media.url} poster={media.posterUrl ?? undefined} controls preload="metadata" className="max-h-[360px] w-full rounded-xl bg-night-900" />;
  }
  return (
    <div className="aspect-[4/3] max-h-[260px] overflow-hidden rounded-xl">
      <MediaThumb media={media} />
    </div>
  );
}

interface MediaDetailProps {
  media: Media | null;
  onClose: () => void;
}

/** One file in detail: preview, facts, its public link, and retry or delete. */
export function MediaDetail({ media, onClose }: MediaDetailProps) {
  const toast = useToast();
  const [retry, { isLoading: retrying }] = useRetryMediaMutation();
  const [remove, { isLoading: removing }] = useDeleteMediaMutation();
  const [confirming, setConfirming] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  async function copyLink() {
    if (!media?.url) return;
    try {
      await navigator.clipboard.writeText(new URL(media.url, window.location.origin).toString());
      toast('Link copied');
    } catch {
      toast('Your browser would not copy the link', 'error');
    }
  }

  async function retryProcessing() {
    if (!media) return;
    try {
      await retry(media.id).unwrap();
      toast('Processing again');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function confirmDelete() {
    if (!media) return;
    try {
      await remove(media.id).unwrap();
      toast('File deleted');
      setConfirming(false);
      onClose();
    } catch (err) {
      // The API refuses while a product, category or page still uses the file, and says where.
      setBlocked(errorMessage(err));
      setConfirming(false);
    }
  }

  return (
    <>
      <Drawer open={media !== null} onClose={onClose} label="File details">
        {media && (
          <>
            <DrawerHeader className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-xl">{media.originalName ?? 'Untitled file'}</h2>
                <div className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-soft">
                  {mediaKindLabel(media.type)}
                  <Badge tone={media.status}>{media.status[0]!.toUpperCase() + media.status.slice(1)}</Badge>
                </div>
              </div>
              <IconButton aria-label="Close" onClick={onClose}>
                <Icon name="x" />
              </IconButton>
            </DrawerHeader>
            <DrawerBody className="space-y-4">
              <Preview media={media} />
              {media.status === 'failed' && <Callout tone="error">{media.error ?? 'Processing failed.'} You can try again, or delete the file and upload a fresh copy.</Callout>}
              {blocked && <Callout tone="warn">{blocked}</Callout>}
              <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-[13.5px]">
                <Row label="File size">{formatBytes(media.bytes)}</Row>
                {media.width && media.height && <Row label="Dimensions">{media.width} × {media.height} px</Row>}
                {media.durationSec !== null && <Row label="Length">{media.durationSec} s</Row>}
                <Row label="Type">{media.mime}</Row>
                <Row label="Uploaded">{formatDateTime(media.createdAt)}</Row>
                {media.url && (
                  <Row label="Public link">
                    <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 text-terracotta-600 underline">
                      <Icon name="copy" className="h-4 w-4" />
                      Copy link
                    </button>
                  </Row>
                )}
              </dl>
            </DrawerBody>
            <DrawerFooter>
              {media.status === 'failed' && (
                <Button onClick={retryProcessing} disabled={retrying}>
                  <Icon name="refresh" />
                  Try again
                </Button>
              )}
              <Button
                variant="danger"
                className="ml-auto"
                onClick={() => {
                  setBlocked(null);
                  setConfirming(true);
                }}
              >
                <Icon name="trash" />
                Delete
              </Button>
            </DrawerFooter>
          </>
        )}
      </Drawer>
      <ConfirmDialog
        open={confirming}
        title="Delete this file?"
        message="It is removed from storage for good. If a product or page uses it, the delete is refused and you are told where."
        confirmLabel="Delete file"
        danger
        busy={removing}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
