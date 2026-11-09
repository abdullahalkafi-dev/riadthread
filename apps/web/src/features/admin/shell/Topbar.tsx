'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ButtonLink, Icon, IconButton } from '@/components/admin';

interface TopbarProps {
  newCount: number;
  onMenu: () => void;
}

/** Sticky bar: menu button on phones, enquiry search, a link to the live site and the new-enquiry bell. */
export function Topbar({ newCount, onMenu }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/admin/enquiries?q=${encodeURIComponent(q)}` : '/admin/enquiries');
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-admin-line bg-admin-bg/85 px-4 py-3 backdrop-blur-lg min-[901px]:px-7 min-[901px]:py-3.5">
      <IconButton onClick={onMenu} aria-label="Open menu" className="min-[901px]:hidden">
        <Icon name="menu" />
      </IconButton>
      <form onSubmit={search} role="search" className="relative max-w-[460px] flex-1">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search enquiries, businesses, products…"
          aria-label="Search enquiries"
          className="w-full rounded-xl border border-admin-line bg-white py-2.5 pl-[38px] pr-3 outline-none focus:border-terracotta-500 focus:ring-4 focus:ring-terracotta-500/10"
        />
      </form>
      <div className="flex-1" />
      <ButtonLink href="/" target="_blank" rel="noopener" size="sm" className="max-sm:hidden">
        <Icon name="ext" />
        View website
      </ButtonLink>
      <Link
        href={newCount > 0 ? '/admin/enquiries?status=new' : '/admin/enquiries'}
        aria-label={newCount > 0 ? `${newCount} new enquiries` : 'Enquiries'}
        className="relative grid h-10 w-10 flex-none place-items-center rounded-[10px] border border-admin-line bg-white transition hover:border-sand-400"
      >
        <Icon name="bell" />
        {newCount > 0 && <span className="absolute right-[9px] top-2 h-2 w-2 rounded-full border-2 border-white bg-terracotta-500" />}
      </Link>
    </header>
  );
}
