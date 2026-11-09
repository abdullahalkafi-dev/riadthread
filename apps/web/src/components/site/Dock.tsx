'use client';

import { useEffect, useRef, useState } from 'react';
import { whatsappLink } from '@/lib/contact';
import { cn } from '@/lib/cn';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { openDrawer } from '@/store/site/ui.slice';
import type { PublicSettings } from '@/types/api';
import { ArrowUpIcon, BagIcon, WhatsAppIcon } from './icons';

const RING = 131.95;

/** Floating shortcuts: back to top (with a scroll progress ring), enquiry list, WhatsApp. */
export function Dock({ settings }: { settings: Pick<PublicSettings, 'whatsapp' | 'business'> }) {
  const dispatch = useSiteDispatch();
  const count = useSiteSelector((s) => s.enquiryList.lines.length);
  const [on, setOn] = useState(false);
  const ring = useRef<SVGCircleElement>(null);
  const whatsapp = whatsappLink(settings);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setOn(window.scrollY > 600);
      ring.current?.style.setProperty('stroke-dashoffset', String(RING - RING * Math.min(1, window.scrollY / Math.max(1, max))));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className={cn('dock fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6', on && 'is-on')}>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="hide-top relative grid h-12 w-12 place-items-center rounded-full bg-sand-50 text-ink shadow-[0_12px_30px_-10px_rgba(43,33,25,.5)] transition-colors hover:bg-ink hover:text-sand-50"
        aria-label="Back to top"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(43,33,25,.12)" strokeWidth="2" />
          <circle ref={ring} cx="24" cy="24" r="21" fill="none" stroke="#b9603f" strokeWidth="2" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING} />
        </svg>
        <ArrowUpIcon />
        <span className="tip absolute right-full mr-3 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs text-sand-50">Back to top</span>
      </button>

      <button
        type="button"
        onClick={() => dispatch(openDrawer('enquiry'))}
        className="hide-top relative grid h-12 w-12 place-items-center rounded-full bg-terracotta-500 text-sand-50 shadow-[0_12px_30px_-10px_rgba(152,74,47,.8)] transition-colors hover:bg-terracotta-600"
        aria-label="Enquiry list"
      >
        <BagIcon size={18} strokeWidth={1.7} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brass-400 px-1 text-[11px] font-semibold text-night-900">{count}</span>
        )}
        <span className="tip absolute right-full mr-3 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs text-sand-50">Your enquiry list</span>
      </button>

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="relative grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-[0_14px_34px_-10px_rgba(18,140,74,.8)] transition hover:scale-105"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon size={26} />
          <span className="tip absolute right-full mr-3 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs text-sand-50">Chat on WhatsApp</span>
        </a>
      )}
    </div>
  );
}
