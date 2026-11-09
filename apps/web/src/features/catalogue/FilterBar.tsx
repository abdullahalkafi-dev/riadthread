'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { ProductFilters, Taxonomy } from '@/types/api';
import { familyHex } from './colours';
import { activeFilterCount, toPageHref, type ProductListArgs, type SortKey } from './query';

interface Props {
  collections: Taxonomy[];
  categories: Taxonomy[];
  filters: ProductFilters;
  args: ProductListArgs;
  onChange: (patch: Partial<ProductListArgs>, mode?: 'push' | 'replace') => void;
  onClear: () => void;
}

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/** Sticky bar under the hero: collection tabs, the refine panel, search and sort. */
export function FilterBar({ collections, categories, filters, args, onChange, onClear }: Props) {
  const [refineOpen, setRefineOpen] = useState(false);
  const active = activeFilterCount(args);

  // The box shows what is typed at once; the page updates when typing pauses.
  const [draft, setDraft] = useState(args.q);
  const lastQ = useRef(args.q);
  useEffect(() => {
    // Follow the address when it changes from outside (back button, clear all).
    if (args.q !== lastQ.current) {
      lastQ.current = args.q;
      setDraft(args.q);
    }
  }, [args.q]);
  useEffect(() => {
    if (draft.trim() === args.q) return;
    const timer = window.setTimeout(() => {
      lastQ.current = draft.trim();
      onChange({ q: draft.trim() }, 'replace');
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, args.q, onChange]);

  const tabs = [{ slug: undefined, name: 'All' }, ...collections.filter((c) => c.publishedCount > 0).map((c) => ({ slug: c.slug, name: c.name }))];

  return (
    <div className="sticky top-[92px] z-30 mt-6 border-y border-ink/10 bg-sand-50/95 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center gap-3 py-3">
          <nav aria-label="Collections" className="no-scrollbar flex gap-2 overflow-x-auto text-sm">
            {tabs.map((t) => {
              const current = t.slug === args.collection;
              const target: ProductListArgs = { ...args, page: 1 };
              if (t.slug) target.collection = t.slug;
              else delete target.collection;
              return (
                <Link
                  key={t.slug ?? 'all'}
                  href={toPageHref(target)}
                  aria-current={current}
                  onClick={(e) => {
                    e.preventDefault();
                    onChange({ collection: t.slug });
                  }}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-2 transition',
                    current ? 'border-ink bg-ink text-sand-50' : 'border-ink/20 hover:border-ink',
                  )}
                >
                  {t.name}
                </Link>
              );
            })}
          </nav>
          <span className="hidden h-6 w-px bg-ink/15 lg:block" />
          <button
            type="button"
            aria-expanded={refineOpen}
            aria-controls="refine-panel"
            onClick={() => setRefineOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Colour &amp; fabric
            {active > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-terracotta-500 px-1 text-[11px] text-sand-50">{active}</span>
            )}
          </button>
          <span className="flex-1" />
          <label className="relative order-last w-full sm:order-none sm:w-64">
            <span className="sr-only">Search the collection</span>
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search name or code…"
              className="field !rounded-full !py-2 !pl-10 text-sm"
            />
          </label>
          <label>
            <span className="sr-only">Sort by</span>
            <select
              value={args.sort}
              onChange={(e) => onChange({ sort: e.target.value as SortKey })}
              className="rounded-full border border-ink/20 bg-transparent px-4 py-2 text-sm"
            >
              <option value="order">Sort: Featured</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        {refineOpen && (
          <div id="refine-panel" className="grid gap-8 pb-6 pt-2 text-sm sm:grid-cols-3">
            <fieldset>
              <legend className="mb-3 text-[11px] uppercase tracking-[.25em] text-terracotta-500">Category</legend>
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => c.publishedCount > 0).map((c) => (
                  <Chip key={c.slug} checked={args.category === c.slug} onChange={() => onChange({ category: args.category === c.slug ? undefined : c.slug })}>
                    {c.name}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-[11px] uppercase tracking-[.25em] text-terracotta-500">Colour</legend>
              <div className="flex flex-wrap gap-2">
                {filters.colours.map((c) => (
                  <Chip key={c.name} checked={args.colour.includes(c.name)} onChange={() => onChange({ colour: toggle(args.colour, c.name) })}>
                    <i className="h-3 w-3 rounded-full ring-1 ring-ink/10" style={{ background: familyHex(c.name) }} />
                    {c.name}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-[11px] uppercase tracking-[.25em] text-terracotta-500">Fabric</legend>
              <div className="flex flex-wrap gap-2">
                {filters.fabrics.map((f) => (
                  <Chip key={f.name} checked={args.fabric.includes(f.name)} onChange={() => onChange({ fabric: toggle(args.fabric, f.name) })}>
                    {f.name}
                  </Chip>
                ))}
              </div>
              {active > 0 && (
                <button type="button" onClick={onClear} className="mt-4 text-terracotta-500 underline underline-offset-4">
                  Clear all
                </button>
              )}
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="chip cursor-pointer">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-terracotta-500">
        {children}
      </span>
    </label>
  );
}
