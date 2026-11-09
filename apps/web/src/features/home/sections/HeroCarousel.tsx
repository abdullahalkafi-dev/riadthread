'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type AnimationEvent, type PointerEvent } from 'react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { Media } from '@/types/api';
import { HERO_TONES } from '../content';

export interface HeroSlideView {
  title: string;
  subtitle: string;
  image: Media | null;
  href: string;
  ctaText: string;
}

const pad = (n: number) => String(n + 1).padStart(2, '0');
const SWIPE_PX = 50;
const CLEANUP_MS = 1300;

/** One animated word of the headline; the rise is staggered by its position. */
const Words = ({ text, from }: { text: string; from: number }) => (
  <>
    {text.split(' ').map((w, i) => (
      <span key={`${w}-${i}`}>
        <span className="h-word">
          <span style={{ '--d': from + i } as React.CSSProperties}>{w}</span>
        </span>{' '}
      </span>
    ))}
  </>
);

/**
 * The home page hero: an arch-shaped image stage beside the headline, with
 * auto-advance (paused on hover), thumbnails, swipe and keyboard-reachable
 * controls. The first slide is rendered on the server, so the headline and
 * main image are in the page HTML from the first byte.
 */
export function HeroCarousel({ slides }: { slides: HeroSlideView[] }) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const cleanup = useRef<ReturnType<typeof setTimeout>>(undefined);
  const swipeStart = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    setAuto(total > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [total]);

  useEffect(() => () => clearTimeout(cleanup.current), []);

  const go = useCallback(
    (to: number) => {
      const next = (to + total) % total;
      if (next === index) return;
      setPrevious(index);
      setIndex(next);
      clearTimeout(cleanup.current);
      cleanup.current = setTimeout(() => setPrevious(null), CLEANUP_MS);
    },
    [index, total],
  );

  const slide = slides[index];
  if (!slide) return null;
  const word = slide.title.split(' ')[0] ?? '';

  const onProgressEnd = (e: AnimationEvent) => {
    if (e.animationName === 'rt-hfill') go(index + 1);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeStart.current !== null && Math.abs(e.clientX - swipeStart.current) > SWIPE_PX) {
      swiped.current = true;
      go(index + (e.clientX < swipeStart.current ? 1 : -1));
    }
    swipeStart.current = null;
  };

  return (
    <div data-hero className="relative overflow-hidden" style={{ backgroundColor: HERO_TONES[index % HERO_TONES.length] }}>
      <div className="star-bg-ink pointer-events-none absolute inset-0 opacity-[.05]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-x-10 px-4 sm:px-6 lg:h-[calc(100svh-128px)] lg:max-h-[880px] lg:min-h-[660px] lg:grid-cols-12 lg:px-10">
        <div
          className="relative h-[460px] touch-pan-y sm:h-[600px] lg:order-2 lg:col-span-7 lg:h-full"
          onPointerDown={(e) => {
            swipeStart.current = e.clientX;
            swiped.current = false;
          }}
          onPointerUp={onPointerUp}
          onDragStart={(e) => e.preventDefault()}
        >
          <span
            aria-hidden="true"
            className="outline-text pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[9rem] leading-none opacity-50 sm:block xl:text-[12rem]"
          >
            {word}
          </span>

          <Link
            href={slide.href}
            onClickCapture={(e) => {
              // A swipe must not also count as a click on the picture.
              if (swiped.current) {
                e.preventDefault();
                swiped.current = false;
              }
            }}
            aria-label={`${slide.title}, ${slide.ctaText}`}
            className="h-arch group absolute left-1/2 top-[5%] aspect-[3/4] h-[90%] -translate-x-1/2 overflow-hidden rounded-b-[8px] rounded-t-[999px] bg-sand-200 shadow-[0_50px_90px_-50px_rgba(43,33,25,.55)] outline outline-1 outline-offset-[10px] outline-brass-500/40 lg:left-[44%] lg:top-[7%] lg:h-[86%]"
          >
            <div className="absolute inset-0">
              {slides.map((s, i) => {
                const state = i === index ? 'is-on' : i === previous ? 'was-on' : '';
                return s.image ? (
                  <ResponsiveImage
                    key={i}
                    media={s.image}
                    alt={i === index ? s.title : ''}
                    sizes="(min-width:1024px) 40vw, 90vw"
                    priority={i === 0}
                    className={cn('h-slide', state)}
                  />
                ) : (
                  <span key={i} aria-hidden="true" className={cn('h-slide star-bg-ink bg-sand-300', state)} />
                );
              })}
            </div>
            <span className="h-view absolute bottom-6 left-1/2 z-10 whitespace-nowrap rounded-full bg-ink/85 px-5 py-2.5 text-[13px] text-sand-50 backdrop-blur">
              {slide.ctaText} →
            </span>
          </Link>

          <div className="absolute bottom-[8%] left-[6%] z-10 hidden h-32 w-32 place-items-center rounded-full bg-sand-50 shadow-xl sm:grid lg:left-[8%]">
            <svg viewBox="0 0 120 120" className="spin absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <path id="seal" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
              </defs>
              <text fontSize="8.6" fill="#6b5d4f">
                <textPath href="#seal" textLength="284" lengthAdjust="spacing">
                  MADE IN MOROCCO · STOCKED IN THE UK ·{' '}
                </textPath>
              </text>
            </svg>
            <Image src="/brand/logo.png" alt="" width={68} height={68} className="h-[68px] w-[68px]" />
          </div>

          {total > 1 && (
            <>
              <div className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index}
                    aria-label={s.title}
                    className="h-go relative flex items-center justify-end gap-3 opacity-50"
                  >
                    <span className="tip absolute right-full mr-1 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs text-sand-50">{s.title}</span>
                    <span className="ring-el relative block h-[60px] w-[46px] overflow-hidden rounded-b-[4px] rounded-t-[999px] transition-shadow">
                      {s.image && <ResponsiveImage media={s.image} alt="" sizes="46px" fill className="object-cover" />}
                    </span>
                  </button>
                ))}
              </div>
              {(['-1', '1'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => go(index + Number(dir))}
                  aria-label={dir === '1' ? 'Next' : 'Previous'}
                  className={cn(
                    'absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-sand-50/90 shadow lg:hidden',
                    dir === '1' ? 'right-0' : 'left-0',
                  )}
                >
                  {dir === '1' ? '→' : '←'}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="flex flex-col justify-center pb-10 pt-6 lg:order-1 lg:col-span-5 lg:py-12">
          <p className="text-[11px] uppercase tracking-[.18em] text-terracotta-600">Heritage-inspired, modern-designed Moroccan wear</p>
          <div key={index} className="mt-5 min-h-[330px] sm:min-h-[300px] lg:min-h-[530px]">
            {index === 0 ? (
              <h1 className="mt-3 font-display text-[3rem] leading-[.98] tracking-tight sm:text-7xl xl:text-[5.6rem]">
                <Words text={slide.title} from={1} />
              </h1>
            ) : (
              <p className="mt-3 font-display text-[3rem] leading-[.98] tracking-tight sm:text-7xl xl:text-[5.6rem]">
                <Words text={slide.title} from={1} />
              </p>
            )}
            {slide.subtitle && (
              <p className="h-anim mt-6 max-w-md text-lg leading-relaxed text-ink-soft" style={{ '--d': 4 } as React.CSSProperties}>
                {slide.subtitle}
              </p>
            )}
            <div className="h-anim mt-8 flex flex-wrap gap-3" style={{ '--d': 6 } as React.CSSProperties}>
              <Link href={slide.href} className="btn-terra inline-flex items-center gap-3 rounded-full px-7 py-4 text-[15px]">
                {slide.ctaText} <span aria-hidden="true">→</span>
              </Link>
              <Link href="/collections" className="btn-line rounded-full px-6 py-4 text-[15px]">
                Browse the collection
              </Link>
            </div>
          </div>

          {total > 1 && (
            <div className="mt-8 flex items-center gap-5">
              <p className="w-16 font-display text-xl">
                <span>{pad(index)}</span>
                <span className="text-sm text-ink-mute">
                  {' '}
                  / <span>{pad(total - 1)}</span>
                </span>
              </p>
              <div className="flex flex-1 gap-2" onAnimationEnd={onProgressEnd}>
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={cn('h-seg', i < index && 'is-done', i === index && auto && 'is-run')}
                  >
                    <i />
                  </button>
                ))}
              </div>
              <div className="hidden gap-2 lg:flex">
                <button type="button" onClick={() => go(index - 1)} className="btn-line grid h-11 w-11 place-items-center rounded-full" aria-label="Previous">
                  ←
                </button>
                <button type="button" onClick={() => go(index + 1)} className="btn-line grid h-11 w-11 place-items-center rounded-full" aria-label="Next">
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
