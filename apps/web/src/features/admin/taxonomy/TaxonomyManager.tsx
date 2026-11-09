'use client';

import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Icon, PageHeader, QueryError, Toggle, useToast } from '@/components/admin';
import { MediaThumb } from '@/components/admin/media/MediaThumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { useListTaxonomyQuery, useUpdateTaxonomyMutation, type TaxonomyKind } from '@/store/admin/taxonomyApi';
import { errorMessage } from '@/store/baseApi';
import { TaxonomyForm } from './TaxonomyForm';

const COPY = {
  categories: {
    title: 'Categories',
    singular: 'category',
    description: 'A product has one category (Djellabas, Gandoras…). It feeds the catalogue filters and the “Shop by category” tiles.',
  },
  collections: {
    title: 'Collections',
    singular: 'collection',
    description: 'A product has one collection (Ramadan & Eid, Everyday…). It feeds the collection tabs and landing pages.',
  },
} as const;

const NEW = 'new';

/** List on the left, edit form on the right: the same screen for categories and collections. */
export function TaxonomyManager({ kind }: { kind: TaxonomyKind }) {
  const copy = COPY[kind];
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useListTaxonomyQuery(kind);
  const [update] = useUpdateTaxonomyMutation();
  const [selected, setSelected] = useState<string | null>(null);

  const items = data ?? [];
  // Open the first item once the list arrives; "new" and explicit choices are kept.
  const activeId = selected ?? items[0]?.id ?? NEW;
  const current = items.find((t) => t.id === activeId) ?? null;

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await update({ kind, id, body: { isActive } }).unwrap();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  /** Swaps an item with its neighbour and renumbers the list so the order is unambiguous. */
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    try {
      await Promise.all(
        reordered.flatMap((t, i) => (t.order === (i + 1) * 10 ? [] : [update({ kind, id: t.id, body: { order: (i + 1) * 10 } }).unwrap()])),
      );
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button variant="primary" onClick={() => setSelected(NEW)}>
            <Icon name="plus" />
            Add {copy.singular}
          </Button>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        <Card>
          {isError ? (
            <QueryError error={error} onRetry={refetch} />
          ) : isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState title={`No ${kind} yet`}>Add your first one with the button above.</EmptyState>
          ) : (
            <ul className="px-3.5 py-1.5">
              {items.map((t, i) => (
                <li key={t.id} className={cn('flex items-center gap-3 border-b border-admin-line py-3 last:border-0', t.id === activeId && '-mx-2 rounded-[10px] bg-sand-50 px-2')}>
                  <div className="flex flex-col">
                    <button type="button" aria-label={`Move ${t.name} up`} disabled={i === 0} onClick={() => move(i, -1)} className="text-ink-mute hover:text-ink disabled:opacity-30">
                      <Icon name="chevronDown" className="h-4 w-4 rotate-180" />
                    </button>
                    <button type="button" aria-label={`Move ${t.name} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)} className="text-ink-mute hover:text-ink disabled:opacity-30">
                      <Icon name="chevronDown" className="h-4 w-4" />
                    </button>
                  </div>
                  <button type="button" onClick={() => setSelected(t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <div className="h-[58px] w-[46px] flex-none overflow-hidden rounded-[10px] border border-admin-line bg-sand-200">{t.image && <MediaThumb media={t.image} sizes="96px" />}</div>
                    <div className="min-w-0">
                      <b className="block truncate font-semibold">{t.name}</b>
                      <span className="text-[11.5px] text-ink-mute">
                        {t.productCount ?? 0} product{t.productCount === 1 ? '' : 's'} · {t.publishedCount} live · /{t.slug}
                      </span>
                    </div>
                  </button>
                  {t.showOnHome && <Badge tone="contacted" className="max-sm:hidden">On homepage</Badge>}
                  <Toggle checked={t.isActive} onChange={(v) => toggleActive(t.id, v)} label={`${t.name} is active`} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {!isLoading && !isError && (
          <TaxonomyForm
            key={current ? `${current.id}:${current.isActive}:${current.order}` : NEW}
            kind={kind}
            item={current}
            nextOrder={(items.length + 1) * 10}
            onSaved={(id) => setSelected(id)}
            onDeleted={() => setSelected(null)}
          />
        )}
      </div>
    </>
  );
}
