'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Fades elements marked with the `reveal` class into view as they scroll on
 * screen. One observer for the whole site keeps the sections themselves plain
 * server components. Without JavaScript a <noscript> rule shows everything.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.add('is-in');
                io?.unobserve(entry.target);
              }
            },
            { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
          )
        : null;

    const watch = () =>
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));

    watch();
    // Client-rendered content (product sliders, search results) appears after load.
    const mutations = new MutationObserver(watch);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      io?.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
