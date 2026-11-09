'use client';

import { useState } from 'react';
import { COLOUR_FAMILIES, SIZE_PRESETS, STOCK_STATUSES } from '@riad/shared';
import { Button, Card, CardBody, CardHeader, Chip, EmptyState, Field, Icon, Input, Select } from '@/components/admin';
import { MediaPicker } from '@/components/admin/media/MediaPicker';
import { MediaThumb } from '@/components/admin/media/MediaThumb';
import { cn } from '@/lib/cn';
import type { Media } from '@/types/api';
import { GUIDE_DEFAULTS, guideRows, newObjectId, type ColourDraft } from '../formModel';
import type { TabProps } from './types';

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function ColoursCard({ draft, update, errors, goTo }: TabProps) {
  const [pickFor, setPickFor] = useState<string | null>(null);

  const change = (id: string, patch: Partial<ColourDraft>) => update({ colours: draft.colours.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  function addColour() {
    // New colours start with the first photo as their swatch, which the owner can replace.
    const first = draft.media.find((m) => m.media?.type === 'image');
    update({
      colours: [
        ...draft.colours,
        {
          id: newObjectId(),
          name: 'New colour',
          hex: '#b9603f',
          family: 'Neutral',
          sku: '',
          stock: 'In stock',
          swatchMediaId: first?.mediaId ?? null,
          swatch: first?.media ?? null,
        },
      ],
    });
  }

  function removeColour(id: string) {
    update({
      colours: draft.colours.filter((c) => c.id !== id),
      // Photos tagged with the removed colour go back to "all colours".
      media: draft.media.map((m) => (m.colourId === id ? { ...m, colourId: null } : m)),
    });
  }

  const onPick = (picked: Media[]) => {
    const file = picked[0];
    if (file && pickFor) change(pickFor, { swatchMediaId: file.id, swatch: file });
  };

  return (
    <Card>
      <CardHeader
        title={
          <>
            Colour variants
            <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">Each colour has a swatch and its own photos. On the site, picking a colour switches the gallery.</span>
          </>
        }
        action={
          <Button size="sm" onClick={addColour}>
            <Icon name="plus" />
            Add colour
          </Button>
        }
      />
      <CardBody className="space-y-2">
        {draft.colours.length === 0 && <EmptyState>No colours yet. Add at least one: the first colour is the default.</EmptyState>}
        {draft.colours.map((c, i) => {
          const photos = draft.media.filter((m) => m.colourId === c.id).length;
          return (
            <div key={c.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-admin-line bg-white p-3">
              <input
                type="color"
                value={c.hex}
                onChange={(e) => change(c.id, { hex: e.target.value })}
                aria-label={`Swatch colour for ${c.name}`}
                className="h-[42px] w-[42px] flex-none cursor-pointer rounded-full border border-admin-line bg-white p-0.5"
              />
              <Field label="Colour name" htmlFor={`c-name-${c.id}`} error={errors[`colours.${i}.name`]} className="min-w-[150px] flex-[1.2]">
                <Input id={`c-name-${c.id}`} value={c.name} onChange={(e) => change(c.id, { name: e.target.value })} invalid={!!errors[`colours.${i}.name`]} />
              </Field>
              <Field label="Colour family (filter)" htmlFor={`c-fam-${c.id}`} className="min-w-[120px] flex-1">
                <Select id={`c-fam-${c.id}`} value={c.family} onChange={(e) => change(c.id, { family: e.target.value })}>
                  {COLOUR_FAMILIES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </Field>
              <Field label="SKU" htmlFor={`c-sku-${c.id}`} className="min-w-[110px] flex-1">
                <Input id={`c-sku-${c.id}`} value={c.sku} onChange={(e) => change(c.id, { sku: e.target.value })} />
              </Field>
              <Field label="Stock" htmlFor={`c-stock-${c.id}`} className="min-w-[120px] flex-1">
                <Select id={`c-stock-${c.id}`} value={c.stock} onChange={(e) => change(c.id, { stock: e.target.value })}>
                  {STOCK_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
              <div className="text-center">
                <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Swatch photo</span>
                <button
                  type="button"
                  onClick={() => setPickFor(c.id)}
                  aria-label={`Choose the swatch photo for ${c.name}`}
                  className={cn('h-[50px] w-10 overflow-hidden rounded-[10px] border', c.swatch ? 'border-admin-line' : 'border-admin-danger')}
                >
                  {c.swatch ? <MediaThumb media={c.swatch} sizes="80px" /> : <span className="text-[11px] text-admin-danger">none</span>}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={() => goTo?.('media', c.id)}>
                  {photos} photo{photos === 1 ? '' : 's'}
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => update({ colours: move(draft.colours, i, i - 1) })}>
                  <Icon name="up" />
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Move ${c.name} down`} disabled={i === draft.colours.length - 1} onClick={() => update({ colours: move(draft.colours, i, i + 1) })}>
                  <Icon name="down" />
                </Button>
                <Button size="sm" variant="danger" aria-label={`Remove ${c.name}`} onClick={() => removeColour(c.id)}>
                  <Icon name="x" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardBody>
      <MediaPicker open={pickFor !== null} onClose={() => setPickFor(null)} onSelect={onPick} title="Choose the swatch photo" />
    </Card>
  );
}

function SizesCard({ draft, update, errors }: TabProps) {
  const [text, setText] = useState('');

  function addSize() {
    const label = text.trim();
    if (!label || draft.sizes.some((s) => s.label.toLowerCase() === label.toLowerCase())) return;
    update({ sizes: [...draft.sizes, { label, available: true }] });
    setText('');
  }

  return (
    <Card>
      <CardHeader
        title={
          <>
            Sizes
            <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">Click a size to mark it unavailable. Retailers enter a quantity per size.</span>
          </>
        }
      />
      <CardBody>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {draft.sizes.map((s, i) => (
            <span
              key={s.label}
              className={cn('inline-flex items-center gap-2 rounded-[10px] border bg-sand-50 px-3 py-[7px] font-semibold', s.available ? 'border-sand-400' : 'border-dashed border-sand-400 line-through opacity-55')}
            >
              <button type="button" onClick={() => update({ sizes: draft.sizes.map((x, j) => (j === i ? { ...x, available: !x.available } : x)) })} aria-pressed={!s.available} title="Click to mark available or unavailable">
                {s.label}
                {!s.available && ' · unavailable'}
              </button>
              <button type="button" aria-label={`Remove size ${s.label}`} className="font-normal text-ink-mute hover:text-admin-danger" onClick={() => update({ sizes: draft.sizes.filter((_, j) => j !== i) })}>
                ×
              </button>
            </span>
          ))}
          {draft.sizes.length === 0 && <span className="text-sm text-ink-soft">No sizes yet.</span>}
          <form
            className="flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              addSize();
            }}
          >
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add size…" aria-label="New size" className="w-32 py-[7px]" />
            <Button size="sm" type="submit">
              Add
            </Button>
          </form>
        </div>
        {errors.sizes && <p className="mb-2 text-xs text-admin-danger">{errors.sizes}</p>}
        <p className="mb-1.5 text-[13px] text-ink-soft">Quick presets:</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SIZE_PRESETS).map(([name, labels]) => (
            <Chip key={name} onClick={() => update({ sizes: labels.map((label) => ({ label, available: true })) })}>
              {name}
            </Chip>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function SizeGuideCard({ draft, update }: TabProps) {
  const oneSize = draft.sizes.length === 1 && draft.sizes[0]!.label === 'One size';
  const rows = guideRows(draft);

  const setCell = (size: string, field: 'chest' | 'length' | 'uk', value: string) => {
    const next = rows.map((r) => (r.size === size ? { ...r, [field]: value } : r));
    update({ sizeGuide: next });
  };

  function fillTypical() {
    update({
      sizeGuide: rows.map((r) => {
        const d = GUIDE_DEFAULTS[r.size];
        return d && !r.chest && !r.length && !r.uk ? { size: r.size, chest: d[0], length: d[1], uk: d[2] } : r;
      }),
    });
  }

  return (
    <Card>
      <CardHeader
        title={
          <>
            Size guide
            <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">Shown in the “Size guide” tab. Leave a row empty to hide it.</span>
          </>
        }
        action={
          !oneSize && rows.length > 0 ? (
            <Button size="sm" onClick={fillTypical}>
              Fill typical measurements
            </Button>
          ) : undefined
        }
      />
      <CardBody className="overflow-x-auto">
        {oneSize || rows.length === 0 ? (
          <EmptyState>{oneSize ? 'One-size product: no size guide is shown.' : 'Add sizes above to fill in a size guide.'}</EmptyState>
        ) : (
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[.1em] text-ink-mute">
                <th className="px-2 pb-2">Size</th>
                <th className="px-2 pb-2">Chest (cm)</th>
                <th className="px-2 pb-2">Length (cm)</th>
                <th className="px-2 pb-2">UK size</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.size}>
                  <td className="px-2 py-1 font-semibold">{r.size}</td>
                  {(['chest', 'length', 'uk'] as const).map((f) => (
                    <td key={f} className="px-1.5 py-1">
                      <Input value={r[f]} onChange={(e) => setCell(r.size, f, e.target.value)} aria-label={`${r.size} ${f}`} className="py-[7px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}

export function VariantsTab(props: TabProps) {
  return (
    <div className="space-y-4">
      <ColoursCard {...props} />
      <SizesCard {...props} />
      <SizeGuideCard {...props} />
    </div>
  );
}
