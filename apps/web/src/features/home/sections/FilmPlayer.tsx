'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayIcon } from '@/components/site/icons';
import { cn } from '@/lib/cn';

interface Props {
  src: string;
  /** Still frame shown before the video loads. */
  poster?: string;
  /** Length shown on the play badge, e.g. "0:30". */
  duration?: string;
}

/**
 * Brand film: a muted looping preview inside the page, and a full-screen player
 * with sound that opens on click. The preview pauses while the player is open.
 */
export function FilmPlayer({ src, poster, duration }: Props) {
  const [open, setOpen] = useState(false);
  const preview = useRef<HTMLVideoElement>(null);
  const full = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    preview.current?.pause();
    if (full.current) {
      full.current.currentTime = 0;
      full.current.play().catch(() => undefined);
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      full.current?.pause();
      preview.current?.play().catch(() => undefined);
    };
  }, [open]);

  return (
    <>
      <div className="film group relative bg-night-950">
        <video
          ref={preview}
          className="block aspect-video w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/60 via-transparent to-transparent" />
        <button type="button" onClick={() => setOpen(true)} className="absolute inset-0 z-10" aria-label="Play brand film" />
        <span className="play pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-3 rounded-full bg-sand-50 p-1.5 text-ink shadow-2xl sm:bottom-10 sm:right-10 sm:py-2 sm:pl-2 sm:pr-6">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-sand-50 sm:h-14 sm:w-14">
            <PlayIcon />
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[10px] uppercase tracking-[.22em] opacity-70">Brand film{duration ? ` · ${duration}` : ''}</span>
            <span className="block font-display text-lg leading-tight sm:text-xl">Watch our story</span>
          </span>
        </span>
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Brand film"
        aria-hidden={!open}
        inert={!open}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className={cn('modal fixed inset-0 z-[80] grid place-items-center bg-night-950/95 p-4 sm:p-10', open && 'is-open')}
      >
        <div className="inner relative w-full max-w-6xl">
          <video ref={full} className="aspect-video w-full rounded-[10px] bg-black" src={open ? src : undefined} controls playsInline preload="none" />
          <button type="button" onClick={() => setOpen(false)} className="absolute -top-12 right-0 text-sm uppercase tracking-[.2em] text-sand-50">
            Close ✕
          </button>
        </div>
      </div>
    </>
  );
}
