'use client';

import { Field, Input, Textarea } from '@/components/admin';
import { ToggleRow } from '@/components/admin/forms/ToggleRow';
import { MediaField } from '@/components/admin/media/MediaField';
import type { BlockData } from '@/types/api';
import { AddItemButton, ItemFrame, moveItem } from './ListControls';
import { defineBlock, type BlockEditorProps } from './types';

/* ------------------------------ announcement ------------------------------ */

function AnnouncementEditor({ value, onChange, errors }: BlockEditorProps<BlockData<'announcement'>>) {
  return (
    <div className="space-y-3.5">
      <ToggleRow checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="Show the announcement bar" />
      <Field label="Message" htmlFor="ann-message" error={errors.message} hint="One short line, shown above the header.">
        <Input id="ann-message" value={value.message} maxLength={200} onChange={(e) => onChange({ ...value, message: e.target.value })} invalid={!!errors.message} />
      </Field>
      <Field label="Link (optional)" htmlFor="ann-href" hint="A page on the site, e.g. /collections/ramadan-eid" error={errors.href}>
        <Input id="ann-href" value={value.href} onChange={(e) => onChange({ ...value, href: e.target.value })} />
      </Field>
    </div>
  );
}

export const announcementBlock = defineBlock({
  key: 'announcement',
  title: 'Announcement bar',
  description: 'A single line above the header, for dates and campaigns.',
  Editor: AnnouncementEditor,
});

/* --------------------------------- ramadan -------------------------------- */

function RamadanEditor({ value, onChange, errors }: BlockEditorProps<BlockData<'ramadan'>>) {
  return (
    <div className="space-y-3.5">
      <ToggleRow checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="Show the Ramadan campaign block" />
      <Field label="Heading" htmlFor="ram-heading" error={errors.heading}>
        <Input id="ram-heading" value={value.heading} maxLength={120} onChange={(e) => onChange({ ...value, heading: e.target.value })} invalid={!!errors.heading} />
      </Field>
      <Field label="Text" htmlFor="ram-text" error={errors.text}>
        <Textarea id="ram-text" value={value.text} maxLength={400} className="min-h-[70px]" onChange={(e) => onChange({ ...value, text: e.target.value })} />
      </Field>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Order-by date" htmlFor="ram-order" hint="Retailers should send enquiries before this day.">
          <Input id="ram-order" type="date" value={value.orderByDate ?? ''} onChange={(e) => onChange({ ...value, orderByDate: e.target.value || null })} />
        </Field>
        <Field label="Ramadan expected" htmlFor="ram-start">
          <Input id="ram-start" type="date" value={value.startDate ?? ''} onChange={(e) => onChange({ ...value, startDate: e.target.value || null })} />
        </Field>
      </div>
    </div>
  );
}

export const ramadanBlock = defineBlock({
  key: 'ramadan',
  title: 'Ramadan campaign',
  description: 'A seasonal band with an order-by date.',
  Editor: RamadanEditor,
});

/* ------------------- blocks that are a list of title + text ---------------- */

type TitledItems = { items: Array<{ title: string; text: string }> };

interface TitledListProps<V extends TitledItems> extends BlockEditorProps<V> {
  noun: string;
  max: number;
  /** Heading field, for blocks that have one. */
  heading?: { value: string; set: (heading: string) => void };
}

