'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Drawer } from '@/components/site/Drawer';
import { SearchIcon } from '@/components/site/icons';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { useSearchSuggestionsQuery } from '@/store/site/searchApi';
import { closeDrawer, openDrawer } from '@/store/site/ui.slice';

const DEBOUNCE_MS = 250;

/** Search suggestions as you type. Enter opens the full catalogue filtered by the text. */
export function SearchPanel({ suggestions }: { suggestions: string[] }) {
  const router = useRouter();
  const dispatch = useSiteDispatch();
  const open = useSiteSelector((s) => s.ui.drawer === 'search');
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  // Wait for a pause in typing before asking the API.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  // Focus once the panel has slid in.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => input.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [open]);

  // "/" opens the search from anywhere outside a form field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(target?.tagName ?? '') && !target?.isContentEditable) {
        e.preventDefault();
        dispatch(openDrawer('search'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  const { data, isFetching } = useSearchSuggestionsQuery({ q: query }, { skip: !open });

  const submit = () => {
    dispatch(closeDrawer());
    router.push(text.trim() ? `/collections?q=${encodeURIComponent(text.trim())}` : '/collections');
  };

  return (
    <Drawer name="search" side="top" label="Search the collection" className="bg-sand-50 shadow-2xl">
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center gap-4 border-b-2 border-ink pb-3">
          <SearchIcon size={24} />
          <input
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Search djellabas, colours, codes…"
            aria-label="Search the collection"
            className="flex-1 bg-transparent font-display text-2xl outline-none placeholder:text-ink-mute sm:text-4xl"
          />
          <button type="button" onClick={() => dispatch(closeDrawer())} className="text-sm uppercase tracking-[.2em] text-ink-soft hover:text-ink">
            Close ✕
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-1 text-ink-mute">Popular:</span>
            {suggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setText(term);
                  input.current?.focus();
                }}
                className="rounded-full border border-ink/15 px-3 py-1.5 hover:border-ink"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 grid max-h-[52vh] gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {isFetching && !data &&
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-2.5">
                <Skeleton className="h-20 w-16 rounded-t-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              </div>
            ))}
          {data?.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              onClick={() => dispatch(closeDrawer())}
              className="group flex items-center gap-4 rounded-2xl p-2.5 transition hover:bg-sand-100"
            >
              <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-b-md rounded-t-full bg-sand-200">
                <ResponsiveImage media={p.cover} alt="" sizes="64px" fill className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[.18em] text-ink-mute">
                  {p.category?.name ?? 'Collection'} · {p.code}
                </span>
                <span className="block font-display text-xl leading-tight group-hover:text-terracotta-600">{p.name}</span>
                <span className="block text-xs text-ink-soft">
                  MOQ {p.moq} · {p.packText}
                </span>
              </span>
            </Link>
          ))}
          {data && data.length === 0 && (
            <p className="col-span-full py-10 text-center text-ink-soft">
              No styles match “{query}”.{' '}
              <Link href="/enquiry" onClick={() => dispatch(closeDrawer())} className="text-terracotta-600 underline">
                Ask us
              </Link>
              , we may have it in stock.
            </p>
          )}
        </div>
      </div>
    </Drawer>
  );
}
