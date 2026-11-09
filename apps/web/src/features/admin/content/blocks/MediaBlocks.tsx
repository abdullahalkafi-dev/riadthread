'use client';

import { useState } from 'react';
import { Button, Field, Icon, Input, Textarea } from '@/components/admin';
import { MediaField } from '@/components/admin/media/MediaField';
import { MediaPicker } from '@/components/admin/media/MediaPicker';
import { MediaThumb } from '@/components/admin/media/MediaThumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetMediaQuery } from '@/store/admin/mediaApi';
import type { BlockData } from '@/types/api';
import { AddItemButton, ItemFrame, moveItem } from './ListControls';
import { defineBlock, type BlockEditorProps } from './types';

/* ----------------------------------- hero --------------------------------- */

type Slide = BlockData<'hero'>['slides'][number];

function HeroEditor({ value, onChange, errors }: BlockEditorProps<BlockData<'hero'>>) {
  const setSlide = (index: number, patch: Partial<Slide>) => onChange({ slides: value.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  return (
    <div className="space-y-3">
      {value.slides.length === 0 && <p className="text-sm text-ink-soft">No slides yet. Add at least one so the homepage has a hero.</p>}
      {value.slides.map((slide, i) => (
        <ItemFrame key={i} noun="slide" index={i} count={value.slides.length} onMove={(to) => onChange({ slides: moveItem(value.slides, i, to) })} onRemove={() => onChange({ slides: value.slides.filter((_, j) => j !== i) })}>
          <MediaField mediaId={slide.mediaId} onChange={(mediaId) => setSlide(i, { mediaId })} noun="slide image" />
          <Field label="Title" htmlFor={`slide-title-${i}`} error={errors[`slides.${i}.title`]}>
            <Input id={`slide-title-${i}`} value={slide.title} maxLength={120} onChange={(e) => setSlide(i, { title: e.target.value })} invalid={!!errors[`slides.${i}.title`]} />
          </Field>
          <Field label="Subtitle" htmlFor={`slide-sub-${i}`}>
            <Textarea id={`slide-sub-${i}`} value={slide.subtitle} maxLength={300} className="min-h-[56px]" onChange={(e) => setSlide(i, { subtitle: e.target.value })} />
          </Field>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Button text" htmlFor={`slide-cta-text-${i}`}>
              <Input id={`slide-cta-text-${i}`} value={slide.cta?.text ?? ''} maxLength={60} onChange={(e) => setSlide(i, { cta: { text: e.target.value, href: slide.cta?.href ?? '' } })} placeholder="Start an enquiry" />
            </Field>
            <Field label="Button link" htmlFor={`slide-cta-href-${i}`} hint="A page on the site, e.g. /enquiry">
              <Input id={`slide-cta-href-${i}`} value={slide.cta?.href ?? ''} onChange={(e) => setSlide(i, { cta: { text: slide.cta?.text ?? '', href: e.target.value } })} placeholder="/enquiry" />
            </Field>
          </div>
        </ItemFrame>
      ))}
      <AddItemButton noun="slide" disabled={value.slides.length >= 4} onClick={() => onChange({ slides: [...value.slides, { title: '', subtitle: '', mediaId: null }] })} />
      {value.slides.length >= 4 && <p className="text-xs text-ink-mute">The hero takes up to 4 slides.</p>}
    </div>
  );
}

export const heroBlock = defineBlock({ key: 'hero', title: 'Hero slides', description: 'The rotating banner at the top of the homepage (up to 4 slides).', Editor: HeroEditor });

/* --------------------------------- lookbook -------------------------------- */

function LookbookTile({ mediaId, onRemove, onMove, index, count }: { mediaId: string; onRemove: () => void; onMove: (to: number) => void; index: number; count: number }) {
  const { data, isLoading } = useGetMediaQuery(mediaId);
  return (
    <li className="w-[120px]">
      <div className="aspect-[4/5] overflow-hidden rounded-[10px] border border-admin-line bg-sand-200">{isLoading ? <Skeleton className="h-full w-full rounded-none" /> : data && <MediaThumb media={data} sizes="160px" />}</div>
      <div className="mt-1 flex justify-between">
        <Button size="sm" variant="ghost" disabled={index === 0} aria-label={`Move image ${index + 1} earlier`} onClick={() => onMove(index - 1)}>
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="danger" aria-label={`Remove image ${index + 1}`} onClick={onRemove}>
          <Icon name="x" className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" disabled={index === count - 1} aria-label={`Move image ${index + 1} later`} onClick={() => onMove(index + 1)}>
          <Icon name="chevronRight" className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function LookbookEditor({ value, onChange, errors }: BlockEditorProps<BlockData<'lookbook'>>) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="space-y-3.5">
      <Field label="Heading" htmlFor="look-heading" error={errors.heading}>
        <Input id="look-heading" value={value.heading} maxLength={120} onChange={(e) => onChange({ ...value, heading: e.target.value })} invalid={!!errors.heading} />
      </Field>
      <div>
        <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Images (up to 8)</span>
        <ul className="flex flex-wrap gap-3">
          {value.mediaIds.map((id, i) => (
            <LookbookTile
              key={id}
              mediaId={id}
              index={i}
              count={value.mediaIds.length}
              onMove={(to) => onChange({ ...value, mediaIds: moveItem(value.mediaIds, i, to) })}
              onRemove={() => onChange({ ...value, mediaIds: value.mediaIds.filter((m) => m !== id) })}
            />
          ))}
        </ul>
        <div className="mt-2.5">
          <Button size="sm" disabled={value.mediaIds.length >= 8} onClick={() => setPicking(true)}>
            <Icon name="plus" />
            Add images
          </Button>
        </div>
      </div>
      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        multiple
        excludeIds={value.mediaIds}
        title="Add lookbook images"
        onSelect={(files) => onChange({ ...value, mediaIds: [...value.mediaIds, ...files.map((f) => f.id)].slice(0, 8) })}
      />
    </div>
  );
}

export const lookbookBlock = defineBlock({ key: 'lookbook', title: 'Lookbook', description: 'A gallery of styled photos.', Editor: LookbookEditor });

/* --------------------------------- brand film ------------------------------ */

function BrandFilmEditor({ value, onChange, errors }: BlockEditorProps<BlockData<'brandFilm'>>) {
  return (
    <div className="space-y-3.5">
      <Field label="Heading" htmlFor="film-heading" error={errors.heading}>
        <Input id="film-heading" value={value.heading} maxLength={120} onChange={(e) => onChange({ ...value, heading: e.target.value })} invalid={!!errors.heading} />
      </Field>
      <div>
        <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Film (MP4 or WebM)</span>
        <MediaField mediaId={value.mediaId} onChange={(mediaId) => onChange({ ...value, mediaId })} allowed={['video']} noun="video" />
      </div>
      <div>
        <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Poster image</span>
        <MediaField mediaId={value.posterMediaId} onChange={(posterMediaId) => onChange({ ...value, posterMediaId })} noun="poster image" />
        <p className="mt-1 text-xs text-ink-mute">Shown before the film plays.</p>
      </div>
    </div>
  );
}

export const brandFilmBlock = defineBlock({ key: 'brandFilm', title: 'Brand film', description: 'A short film on the homepage.', Editor: BrandFilmEditor });
