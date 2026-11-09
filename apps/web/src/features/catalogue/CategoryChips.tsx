'use client';

import Link from 'next/link';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { Taxonomy } from '@/types/api';
import { toPageHref, type ProductListArgs } from './query';

interface Props {
  categories: Taxonomy[];
  args: ProductListArgs;
  onSelect: (category: string | undefined) => void;
}

/** Round-topped category pictures above the filter bar. Real links, so they work without JavaScript. */
export function CategoryChips({ categories, args, onSelect }: Props) {
  const items: Array<{ slug: string | undefined; name: string; image: Taxonomy['image'] }> = [
    { slug: undefined, name: 'All styles', image: null },
    ...categories.filter((c) => c.publishedCount > 0).map((c) => ({ slug: c.slug, name: c.name, image: c.image })),
  ];
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2 pt-10 sm:gap-8">
      {items.map((c) => {
        const current = c.slug === args.category;
        const target: ProductListArgs = { ...args, page: 1 };
        if (c.slug) target.category = c.slug;
        else delete target.category;
        const href = toPageHref(target);
        return (
          <Link
            key={c.slug ?? 'all'}
            href={href}
            scroll={false}
            aria-current={current}
            onClick={(e) => {
              e.preventDefault();
              onSelect(c.slug);
            }}
            className="group w-[84px] shrink-0 text-center sm:w-[104px]"
          >
            <span
              className={cn(
                'mx-auto block h-[104px] w-[84px] overflow-hidden rounded-b-[14px] rounded-t-full bg-sand-200 transition sm:h-[128px] sm:w-[104px]',
                current && 'shadow-[0_0_0_2px_#fbf8f2,0_0_0_4px_#b9603f]',
              )}
            >
              {c.image ? (
                <ResponsiveImage media={c.image} alt="" sizes="104px" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- static brand mark
                <img src="/brand/logo.png" alt="" width={104} height={128} className="h-full w-full object-contain p-3" />
              )}
            </span>
            <span className={cn('mt-2 block text-[13px] transition', current && 'text-terracotta-500')}>{c.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
