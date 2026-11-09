'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ProductCardItem } from '@/features/catalogue/ProductCardItem';
import { cn } from '@/lib/cn';
import type { ProductCard } from '@/types/api';

export interface ShowcaseTab {
  key: string;
  label: string;
  /** Ids into the shared product map, so a style listed in several tabs is sent to the browser once. */
  ids: string[];
}

const DRAG_PX = 6;

/**
 * Tabbed product slider. Touch screens scroll it natively; with a mouse it can be
 * dragged, or moved with the arrow buttons. A drag never counts as a click on a card.
 */
export function ShowcaseSlider({ tabs, products, total }: { tabs: ShowcaseTab[]; products: Record<string, ProductCard>; total: number }) {
  const [active, setActive] = useState(tabs[0]?.key ?? '');
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const moved = useRef(false);
  const [dragging, setDragging] = useState(false);

  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
  }, [active]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current || !track.current) return;
      const dx = e.clientX - drag.current.x;
      if (Math.abs(dx) > DRAG_PX) {
        moved.current = true;
        setDragging(true);
      }
      track.current.scrollLeft = drag.current.left - dx;
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      setTimeout(() => setDragging(false));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  if (!current) return null;
  const scrollBy = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.75 });

  return (
    <section aria-labelledby="showcase-heading" className="overflow-hidden py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[12px] uppercase tracking-[.3em] text-terracotta-500">The collection</p>
            <h2 id="showcase-heading" className="mt-4 font-display text-4xl leading-[1.02] sm:text-6xl">
              Chosen by UK retailers
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => scrollBy(-1)} className="btn-line grid h-12 w-12 place-items-center rounded-full" aria-label="Scroll left">
              ←
            </button>
            <button type="button" onClick={() => scrollBy(1)} className="btn-line grid h-12 w-12 place-items-center rounded-full" aria-label="Scroll right">
              →
            </button>
          </div>
        </div>
        <div role="tablist" aria-label="Collections" className="no-scrollbar mt-8 flex gap-7 overflow-x-auto border-b border-ink/15 text-[15px] text-ink-mute">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === current.key}
              onClick={() => setActive(t.key)}
              className="show-tab relative whitespace-nowrap pb-4 transition hover:text-ink"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] pl-4 sm:pl-6 lg:pl-10">
        <div
          ref={track}
          role="tabpanel"
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse' || !track.current) return;
            drag.current = { x: e.clientX, left: track.current.scrollLeft };
            moved.current = false;
          }}
          onClickCapture={(e) => {
            if (moved.current) {
              e.preventDefault();
              e.stopPropagation();
              moved.current = false;
            }
          }}
          className={cn('slider no-scrollbar mt-10 flex gap-4 overflow-x-auto pb-4 pr-4 sm:gap-7 sm:pr-10', dragging && 'is-drag')}
        >
          {current.ids.map((id) => {
            const product = products[id];
            return (
              product && (
                <div key={id} className="w-[72%] shrink-0 sm:w-[42%] lg:w-[23.5%]">
                  <ProductCardItem product={product} />
                </div>
              )
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[1400px] justify-center px-4 sm:px-6 lg:px-10">
        <Link href="/collections" className="btn-line inline-flex items-center gap-3 rounded-full px-7 py-4 text-[15px]">
          See all {total} {total === 1 ? 'style' : 'styles'} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
