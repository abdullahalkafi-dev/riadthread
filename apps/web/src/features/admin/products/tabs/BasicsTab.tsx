'use client';

import { BADGES } from '@riad/shared';
import { Callout, Card, CardBody, Field, Input, Select, Textarea } from '@/components/admin';
import { NumberInput } from '@/components/admin/forms/NumberInput';
import { ToggleRow } from '@/components/admin/forms/ToggleRow';
import { useListTaxonomyQuery } from '@/store/admin/taxonomyApi';
import type { TabProps } from './types';

interface BasicsTabProps extends TabProps {
  /** True for an already saved product: its page address is no longer filled from the name. */
  saved: boolean;
}

export function BasicsTab({ draft, update, errors, saved }: BasicsTabProps) {
  const categories = useListTaxonomyQuery('categories');
  const collections = useListTaxonomyQuery('collections');
  const missing = categories.isSuccess && collections.isSuccess && (categories.data.length === 0 || collections.data.length === 0);

  return (
    <Card>
      <CardBody className="space-y-4 pt-[18px]">
        {missing && <Callout tone="warn">A product needs one category and one collection. Create them under Categories and Collections first.</Callout>}

        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Product name" htmlFor="p-name" error={errors.name}>
            <Input id="p-name" value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Fez Chiffon Djellaba" invalid={!!errors.name} />
          </Field>
          <Field
            label="Page address (slug)"
            htmlFor="p-slug"
            error={errors.slug}
            hint={
              saved
                ? 'Renaming keeps this address. Change it only if you must: links already shared will stop working.'
                : 'Leave empty to create it from the name.'
            }
          >
            <Input id="p-slug" value={draft.slug} onChange={(e) => update({ slug: e.target.value.toLowerCase() })} placeholder="fez-chiffon-djellaba" invalid={!!errors.slug} />
          </Field>
        </div>

        <div className="grid gap-3.5 md:grid-cols-3">
          <Field label="Code / SKU" htmlFor="p-code" error={errors.code}>
            <Input id="p-code" value={draft.code} onChange={(e) => update({ code: e.target.value })} placeholder="RT-DJ-104" invalid={!!errors.code} />
          </Field>
          <Field label="Category" htmlFor="p-cat" hint="One per product. Drives the catalogue category filter." error={errors.categoryId}>
            <Select id="p-cat" value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
              <option value="">Choose a category…</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Collection" htmlFor="p-col" hint="One per product. Drives the collection tabs." error={errors.collectionId}>
            <Select id="p-col" value={draft.collectionId} onChange={(e) => update({ collectionId: e.target.value })}>
              <option value="">Choose a collection…</option>
              {collections.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Badge on photo" htmlFor="p-badge" hint="A small label on the card, quick view and gallery.">
            <Select id="p-badge" value={draft.badge} onChange={(e) => update({ badge: e.target.value })}>
              {BADGES.map((b) => (
                <option key={b} value={b}>
                  {b === '' ? 'None' : b}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Display order" htmlFor="p-order" hint="Lower numbers appear first in the catalogue." error={errors.order}>
            <NumberInput id="p-order" value={draft.order} max={100000} onChange={(order) => update({ order })} />
          </Field>
        </div>

        <Field label="Short summary" htmlFor="p-summary" hint={`Shown under the product name and in quick view. ${draft.summary.length}/400`} error={errors.summary}>
          <Textarea id="p-summary" value={draft.summary} maxLength={400} className="!min-h-20" onChange={(e) => update({ summary: e.target.value })} />
        </Field>

        <div className="flex flex-wrap gap-x-7 gap-y-3">
          <ToggleRow checked={draft.featured} onChange={(featured) => update({ featured })} label="Featured on the homepage" />
          <ToggleRow checked={draft.newArrival} onChange={(newArrival) => update({ newArrival })} label="Show in “New arrivals”" />
        </div>
      </CardBody>
    </Card>
  );
}
