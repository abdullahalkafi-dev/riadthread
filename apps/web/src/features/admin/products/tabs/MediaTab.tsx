'use client';

import { useState } from 'react';
import { Button, Callout, Card, CardBody, Chip, EmptyState, Icon, Input, Select } from '@/components/admin';
import { MediaPicker } from '@/components/admin/media/MediaPicker';
import { MediaThumb, mediaKindLabel } from '@/components/admin/media/MediaThumb';
import { UploadDropzone } from '@/components/admin/media/UploadDropzone';
import { cn } from '@/lib/cn';
import type { Media } from '@/types/api';
import type { MediaDraft } from '../formModel';
import type { TabProps } from './types';

const ALLOWED = ['image', 'video', 'model'] as const;
export const ALL_COLOURS = 'all';

interface MediaTabProps extends TabProps {
  /** "all" or a colour id: which photos are shown. */
  colourFilter: string;
  onColourFilter: (value: string) => void;
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function MediaTab({ draft, update, errors, colourFilter, onColourFilter }: MediaTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const reorderable = colourFilter === ALL_COLOURS;

  const add = (files: Media[]) =>
    update((current) => {
      const have = new Set(current.media.map((m) => m.mediaId));
      const fresh: MediaDraft[] = files
        .filter((f) => !have.has(f.id))
        // A photo opened from one colour's list is tagged with that colour straight away.
        .map((f) => ({ mediaId: f.id, colourId: colourFilter === ALL_COLOURS ? null : colourFilter, alt: current.name, media: f }));
      return { media: [...current.media, ...fresh] };
    });

  const change = (index: number, patch: Partial<MediaDraft>) => update({ media: draft.media.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  const shown = draft.media.map((m, index) => ({ m, index })).filter(({ m }) => colourFilter === ALL_COLOURS || m.colourId === colourFilter);
  const missingAlt = draft.media.filter((m) => !m.alt.trim()).length;

  return (
    <Card>
      <CardBody className="space-y-4 pt-[18px]">
        <UploadDropzone allowed={ALLOWED} onReady={(file) => add([file])} />
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter photos by colour">
            <Chip active={colourFilter === ALL_COLOURS} count={draft.media.length} onClick={() => onColourFilter(ALL_COLOURS)}>
              All media
            </Chip>
            {draft.colours.map((c) => (
              <Chip key={c.id} active={colourFilter === c.id} count={draft.media.filter((m) => m.colourId === c.id).length} onClick={() => onColourFilter(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <Icon name="img" />
            Choose from library
          </Button>
        </div>

        {errors.media && <Callout tone="error">{errors.media}</Callout>}
        {missingAlt > 0 && (
          <Callout tone="warn">
            {missingAlt} item{missingAlt > 1 ? 's are' : ' is'} missing alt text. It describes the photo for search engines and screen readers, and is needed to publish.
          </Callout>
        )}

        <p className="text-[13px] text-ink-soft">
          {reorderable ? (
            <>
              <b>Drag to reorder</b> (or use the arrows). This is exactly the order on the product page: 1st is the cover, 2nd is the hover image on cards. Tag a photo with a colour so it appears when that colour is picked.
            </>
          ) : (
            <>Showing photos tagged with this colour. Switch to “All media” to change the order.</>
          )}
        </p>

        {shown.length === 0 ? (
          <EmptyState>{reorderable ? 'No media yet. Drop files above or choose them from the library.' : 'No photos are tagged with this colour yet.'}</EmptyState>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
            {shown.map(({ m, index }) => (
              <li
                key={m.mediaId}
                draggable={reorderable}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(e) => reorderable && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) update({ media: move(draft.media, dragIndex, index) });
                  setDragIndex(null);
                }}
                className={cn('group relative overflow-hidden rounded-xl border border-admin-line bg-white', reorderable && 'cursor-grab', dragIndex === index && 'opacity-35')}
              >
                <div className="relative aspect-[4/5]">
                  {m.media ? <MediaThumb media={m.media} sizes="200px" /> : <div className="grid h-full place-items-center bg-sand-200 text-xs text-ink-mute">File missing</div>}
                  <span className="absolute left-2 top-2 grid h-[26px] w-[26px] place-items-center rounded-full bg-ink text-xs font-bold text-white">{index + 1}</span>
                  {index === 0 && <span className="absolute right-2 top-2 rounded-[7px] bg-brass-400 px-[7px] py-0.5 text-[10.5px] font-bold text-night-900">Cover</span>}
                  {index === 1 && <span className="absolute right-2 top-2 rounded-[7px] bg-[#e1e8fb] px-[7px] py-0.5 text-[10.5px] font-bold text-majorelle-600">Hover</span>}
                  {m.media && <span className="absolute bottom-2 left-2 rounded-[7px] bg-night-900/80 px-2 py-0.5 text-[11px] text-white">{mediaKindLabel(m.media.type)}</span>}
                  <button
                    type="button"
                    aria-label="Remove from this product"
                    onClick={() => update({ media: draft.media.filter((_, i) => i !== index) })}
                    className="absolute bottom-2 right-2 hidden h-[26px] w-[26px] place-items-center rounded-full bg-night-900/75 text-white group-focus-within:grid group-hover:grid"
                  >
                    <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 p-2">
                  <Input
                    value={m.alt}
                    onChange={(e) => change(index, { alt: e.target.value })}
                    placeholder="Alt text (required)"
                    aria-label={`Alt text for item ${index + 1}`}
                    invalid={!m.alt.trim()}
                    className="px-2 py-1.5 text-xs"
                  />
                  <Select
                    value={m.colourId ?? ''}
                    onChange={(e) => change(index, { colourId: e.target.value || null })}
                    aria-label={`Colour for item ${index + 1}`}
                    className="px-2 py-1.5 text-xs"
                  >
                    <option value="">All colours</option>
                    {draft.colours.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {reorderable && (
                    <div className="flex justify-between">
                      <Button size="sm" variant="ghost" disabled={index === 0} aria-label={`Move item ${index + 1} earlier`} onClick={() => update({ media: move(draft.media, index, index - 1) })}>
                        <Icon name="chevronLeft" className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" disabled={index === draft.media.length - 1} aria-label={`Move item ${index + 1} later`} onClick={() => update({ media: move(draft.media, index, index + 1) })}>
                        <Icon name="chevronRight" className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={add}
        allowed={ALLOWED}
        multiple
        title="Add media to this product"
        excludeIds={draft.media.map((m) => m.mediaId)}
      />
    </Card>
  );
}
