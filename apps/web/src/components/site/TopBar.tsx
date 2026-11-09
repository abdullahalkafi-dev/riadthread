'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { telLink, whatsappLink } from '@/lib/contact';
import type { PublicSettings } from '@/types/api';
import { WhatsAppIcon } from './icons';

export interface TickerMessage {
  text: string;
  href?: string;
}

const INTERVAL_MS = 3800;

/** Dark strip above the header: positioning line, a rotating notice and the phone number. */
export function TopBar({ messages, settings }: { messages: TickerMessage[]; settings: Pick<PublicSettings, 'whatsapp' | 'business'> }) {
  const [current, setCurrent] = useState(0);
  const whatsapp = whatsappLink(settings);
  const phone = settings.business.phone;
  const tel = telLink(phone);

  useEffect(() => {
    if (messages.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % messages.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="bg-night-900 text-[12px] text-sand-200">
      <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <p className="hidden items-center gap-2 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-brass-400" />
          Trade only · Moroccan wholesale for UK retailers
        </p>

        <div className="relative h-9 flex-1 overflow-hidden text-center md:w-[360px] md:flex-none" aria-live="off">
          {messages.map((m, i) => {
            const active = i === current;
            const content = m.href ? (
              <Link href={m.href} className="hover:text-brass-200">
                {m.text}
              </Link>
            ) : (
              m.text
            );
            return (
              <p
                key={m.text}
                aria-hidden={!active}
                className={cn(
                  'absolute inset-0 grid place-items-center px-2 transition duration-700',
                  active ? 'translate-y-0 opacity-100' : i === (current + 1) % messages.length ? 'translate-y-3 opacity-0' : '-translate-y-3 opacity-0',
                )}
              >
                {content}
              </p>
            );
          })}
        </div>

        {(whatsapp || tel) && (
          <a
            href={whatsapp ?? tel ?? '#'}
            {...(whatsapp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="hidden items-center gap-2 text-brass-300 hover:text-brass-200 md:flex"
          >
            <WhatsAppIcon size={14} />
            {phone || 'WhatsApp us'}
          </a>
        )}
      </div>
    </div>
  );
}
