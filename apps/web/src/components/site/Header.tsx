'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { whatsappLink } from '@/lib/contact';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { openDrawer } from '@/store/site/ui.slice';
import type { PublicSettings, Taxonomy } from '@/types/api';
import { BagIcon, MenuIcon, SearchIcon, WhatsAppIcon } from './icons';
import { MegaMenu } from './MegaMenu';
import type { NavCategory, NavLink } from './nav';

interface Props {
  links: NavLink[];
  categories: NavCategory[];
  collections: Pick<Taxonomy, 'slug' | 'name'>[];
  settings: Pick<PublicSettings, 'whatsapp' | 'business' | 'lineSheetEnabled'>;
}

/** Sticky site header: logo, navigation with the collection panel, search, WhatsApp and the enquiry list. */
export function Header({ links, categories, collections, settings }: Props) {
  const dispatch = useSiteDispatch();
  const pathname = usePathname();
  const count = useSiteSelector((s) => s.enquiryList.lines.length);
  const [scrolled, setScrolled] = useState(false);
  const whatsapp = whatsappLink(settings);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [home, ...rest] = links;
  const isActive = (href: string) => (href.includes('#') ? false : pathname === href);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 backdrop-blur-md transition',
        scrolled ? 'bg-sand-50/95 shadow-[0_10px_30px_-20px_rgba(43,33,25,.35)]' : 'bg-sand-50/85',
      )}
    >
      <div className="mx-auto flex h-[78px] max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <button type="button" className="-ml-2 p-2 lg:hidden" onClick={() => dispatch(openDrawer('menu'))} aria-label="Open menu">
          <MenuIcon />
        </button>

        <Link href="/" className="mr-auto flex items-center gap-3 lg:mr-0" aria-label="Riad Threads, home">
          <Image src="/brand/wordmark.png" alt="Riad Threads" width={720} height={261} priority className="h-[54px] w-auto sm:h-[62px]" />
        </Link>

        <nav aria-label="Main" className="mx-auto hidden items-center gap-8 text-[14px] text-ink-soft lg:flex">
          {home && (
            <Link href={home.href} aria-current={isActive(home.href) ? 'page' : undefined} className="nav-link hover:text-ink">
              {home.label}
            </Link>
          )}
          <MegaMenu categories={categories} collections={collections} lineSheetEnabled={settings.lineSheetEnabled} active={pathname.startsWith('/collections') || pathname.startsWith('/products')} />
          {rest.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} className="nav-link hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => dispatch(openDrawer('search'))}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-sand-200"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 w-10 place-items-center rounded-full text-[#128c4a] transition hover:bg-whatsapp/15 sm:grid"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          )}
          <button
            type="button"
            onClick={() => dispatch(openDrawer('enquiry'))}
            className="relative flex h-10 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 text-sand-50 transition hover:bg-terracotta-600"
          >
            <BagIcon />
            <span className="hidden text-[13px] sm:inline">Enquiry list</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brass-400 px-1 text-[11px] font-semibold text-night-900" aria-label={`${count} in your list`}>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="zellige-strip opacity-70" />
    </header>
  );
}
