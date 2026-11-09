'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Drawer } from '@/components/site/Drawer';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { closeDrawer } from '@/store/site/ui.slice';
import type { Media, ProductDetail } from '@/types/api';
import { spreadUnits } from '../enquiry/items';
import { trackEvent } from '../tracking/events';
import { useGetProductQuery } from './catalogueApi';
import { galleryFor, imageForColour } from './gallery';
import { useAddToList } from './useAddToList';

/** Quick look at a product from the catalogue, without leaving the page. */
export function QuickViewDrawer() {
  const dispatch = useSiteDispatch();
  const open = useSiteSelector((s) => s.ui.drawer === 'quickView');
  const slug = useSiteSelector((s) => s.ui.quickViewSlug);
  const { data, isFetching, isError } = useGetProductQuery(slug ?? '', { skip: !open || !slug });

  return (
    <Drawer name="quickView" side="right" label="Quick view" className="w-full overflow-y-auto bg-sand-50 md:w-[860px]">
      <button
        type="button"
        onClick={() => dispatch(closeDrawer())}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-sand-50/95 shadow"
      >
        ✕
      </button>
      {open && data && data.slug === slug ? (
        <QuickViewBody key={data.id} product={data} />
      ) : open && isError ? (
        <p className="p-10 text-ink-soft">This product could not be loaded. Please try again.</p>
      ) : (
        open && isFetching && <QuickViewSkeleton />
      )}
    </Drawer>
  );
}

function QuickViewBody({ product }: { product: ProductDetail }) {
  const dispatch = useSiteDispatch();
  const { addChosen } = useAddToList();
  const [colourId, setColourId] = useState<string | null>(product.colours[0]?.id ?? null);
  const [photo, setPhoto] = useState<Media | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    trackEvent({ type: 'product_view', productId: product.id, label: `${product.name} (quick view)` });
  }, [product.id, product.name]);

  const colour = product.colours.find((c) => c.id === colourId) ?? null;
  const hero = photo ?? imageForColour(product, colourId);
  const thumbs = galleryFor(product, colourId).filter((m) => m.media.type === 'image').slice(0, 4);
  const moq = product.wholesale.moq;

  function add() {
    const available = product.sizes.filter((s) => s.available).map((s) => s.label);
    addChosen(product, colour?.name ?? null, spreadUnits(available, moq));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="grid md:grid-cols-2">
      <div className="relative aspect-[4/5] bg-sand-200 md:aspect-auto md:min-h-[100svh]">
        <ResponsiveImage media={hero} alt={product.name} sizes="(min-width:768px) 430px, 100vw" fill className="object-cover" priority />
        <div className="absolute bottom-4 left-4 flex gap-2">
          {thumbs.map((m) => (
            <button
              key={m.media.id}
              type="button"
              onClick={() => setPhoto(m.media)}
              aria-label={m.alt || product.name}
              className="h-16 w-12 overflow-hidden rounded-b-md rounded-t-full ring-2 ring-sand-50/80"
            >
              <ResponsiveImage media={m.media} alt="" sizes="48px" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col p-7 sm:p-10">
        <p className="text-[12px] uppercase tracking-[.22em] text-terracotta-600">
          {[product.category?.name, product.code].filter(Boolean).join(' · ')}
        </p>
        <h2 className="mt-2 font-display text-4xl leading-[1.05]">{product.name}</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">{product.summary}</p>

        {product.colours.length > 0 && (
          <>
            <p className="mt-7 text-[12px] uppercase tracking-[.2em] text-ink-soft">
              Colour — <span className="text-ink">{colour?.name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.colours.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === colourId}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => {
                    setColourId(c.id);
                    setPhoto(null);
                  }}
                  style={{ background: c.hex }}
                  className="h-11 w-9 rounded-b rounded-t-full ring-1 ring-ink/10 aria-pressed:outline aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-terracotta-500"
                />
              ))}
            </div>
          </>
        )}

        <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-sand-300 text-sm ring-1 ring-sand-300">
          <Fact term="Minimum" value={`${moq} units`} />
          <Fact term="Packing" value={product.wholesale.packText || '—'} />
          <Fact term="Fabric" value={product.specs.fabric || '—'} />
          <Fact term="Sizes" value={product.sizes.map((s) => s.label).join(' · ') || '—'} />
        </dl>

        <div className="mt-auto grid gap-3 pt-8">
          <button type="button" onClick={add} className={cn('btn-terra rounded-full border border-transparent py-4 text-[15px]', added && '!border-zellige-500 !bg-zellige-500 !text-white')}>
            {added ? 'Added' : `Add ${moq} units to enquiry`}
          </button>
          <Link href={`/products/${product.slug}`} onClick={() => dispatch(closeDrawer())} className="btn-line rounded-full py-4 text-center text-[15px]">
            Choose sizes on the full page →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="bg-sand-50 p-4">
      <dt className="text-[11px] uppercase tracking-[.18em] text-ink-soft">{term}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function QuickViewSkeleton() {
  return (
    <div className="grid md:grid-cols-2" aria-busy>
      <Skeleton className="aspect-[4/5] rounded-none md:aspect-auto md:min-h-[100svh]" />
      <div className="space-y-4 p-7 sm:p-10">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-6 h-11 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-14 w-full rounded-full" />
      </div>
    </div>
  );
}
