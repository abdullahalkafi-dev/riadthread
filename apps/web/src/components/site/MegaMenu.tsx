'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORY_ARABIC } from '@/features/home/content';
import { cn } from '@/lib/cn';
import type { Taxonomy } from '@/types/api';
import { CategoryThumb } from './CategoryThumb';
import { ChevronDownIcon } from './icons';
import { categoryHref, collectionHref, type NavCategory } from './nav';

interface Props {
  categories: NavCategory[];
  collections: Pick<Taxonomy, 'slug' | 'name'>[];
  lineSheetEnabled: boolean;
  active: boolean;
}

/** "Collection" entry of the header with the category and collection panel. */
export function MegaMenu({ categories, collections, lineSheetEnabled, active }: Props) {
  // After a choice the panel stays shut until the pointer leaves it, as in the design.
  const [closed, setClosed] = useState(false);

  return (
    <div
      className={cn('mega relative', closed && 'is-closed')}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) setClosed(true);
      }}
      onMouseLeave={() => setClosed(false)}
    >
      <Link href="/collections" aria-current={active ? 'page' : undefined} className="nav-link inline-flex items-center gap-1.5 hover:text-ink">
        Collection <ChevronDownIcon className="chev-d transition" />
      </Link>

      <div className="mega-panel absolute left-1/2 top-full z-50 w-[min(1080px,92vw)] pt-6">
        <div className="grid grid-cols-12 gap-7 rounded-[22px] bg-sand-50 p-7 shadow-[0_40px_80px_-30px_rgba(43,33,25,.45)] ring-1 ring-ink/10">
          <div className="col-span-8">
            <p className="text-[11px] uppercase tracking-[.25em] text-terracotta-500">Shop by category</p>
            <div className="mt-4 grid grid-cols-5 gap-4">
              {categories.slice(0, 5).map((c) => (
                <Link key={c.slug} href={categoryHref(c.slug)} className="group text-center">
                  <span className="relative block aspect-[3/4] overflow-hidden rounded-b-[12px] rounded-t-full bg-sand-200">
                    <CategoryThumb image={c.image} alt="" sizes="160px" className="transition duration-700 group-hover:scale-110" />
                  </span>
                  {CATEGORY_ARABIC[c.slug] && <span className="mt-2 block font-ruqaa text-sm text-terracotta-500">{CATEGORY_ARABIC[c.slug]}</span>}
                  <span className="block font-display text-lg leading-tight group-hover:text-terracotta-600">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-2 gap-5">
            <div className={lineSheetEnabled ? '' : 'col-span-2'}>
              <p className="text-[11px] uppercase tracking-[.25em] text-terracotta-500">Collections</p>
              <ul className="mt-4 space-y-3 text-[15px] text-ink">
                <li>
                  <Link href="/collections?sort=newest" className="hover:text-terracotta-500">
                    New arrivals
                  </Link>
                </li>
                {collections.map((c) => (
                  <li key={c.slug}>
                    <Link href={collectionHref(c.slug)} className="hover:text-terracotta-500">
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/collections" className="hover:text-terracotta-500">
                    All styles
                  </Link>
                </li>
              </ul>
            </div>
            {lineSheetEnabled && (
              <Link href="/#linesheet" className="group relative overflow-hidden rounded-b-[14px] rounded-t-full bg-night-900 text-sand-50">
                <span className="star-bg absolute inset-0 opacity-10 transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-night-950/90 to-transparent" />
                <span className="absolute inset-x-3 bottom-3">
                  <span className="block text-[10px] uppercase tracking-[.2em] text-brass-300">Free</span>
                  <span className="block font-display text-lg leading-tight">Trade line sheet →</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
