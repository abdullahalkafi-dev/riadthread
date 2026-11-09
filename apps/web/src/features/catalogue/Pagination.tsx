'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { toPageHref, type ProductListArgs } from './query';

interface Props {
  args: ProductListArgs;
  totalPages: number;
  onPage: (page: number) => void;
}

/** Page numbers as real links (crawlable), handled in the browser without a reload. */
export function Pagination({ args, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - args.page) <= 1,
  );

  const item = (page: number, label: React.ReactNode, extra?: string) => (
    <Link
      key={`${page}-${extra ?? ''}`}
      href={toPageHref({ ...args, page })}
      scroll={false}
      aria-current={page === args.page && !extra ? 'page' : undefined}
      aria-label={extra}
      onClick={(e) => {
        e.preventDefault();
        onPage(page);
      }}
      className={cn(
        'grid h-11 min-w-11 place-items-center rounded-full border px-3 text-sm transition',
        page === args.page && !extra ? 'border-ink bg-ink text-sand-50' : 'border-ink/20 hover:border-ink',
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav aria-label="Pages" className="mt-14 flex flex-wrap items-center justify-center gap-2">
      {args.page > 1 && item(args.page - 1, '‹', 'Previous page')}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - (pages[i - 1] ?? 0) > 1 && <span className="px-1 text-ink-mute">…</span>}
          {item(p, p)}
        </span>
      ))}
      {args.page < totalPages && item(args.page + 1, '›', 'Next page')}
    </nav>
  );
}
