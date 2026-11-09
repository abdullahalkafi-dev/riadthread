'use client';

import Link from 'next/link';
import { useState, type AnimationEvent } from 'react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { MediaWithAlt } from '@/types/api';

export interface CraftItem {
  title: string;
  text: string;
}

interface Props {
  heading: string;
  items: CraftItem[];
  /** One picture per step; steps without one show the star pattern. */
  images: Array<MediaWithAlt | null>;
}

/**
 * Interactive list of craft details beside a stack of pictures. The active step
 * advances on its own every few seconds (paused on hover), and on hover or click.
 */
export function CraftStepper({ heading, items, images }: Props) {
  const [active, setActive] = useState(0);
  const next = (e: AnimationEvent) => {
    if (e.animationName === 'rt-cbar') setActive((i) => (i + 1) % items.length);
  };

  return (
    <section aria-labelledby="craft-heading" className="relative overflow-hidden bg-sand-100">
      <div className="star-bg-ink absolute inset-0 opacity-[.04]" />
      <div className="craft-wrap relative mx-auto grid max-w-[1400px] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28" onAnimationEnd={next}>
        <div className="relative lg:col-span-6">
          <div className="reveal relative aspect-[4/5] overflow-hidden rounded-b-[20px] rounded-t-[999px] bg-sand-200 ring-1 ring-brass-400/50 ring-offset-[12px] ring-offset-sand-100">
            {items.map((item, i) => {
              const image = images[i] ?? null;
              return image ? (
                <ResponsiveImage key={item.title} media={image} alt={image.alt} sizes="(min-width:1024px) 40vw, 90vw" fill className={cn('craft-img object-cover', i === active && 'is-on')} />
              ) : (
                <span key={item.title} aria-hidden="true" className={cn('craft-img star-bg-ink absolute inset-0 bg-sand-300', i === active && 'is-on')} />
              );
            })}
          </div>
          <div className="absolute -bottom-6 right-2 flex items-center gap-3 rounded-2xl bg-sand-50 p-4 pr-6 shadow-2xl sm:-right-6">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-zellige-500 text-sand-50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[.18em] text-ink-soft">Every pack</p>
              <p className="font-display text-xl">Inspected in the UK</p>
            </div>
          </div>
        </div>

        <div className="reveal lg:col-span-6" data-delay="1">
          <p className="font-ruqaa text-4xl text-terracotta-500">صنع باليد</p>
          <h2 id="craft-heading" className="mt-3 font-display text-4xl leading-[1.02] sm:text-6xl">
            {heading}
          </h2>
          <ol className="mt-10 border-t border-ink/15">
            {items.map((item, i) => (
              <li key={item.title}>
                <button
                  type="button"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className="craft-item relative w-full border-b border-ink/15 py-5 text-left"
                >
                  <span className="flex items-baseline gap-5">
                    <span className="num w-8 font-display text-lg text-ink-mute transition">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display text-2xl sm:text-3xl">{item.title}</span>
                  </span>
                  <span className="desc pl-[3.25rem]">
                    <span className="block">
                      <span className="block pt-2 leading-relaxed text-ink-soft">{item.text}</span>
                    </span>
                  </span>
                  <span className="bar absolute bottom-[-1px] left-0 h-[2px] w-full bg-terracotta-500" />
                </button>
              </li>
            ))}
          </ol>
          <Link href="/collections" className="btn-terra mt-10 inline-flex items-center gap-3 rounded-full px-7 py-4 text-[15px]">
            Explore the collection →
          </Link>
        </div>
      </div>
    </section>
  );
}
