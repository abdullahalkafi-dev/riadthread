'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import { trackEvent } from '../../tracking/events';
import { journey } from '../../tracking/journey';
import type { GalleryItem } from '../gallery';

interface Props {
  items: GalleryItem[];
  index: number;
  onIndex: (index: number) => void;
  productId: string;
  productName: string;
  badge: string;
}

/**
 * Product photos and videos: thumbnails, arrows, swipe, click-to-zoom that
 * follows the pointer, and a full-screen view.
 */
export function ProductGallery({ items, index, onIndex, productId, productName, badge }: Props) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [lightbox, setLightbox] = useState(false);
  const swipeFrom = useRef<number | null>(null);
  const swiped = useRef(false);

  const count = items.length;
  const current = items[index];
  const step = useCallback((d: number) => count > 0 && onIndex((index + d + count) % count), [count, index, onIndex]);

  useEffect(() => setZoom(false), [index]);

  // Arrow keys move through the photos unless the visitor is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement?.tagName ?? ''))) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  function openLightbox() {
    setLightbox(true);
    trackEvent({ type: 'media_open', productId, label: productName });
  }

  function onPointerDown(e: ReactPointerEvent) {
    swipeFrom.current = e.clientX;
    swiped.current = false;
  }
  function onPointerUp(e: ReactPointerEvent) {
    if (swipeFrom.current === null) return;
    const dx = e.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (Math.abs(dx) > 50) {
      swiped.current = true;
      step(dx < 0 ? 1 : -1);
    }
  }
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:col-span-7 lg:flex-row lg:gap-4">
      {count > 1 && (
        <div className="no-scrollbar order-2 flex gap-3 overflow-x-auto lg:order-1 lg:max-h-[760px] lg:w-[88px] lg:flex-col lg:overflow-y-auto">
          {items.map((item, i) => (
            <button
              key={`${item.media.id}-${i}`}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'relative h-24 w-20 shrink-0 overflow-hidden rounded-b-[10px] rounded-t-[999px] transition lg:h-[108px] lg:w-[88px]',
                i === index ? 'ring-2 ring-terracotta-500 ring-offset-2 ring-offset-sand-50' : 'opacity-60 hover:opacity-100',
              )}
            >
              {item.media.type === 'video' ? (
                <>
                  {item.media.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- video poster rendition
                    <img src={item.media.posterUrl} alt="" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-night-900/35 text-sand-50">▶</span>
                </>
              ) : (
                <ResponsiveImage media={item.media} alt="" sizes="88px" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="relative order-1 flex-1 lg:order-2">
        <div
          className={cn(
            'relative aspect-[4/5] touch-pan-y overflow-hidden rounded-b-[24px] rounded-t-[48px] bg-sand-200',
            current?.media.type === 'image' && (zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'),
          )}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onMouseMove={zoom ? onMove : undefined}
          onMouseLeave={() => setZoom(false)}
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            if (current?.media.type === 'image') setZoom((z) => !z);
          }}
        >
          {current?.media.type === 'video' ? (
            <video
              key={current.media.id}
              src={current.media.url ?? undefined}
              poster={current.media.posterUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              onPlay={() => {
                trackEvent({ type: 'video_progress', productId, label: `${productName} video`, value: 0 });
                journey.note('watched video');
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : current ? (
            <div className={cn('absolute inset-0 transition-transform duration-[350ms]', zoom && 'scale-[1.9]')} style={{ transformOrigin: origin }}>
              <ResponsiveImage
                key={current.media.id}
                media={current.media}
                alt={current.alt || productName}
                sizes="(min-width:1024px) 58vw, 100vw"
                fill
                priority={index === 0}
                className="object-cover"
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- static brand mark
            <img src="/brand/logo.png" alt="" className="absolute inset-0 m-auto h-40 w-40 opacity-60" />
          )}
        </div>

        {badge && (
          <span className="absolute left-5 top-5 rounded-full bg-sand-50/95 px-3 py-1.5 text-[11px] uppercase tracking-[.18em] text-terracotta-600">
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={openLightbox}
          aria-label="View full screen"
          className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-sand-50/95 shadow hover:bg-sand-50"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
        {count > 1 && (
          <div className="absolute bottom-5 right-5 flex items-center gap-2">
            <span className="rounded-full bg-night-900/60 px-3 py-1.5 text-xs text-sand-50 backdrop-blur">
              {index + 1} / {count}
            </span>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="grid h-11 w-11 place-items-center rounded-full bg-sand-50/95 shadow hover:bg-sand-50">‹</button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="grid h-11 w-11 place-items-center rounded-full bg-sand-50/95 shadow hover:bg-sand-50">›</button>
          </div>
        )}
        {current?.media.type === 'image' && (
          <p className="absolute bottom-6 left-5 hidden rounded-full bg-sand-50/80 px-3 py-1.5 text-xs text-ink-soft/80 lg:block">Click photo to zoom</p>
        )}
      </div>

      {lightbox && current && (
        <Lightbox item={current} name={productName} onStep={step} onClose={() => setLightbox(false)} many={count > 1} />
      )}
    </div>
  );
}

function Lightbox({ item, name, onStep, onClose, many }: { item: GalleryItem; name: string; onStep: (d: number) => void; onClose: () => void; many: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
      className="fixed inset-0 z-[80] grid place-items-center bg-night-950/95 p-4 sm:p-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative grid h-full w-full max-w-5xl place-items-center">
        {item.media.type === 'video' ? (
          <video src={item.media.url ?? undefined} poster={item.media.posterUrl ?? undefined} controls playsInline className="max-h-full max-w-full rounded-[12px]" />
        ) : (
          <div className="relative h-full w-full">
            <ResponsiveImage media={item.media} alt={item.alt || name} sizes="100vw" fill className="rounded-[12px] object-contain" />
          </div>
        )}
        {many && (
          <>
            <button type="button" onClick={() => onStep(-1)} aria-label="Previous photo" className="absolute left-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-sand-50/90 text-xl sm:-left-4">‹</button>
            <button type="button" onClick={() => onStep(1)} aria-label="Next photo" className="absolute right-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-sand-50/90 text-xl sm:-right-4">›</button>
          </>
        )}
        <button ref={closeRef} type="button" onClick={onClose} className="absolute right-0 top-0 text-sm uppercase tracking-[.2em] text-sand-50">
          Close ✕
        </button>
      </div>
    </div>
  );
}
