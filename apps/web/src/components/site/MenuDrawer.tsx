'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { whatsappLink } from '@/lib/contact';
import { useSiteDispatch } from '@/store/site/hooks';
import { closeDrawer } from '@/store/site/ui.slice';
import type { PublicSettings, Taxonomy } from '@/types/api';
import { CategoryThumb } from './CategoryThumb';
import { Drawer } from './Drawer';
import { WhatsAppIcon } from './icons';
import { categoryHref, collectionHref, type NavCategory, type NavLink } from './nav';

interface Props {
  links: NavLink[];
  categories: NavCategory[];
  collections: Pick<Taxonomy, 'slug' | 'name'>[];
  settings: Pick<PublicSettings, 'whatsapp' | 'business'>;
}

/** Full-height navigation panel for small screens. */
export function MenuDrawer({ links, categories, collections, settings }: Props) {
  const dispatch = useSiteDispatch();
  const close = () => dispatch(closeDrawer());
  const whatsapp = whatsappLink(settings);

  const items: NavLink[] = [
    { label: 'Home', href: '/' },
    { label: 'All styles', href: '/collections' },
    { label: 'New arrivals', href: '/collections?sort=newest' },
    ...collections.map((c) => ({ label: c.name, href: collectionHref(c.slug) })),
    ...links.filter((l) => l.href !== '/'),
  ];

  return (
    <Drawer name="menu" side="left" label="Menu" className="flex w-[88%] max-w-sm flex-col overflow-y-auto bg-sand-50">
      <div className="flex h-[78px] shrink-0 items-center justify-between px-6">
        <Image src="/brand/wordmark.png" alt="Riad Threads" width={720} height={261} className="h-[46px] w-auto" />
        <button type="button" onClick={close} className="p-2" aria-label="Close menu">
          ✕
        </button>
      </div>
      <div className="zellige-strip" />

      {categories.length > 0 && (
        <div className="p-6">
          <p className="text-[11px] uppercase tracking-[.25em] text-terracotta-500">Shop by category</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {categories.slice(0, 6).map((c) => (
              <Link key={c.slug} href={categoryHref(c.slug)} onClick={close} className="text-center">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-b-[8px] rounded-t-full bg-sand-200">
                  <CategoryThumb image={c.image} alt="" sizes="120px" />
                </span>
                <span className="mt-1.5 block text-[12px] leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav aria-label="Menu" className={cn('flex flex-col divide-y divide-ink/10 px-6 font-display text-2xl')}>
        {items.map((l) => (
          <Link key={`${l.href}-${l.label}`} href={l.href} onClick={close} className="py-3.5">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto grid gap-3 p-6">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 text-night-950">
            <WhatsAppIcon size={18} /> WhatsApp us
          </a>
        )}
        <Image src="/brand/logo.png" alt="" width={112} height={112} className="mx-auto h-28 w-28" />
      </div>
    </Drawer>
  );
}
