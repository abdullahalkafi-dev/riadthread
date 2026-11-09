'use client';

import { useEffect, useState } from 'react';
import { LIMITS } from '@riad/shared';
import { Callout, Card, CardBody, CardHeader, Chip, Field, Input, Textarea } from '@/components/admin';
import { useListProductsQuery } from '@/store/admin/productsApi';
import type { TabProps } from './types';

interface SeoTabProps extends TabProps {
  /** The product being edited, so it is not offered as related to itself. */
  productId?: string | undefined;
}

export function SeoTab({ draft, update, errors, productId }: SeoTabProps) {
  const [host, setHost] = useState('riadthreads.co.uk');
  useEffect(() => setHost(window.location.host), []);
  const { data } = useListProductsQuery({ page: 1, limit: 100 });
  const candidates = (data?.items ?? []).filter((p) => p.id !== productId);

  const title = draft.seo.title || `${draft.name || 'Product name'} | Premium Moroccan Wholesale | Riad Threads`;
  const description = draft.seo.description || draft.summary;
  const full = draft.relatedIds.length >= LIMITS.relatedProducts;

  const toggleRelated = (id: string) =>
    update({ relatedIds: draft.relatedIds.includes(id) ? draft.relatedIds.filter((r) => r !== id) : full ? draft.relatedIds : [...draft.relatedIds, id] });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Search & sharing" />
        <CardBody className="space-y-3.5">
          <Field label="Meta title" htmlFor="seo-title" hint="Empty uses “Name | Premium Moroccan Wholesale | Riad Threads”." error={errors['seo.title']}>
            <Input id="seo-title" value={draft.seo.title} maxLength={120} onChange={(e) => update({ seo: { ...draft.seo, title: e.target.value } })} />
          </Field>
          <Field label="Meta description" htmlFor="seo-desc" hint={`Empty uses the short summary. ${draft.seo.description.length}/300`} error={errors['seo.description']}>
            <Textarea id="seo-desc" value={draft.seo.description} maxLength={300} className="min-h-[70px]" onChange={(e) => update({ seo: { ...draft.seo, description: e.target.value } })} />
          </Field>
          <div>
            <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Google preview</span>
            <div className="rounded-xl border border-admin-line bg-white p-3.5">
              <div className="text-[12.5px] text-[#1a6b45]">
                {host} › products › {draft.slug || '…'}
              </div>
              <div className="my-0.5 text-lg text-[#1a0dab]">{title}</div>
              <div className="text-[13px] text-[#4d5156]">{description || 'Add a summary or a meta description.'}</div>
            </div>
          </div>
          <Callout>Link previews (WhatsApp, Instagram, Facebook) use the cover image automatically.</Callout>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <>
              “Retailers also enquire about”
              <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">Up to {LIMITS.relatedProducts}. Leave empty to show products from the same category.</span>
            </>
          }
        />
        <CardBody className="flex flex-wrap gap-2">
          {candidates.length === 0 && <p className="text-sm text-ink-soft">There are no other products yet.</p>}
          {candidates.map((p) => {
            const on = draft.relatedIds.includes(p.id);
            return (
              <Chip key={p.id} active={on} onClick={() => (on || !full ? toggleRelated(p.id) : undefined)}>
                {p.name}
              </Chip>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