function TitledList<V extends TitledItems>({ value, onChange, errors, noun, max, heading }: TitledListProps<V>) {
  const setItem = (index: number, patch: Partial<V['items'][number]>) => onChange({ ...value, items: value.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  return (
    <div className="space-y-3">
      {heading && (
        <Field label="Section heading" htmlFor={`${noun}-heading`} error={errors.heading}>
          <Input id={`${noun}-heading`} value={heading.value} maxLength={120} onChange={(e) => heading.set(e.target.value)} />
        </Field>
      )}
      {value.items.map((item, i) => (
        <ItemFrame key={i} noun={noun} index={i} count={value.items.length} onMove={(to) => onChange({ ...value, items: moveItem(value.items, i, to) })} onRemove={() => onChange({ ...value, items: value.items.filter((_, j) => j !== i) })}>
          <Input value={item.title} maxLength={120} aria-label={`Title of ${noun} ${i + 1}`} placeholder="Title" invalid={!!errors[`items.${i}.title`]} onChange={(e) => setItem(i, { title: e.target.value } as Partial<V['items'][number]>)} />
          <Textarea value={item.text} maxLength={500} aria-label={`Text of ${noun} ${i + 1}`} placeholder="Short text (optional)" className="min-h-[56px]" onChange={(e) => setItem(i, { text: e.target.value } as Partial<V['items'][number]>)} />
        </ItemFrame>
      ))}
      <AddItemButton noun={noun} disabled={value.items.length >= max} onClick={() => onChange({ ...value, items: [...value.items, { title: '', text: '' }] })} />
    </div>
  );
}

function TrustEditor(props: BlockEditorProps<BlockData<'trust'>>) {
  return <TitledList {...props} noun="point" max={6} />;
}
function StepsEditor(props: BlockEditorProps<BlockData<'steps'>>) {
  return <TitledList {...props} noun="step" max={6} heading={{ value: props.value.heading, set: (heading) => props.onChange({ ...props.value, heading }) }} />;
}
function SupplyEditor(props: BlockEditorProps<BlockData<'supply'>>) {
  return <TitledList {...props} noun="retailer type" max={8} heading={{ value: props.value.heading, set: (heading) => props.onChange({ ...props.value, heading }) }} />;
}
function CraftEditor(props: BlockEditorProps<BlockData<'craft'>>) {
  return <TitledList {...props} noun="craft step" max={8} heading={{ value: props.value.heading, set: (heading) => props.onChange({ ...props.value, heading }) }} />;
}

export const trustBlock = defineBlock({ key: 'trust', title: 'Trust bar', description: 'Short reassurances under the hero, e.g. “48h UK dispatch”.', Editor: TrustEditor });
export const stepsBlock = defineBlock({ key: 'steps', title: 'How it works', description: 'The numbered steps from browsing to confirming an order.', Editor: StepsEditor });
export const supplyBlock = defineBlock({ key: 'supply', title: 'Who we supply', description: 'The kinds of retailer you work with.', Editor: SupplyEditor });
export const craftBlock = defineBlock({ key: 'craft', title: 'Craft', description: 'The story of how the pieces are made, step by step.', Editor: CraftEditor });

/* ----------------------------------- faq ---------------------------------- */

function FaqEditor({ value, onChange, errors }: BlockEditorProps<BlockData<'faq'>>) {
  const setItem = (index: number, patch: Partial<BlockData<'faq'>['items'][number]>) => onChange({ items: value.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  return (
    <div className="space-y-3">
      {value.items.map((item, i) => (
        <ItemFrame key={i} noun="question" index={i} count={value.items.length} onMove={(to) => onChange({ items: moveItem(value.items, i, to) })} onRemove={() => onChange({ items: value.items.filter((_, j) => j !== i) })}>
          <Input value={item.q} maxLength={200} aria-label={`Question ${i + 1}`} placeholder="Question" invalid={!!errors[`items.${i}.q`]} onChange={(e) => setItem(i, { q: e.target.value })} />
          <Textarea value={item.a} maxLength={2000} aria-label={`Answer ${i + 1}`} placeholder="Answer" className="min-h-[72px]" onChange={(e) => setItem(i, { a: e.target.value })} />
        </ItemFrame>
      ))}
      <AddItemButton noun="question" disabled={value.items.length >= 20} onClick={() => onChange({ items: [...value.items, { q: '', a: '' }] })} />
    </div>
  );
}

export const faqBlock = defineBlock({ key: 'faq', title: 'FAQ', description: 'Questions retailers ask before they enquire.', Editor: FaqEditor });

/* -------------------------------- heritage -------------------------------- */

function HeritageEditor({ value, onChange, errors }: BlockEditorProps<BlockData<'heritage'>>) {
  return (
    <div className="space-y-3.5">
      <Field label="Heading" htmlFor="her-heading" error={errors.heading}>
        <Input id="her-heading" value={value.heading} maxLength={120} onChange={(e) => onChange({ ...value, heading: e.target.value })} invalid={!!errors.heading} />
      </Field>
      <Field label="Story" htmlFor="her-body" error={errors.body}>
        <Textarea id="her-body" value={value.body} maxLength={2000} className="min-h-[120px]" onChange={(e) => onChange({ ...value, body: e.target.value })} />
      </Field>
      <div>
        <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Image</span>
        <MediaField mediaId={value.mediaId} onChange={(mediaId) => onChange({ ...value, mediaId })} noun="image" />
      </div>
    </div>
  );
}

export const heritageBlock = defineBlock({ key: 'heritage', title: 'Heritage story', description: 'The brand story with one large image.', Editor: HeritageEditor });
