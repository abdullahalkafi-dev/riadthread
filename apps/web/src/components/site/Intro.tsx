'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const SESSION_KEY = 'rt5-intro';
const SHOW_MS = 3000;

/**
 * Runs before React hydrates so a returning visitor never sees the overlay flash:
 * it hides the overlay when the intro was already shown this session, or when the
 * address carries ?nointro (used for automated tests and screenshots).
 */
const GUARD = `(function(){var e=document.getElementById('intro');if(!e)return;try{var seen=sessionStorage.getItem('${SESSION_KEY}')||/nointro/.test(location.search);sessionStorage.setItem('${SESSION_KEY}','1');if(seen){e.style.display='none';e.setAttribute('data-skip','1');}}catch(_){}})();`;

/** The client's animated logo, shown once per session over a white screen. Click to skip. */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (el.dataset.skip) {
      setGone(true);
      return;
    }
    document.documentElement.style.overflow = 'hidden';
    el.querySelector('video')?.play().catch(() => undefined);
    const timer = setTimeout(() => setFading(true), SHOW_MS);
    return () => {
      clearTimeout(timer);
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!fading) return;
    document.documentElement.style.overflow = '';
    const timer = setTimeout(() => setGone(true), 800);
    return () => clearTimeout(timer);
  }, [fading]);

  if (gone) return null;

  return (
    <>
      <div
        id="intro"
        ref={root}
        suppressHydrationWarning
        aria-hidden="true"
        onClick={() => setFading(true)}
        className={cn(
          'fixed inset-0 z-[100] grid place-items-center bg-white transition-opacity duration-700',
          fading && 'pointer-events-none opacity-0',
        )}
      >
        <video className="h-[min(88vw,560px)] w-[min(88vw,560px)]" src="/brand/logo-animated.mp4" muted playsInline preload="auto" />
      </div>
      <script dangerouslySetInnerHTML={{ __html: GUARD }} />
    </>
  );
}
