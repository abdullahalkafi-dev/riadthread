'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import type { PageMeta, ProductCard, ProductFilters, Taxonomy } from '@/types/api';
import { trackEvent } from '../tracking/events';
import { journey } from '../tracking/journey';
import { useGetProductsQuery } from './catalogueApi';
import { CategoryChips } from './CategoryChips';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';
import { ProductGrid, ProductGridSkeleton } from './ProductGrid';
import { parseProductArgs, sameArgs, toPageHref, type ProductListArgs } from './query';

export interface InitialCatalogue {
  args: ProductListArgs;
  items: ProductCard[];
  meta: PageMeta;
}

interface Props {
  initial: InitialCatalogue;
  filters: ProductFilters;
  categories: Taxonomy[];
  collections: Taxonomy[];
  whatsappHref: string | null;
}

/**
 * The collection page. The first paint comes from the server (good for search
 * engines and speed). After that, filters change the address with the browser's
 * History API and the results come from RTK Query, so the page never reloads,
 * the back button works, and every filtered view can be shared as a link.
 */
export function CatalogueView({ initial, filters, categories, collections, whatsappHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const pathCollection = pathname.startsWith('/collections/') ? decodeURIComponent(pathname.split('/')[2] ?? '') : undefined;
  const args = useMemo(() => parseProductArgs(new URLSearchParams(search.toString()), pathCollection), [search, pathCollection]);

  // Until the filters differ from what the server rendered, there is nothing to fetch.
  const unchanged = sameArgs(args, initial.args);
  const query = useGetProductsQuery(args, { skip: unchanged });
  const shown = unchanged ? initial : (query.data ?? { items: initial.items, meta: initial.meta });
  const firstLoad = !unchanged && !query.data;
  const busy = !unchanged && query.isFetching;

  const change = useCallback(
    (patch: Partial<ProductListArgs>, mode: 'push' | 'replace' = 'push') => {
      const next: ProductListArgs = { ...args, ...(patch.page === undefined ? { page: 1 } : {}), ...patch };
      // Optional fields set to undefined mean "remove the filter".
      if (!next.category) delete next.category;
      if (!next.collection) delete next.collection;
      const href = toPageHref(next);
      if ((next.collection ?? '') !== (args.collection ?? '')) {
        // A different collection is a different page (own title and address): let the server render it.
        router.push(href, { scroll: false });
        return;
      }
      if (mode === 'replace') window.history.replaceState(null, '', href);
      else window.history.pushState(null, '', href);
    },
    [args, router],
  );

  const clear = useCallback(() => {
    const next: ProductListArgs = { colour: [], fabric: [], q: '', sort: args.sort, page: 1 };
    if (args.collection) next.collection = args.collection;
    window.history.pushState(null, '', toPageHref(next));
  }, [args.collection, args.sort]);

  const collection = collections.find((c) => c.slug === args.collection);
  const category = categories.find((c) => c.slug === args.category);
  const title = collection?.name ?? category?.name ?? 'Collection';
  const heroImage = (collection ?? category)?.image ?? null;

  useEffect(() => {
    journey.relabel(collection ? `Collection · ${collection.name}` : category ? `Collection · ${category.name}` : 'Collection');
  }, [collection, category]);
  useEffect(() => {
    if (args.q) trackEvent({ type: 'search', label: args.q });
  }, [args.q]);

  return (
    <>
      <div className="relative overflow-hidden bg-night-900 text-sand-50">
        {heroImage && <ResponsiveImage media={heroImage} alt="" fill sizes="100vw" className="object-cover opacity-40" priority />}
        <div className="star-bg absolute inset-0 opacity-[.06]" />
        <div className="absolute inset-0 bg-gradient-to-r from-night-950/95 via-night-950/70 to-night-950/20" />
        <div className="relative mx-auto grid max-w-[1400px] items-end gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <div>
            <p className="text-[12px] uppercase tracking-[.3em] text-sand-300">
              <Link href="/" className="hover:text-brass-300">Home</Link> / Collection
            </p>
            <h1 className="mt-4 font-display text-6xl leading-[.95] sm:text-8xl">{title}</h1>
          </div>
          <p className="text-sand-200 lg:pb-3 lg:text-right">
            <span className="font-display text-4xl text-brass-300">{shown.meta.total}</span> {shown.meta.total === 1 ? 'style' : 'styles'} in UK stock.
            <br className="hidden lg:block" /> Trade prices on request.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <CategoryChips categories={categories} args={args} onSelect={(category) => change({ category })} />
      </div>

      <FilterBar collections={collections} categories={categories} filters={filters} args={args} onChange={change} onClear={clear} />

      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        {firstLoad ? <ProductGridSkeleton /> : <ProductGrid items={shown.items} busy={busy} onClear={clear} />}
        <Pagination args={args} totalPages={shown.meta.totalPages} onPage={(page) => change({ page })} />

        <div className="relative mt-20 grid items-center gap-6 overflow-hidden rounded-[24px] bg-majorelle-deep px-6 py-12 text-sand-50 sm:px-12 lg:grid-cols-2">
          <div className="star-bg absolute inset-0 opacity-[.07]" />
          <div className="relative">
            <p className="font-ruqaa text-3xl text-brass-300">نحن هنا</p>
            <h3 className="mt-1 font-display text-3xl sm:text-4xl">Can&apos;t find what you need?</h3>
            <p className="mt-2 text-sand-200/85">We hold more styles than we show online. Tell us what your customers ask for.</p>
          </div>
          <div className="relative flex flex-wrap gap-3 lg:justify-end">
            {whatsappHref && (
              <a href={whatsappHref} className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-4 text-[15px] text-night-950 hover:brightness-105">
                WhatsApp us
              </a>
            )}
            <Link href="/enquiry" className="btn-brass rounded-full px-6 py-4 text-[15px]">Send an enquiry</Link>
          </div>
        </div>
      </div>
    </>
  );
}
