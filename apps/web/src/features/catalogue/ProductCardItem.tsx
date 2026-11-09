'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import { useSiteDispatch } from '@/store/site/hooks';
import { openQuickView } from '@/store/site/ui.slice';
import type { ProductCard } from '@/types/api';
import { useAddToList } from './useAddToList';

const SIZES = '(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw';

/**
 * A product in the catalogue grid: arched photo that swaps on hover, colour dots
 * that change the photo, quick view and a one-tap "add to enquiry".
 */
export function ProductCardItem({ product, priority = false }: { product: ProductCard; priority?: boolean }) {
  const dispatch = useSiteDispatch();
  const { addMinimum, busySlug } = useAddToList();
  const [colourId, setColourId] = useState<string | null>(product.colours[0]?.id ?? null);
  const [justAdded, setJustAdded] = useState(false);

  const colour = product.colours.find((c) => c.id === colourId) ?? null;
  const main = colour?.image ?? product.cover;
  // The hover photo only applies to the default view; a chosen colour shows its own picture.
  const hover = colourId === product.colours[0]?.id ? product.hover : null;
  const href = `/products/${product.slug}`;

  async function add() {
    if (await addMinimum(product.slug, colour?.name)) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1200);
    }
  }

  return (
    <article className="group/card">
      <div className="relative">
        <Link href={href} className="relative block aspect-[3/4] overflow-hidden rounded-b-[16px] rounded-t-[999px] bg-sand-200" aria-label={product.name}>
          <ResponsiveImage
            media={main}
            alt={main?.alt ?? product.name}
            sizes={SIZES}
            fill
            priority={priority}
            className={cn(
              'object-cover transition-[opacity,transform] duration-[600ms] ease-out',
              hover ? 'group-hover/card:opacity-0' : 'group-hover/card:scale-[1.06] group-hover/card:duration-[1100ms]',
            )}
          />
          {hover && (
            <ResponsiveImage
              media={hover}
              alt=""
              sizes={SIZES}
              fill
              className="scale-105 object-cover opacity-0 transition-[opacity,transform] duration-[600ms] ease-out group-hover/card:scale-100 group-hover/card:opacity-100"
            />
          )}
        </Link>
        {product.badge && (
          <span className="pointer-events-none absolute left-1/2 top-[15%] -translate-x-1/2 whitespace-nowrap rounded-full bg-sand-50/95 px-2.5 py-1 text-[10px] uppercase tracking-[.16em] text-terracotta-600">
            {product.badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => dispatch(openQuickView(product.slug))}
          className="absolute inset-x-3 bottom-3 rounded-full bg-sand-50/95 py-2.5 text-[13px] shadow backdrop-blur transition-[opacity,transform,background,color] duration-300 hover:bg-ink hover:text-sand-50 focus:translate-y-0 focus:opacity-100 sm:inset-x-5 sm:bottom-5 lg:translate-y-2.5 lg:opacity-0 lg:group-hover/card:translate-y-0 lg:group-hover/card:opacity-100"
        >
          Quick view
        </button>
      </div>

      <div className="mt-4 text-center">
        {product.category && <p className="text-[11px] uppercase tracking-[.2em] text-ink-mute">{product.category.name}</p>}
        <h3 className="mt-1 font-display text-xl leading-tight sm:text-2xl">
          <Link href={href} className="transition-colors hover:text-terracotta-500">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2.5 flex items-center justify-center gap-2">
          {product.colours.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.name}
              aria-label={c.name}
              aria-pressed={c.id === colourId}
              onClick={() => setColourId(c.id)}
              style={{ background: c.hex }}
              className="h-3.5 w-3.5 rounded-full ring-1 ring-ink/15 transition aria-pressed:shadow-[0_0_0_2px_#fbf8f2,0_0_0_3.5px_#2b2119]"
            />
          ))}
          <span className="ml-1 text-xs text-ink-soft">MOQ {product.moq}</span>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={busySlug === product.slug}
          className={cn(
            'mt-4 rounded-full border px-5 py-2 text-[13px] transition disabled:opacity-60',
            justAdded
              ? 'border-zellige-500 bg-zellige-500 text-white'
              : 'border-ink/20 hover:border-terracotta-500 hover:text-terracotta-500',
          )}
        >
          {justAdded ? 'Added' : 'Add to enquiry'}
        </button>
      </div>
    </article>
  );
}

/** Loading placeholder with the same shape as a card. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-[3/4] animate-pulse rounded-b-[16px] rounded-t-[999px] bg-sand-200" />
      <div className="mx-auto mt-4 h-3 w-20 animate-pulse rounded bg-sand-200" />
      <div className="mx-auto mt-2 h-6 w-40 animate-pulse rounded bg-sand-200" />
      <div className="mx-auto mt-3 h-3.5 w-28 animate-pulse rounded bg-sand-200" />
    </div>
  );
}
