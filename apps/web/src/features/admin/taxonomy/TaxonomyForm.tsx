'use client';

import { useState } from 'react';
import { Button, Callout, Card, CardBody, CardHeader, Field, Input, Textarea, useToast } from '@/components/admin';
import { ConfirmDialog } from '@/components/admin/forms/ConfirmDialog';
import { NumberInput } from '@/components/admin/forms/NumberInput';
import { ToggleRow } from '@/components/admin/forms/ToggleRow';
import { MediaPicker } from '@/components/admin/media/MediaPicker';
import { MediaThumb } from '@/components/admin/media/MediaThumb';
import { useCreateTaxonomyMutation, useDeleteTaxonomyMutation, useUpdateTaxonomyMutation, type TaxonomyKind } from '@/store/admin/taxonomyApi';
import { errorMessage, fieldErrors } from '@/store/baseApi';
import type { Media, Taxonomy } from '@/types/api';

interface Draft {
  name: string;
  slug: string;
  description: string;
  image: Media | null;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
}

const blank = (order: number): Draft => ({ name: '', slug: '', description: '', image: null, order, isActive: true, showOnHome: false });
const fromItem = (t: Taxonomy): Draft => ({ name: t.name, slug: t.slug, description: t.description, image: t.image, order: t.order, isActive: t.isActive, showOnHome: t.showOnHome });

interface TaxonomyFormProps {
  kind: TaxonomyKind;
  /** The item being edited, or null to create a new one. */
  item: Taxonomy | null;
  nextOrder: number;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}

/**
 * Create or edit a category or collection. The parent gives it a key per item,
 * so choosing another item starts a fresh form. Saving sends only what changed.
 */
export function TaxonomyForm({ kind, item, nextOrder, onSaved, onDeleted }: TaxonomyFormProps) {
  const toast = useToast();
  const singular = kind === 'categories' ? 'category' : 'collection';
  const [draft, setDraft] = useState<Draft>(() => (item ? fromItem(item) : blank(nextOrder)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [create, { isLoading: creating }] = useCreateTaxonomyMutation();
  const [update, { isLoading: updating }] = useUpdateTaxonomyMutation();
  const [remove, { isLoading: removing }] = useDeleteTaxonomyMutation();

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
  };

  async function save() {
    if (draft.name.trim().length < 2) {
      setErrors({ name: 'Enter a name of at least 2 characters' });
      return;
    }
    const base = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      imageMediaId: draft.image?.id ?? null,
      order: draft.order,
      isActive: draft.isActive,
      showOnHome: draft.showOnHome,
    };
    try {
      if (item) {
        const saved = await update({ kind, id: item.id, body: { ...base, ...(draft.slug.trim() && draft.slug.trim() !== item.slug ? { slug: draft.slug.trim() } : {}) } }).unwrap();
        toast('Saved');
        onSaved(saved.id);
      } else {
        const saved = await create({ kind, body: { ...base, ...(draft.slug.trim() ? { slug: draft.slug.trim() } : {}) } }).unwrap();
        toast(`${singular[0]!.toUpperCase()}${singular.slice(1)} created`);
        onSaved(saved.id);
      }
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), 'error');
    }
  }

  async function confirmDelete() {
    if (!item) return;
    try {
      await remove({ kind, id: item.id }).unwrap();
      toast('Deleted');
      setConfirming(false);
      onDeleted();
    } catch (err) {
      // 409: products still use it. The API's message says what to do.
      setBlocked(errorMessage(err));
      setConfirming(false);
    }
  }

  return (
    <Card className="self-start lg:sticky lg:top-[84px]">
      <CardHeader title={item ? `Edit ${singular}` : `New ${singular}`} />
      <CardBody className="space-y-3.5">
        {blocked && <Callout tone="warn">{blocked}</Callout>}
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Name" htmlFor="t-name" error={errors.name}>
            <Input id="t-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} invalid={!!errors.name} />
          </Field>
          <Field label="Slug" htmlFor="t-slug" error={errors.slug} hint={item ? 'Changing it changes the page address.' : 'Empty creates it from the name.'}>
            <Input id="t-slug" value={draft.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} invalid={!!errors.slug} />
          </Field>
        </div>
        <Field label="Short description" htmlFor="t-desc" hint="Shown on the landing page and in the homepage tile." error={errors.description}>
          <Textarea id="t-desc" value={draft.description} maxLength={400} className="min-h-[70px]" onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div>
          <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Banner / tile image</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-16 overflow-hidden rounded-[10px] border border-admin-line bg-sand-200">{draft.image && <MediaThumb media={draft.image} sizes="128px" />}</div>
            <Button size="sm" onClick={() => setPicking(true)}>
              {draft.image ? 'Replace image' : 'Choose image'}
            </Button>
            {draft.image && (
              <Button size="sm" variant="ghost" onClick={() => set({ image: null })}>
                Remove
              </Button>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-mute">Used on the homepage “Shop by {singular}” tile and the page banner.</p>
        </div>
        <Field label="Display order" htmlFor="t-order" hint="Lower numbers come first. You can also move items in the list." error={errors.order}>
          <NumberInput id="t-order" value={draft.order} max={10000} onChange={(order) => set({ order })} className="max-w-[140px]" />
        </Field>
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          <ToggleRow checked={draft.isActive} onChange={(isActive) => set({ isActive })} label="Active (visible on the website)" />
          <ToggleRow checked={draft.showOnHome} onChange={(showOnHome) => set({ showOnHome })} label="Show on the homepage" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="primary" onClick={save} disabled={creating || updating}>
            {item ? 'Save' : `Create ${singular}`}
          </Button>
          {item && (
            <Button variant="danger" onClick={() => setConfirming(true)}>
              Delete
            </Button>
          )}
        </div>
      </CardBody>

      <MediaPicker open={picking} onClose={() => setPicking(false)} onSelect={(files) => files[0] && set({ image: files[0] })} title={`Choose the ${singular} image`} />
      <ConfirmDialog
        open={confirming}
        title={`Delete this ${singular}?`}
        message={`“${item?.name ?? ''}” will be removed. If products still use it, it is refused and you are told what to move first.`}
        confirmLabel="Delete"
        danger
        busy={removing}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
