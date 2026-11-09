'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  /** Pixels moved per pixel scrolled; negative values drift the other way. */
  factor: number;
  className?: string;
  children: ReactNode;
}

/**
 * Drifts its content slightly against the scroll direction while it is on screen.
 * Uses the independent `translate` property so it never fights a CSS transform
 * (such as the reveal animation) on the same element.
 */
export function ParallaxItem({ factor, className, children }: Props) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    const parent = node?.parentElement;
    if (!node || !parent || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    const run = () => {
      ticking = false;
      const vh = window.innerHeight;
      const r = parent.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      node.style.translate = `0 ${(r.top + r.height / 2 - vh / 2) * factor}px`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(run);
      }
    };
    run();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [factor]);

  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );
}
