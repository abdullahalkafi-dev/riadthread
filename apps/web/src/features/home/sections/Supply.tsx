import { cn } from '@/lib/cn';
import type { BlockData } from '@/types/api';
import { SUPPLY_INTRO } from '../content';

const BACKDROPS = ['bg-night-900', 'bg-majorelle-900', 'bg-night-800', 'bg-majorelle-800'];

/** "Who we supply": one card per kind of stockist; the short description opens on hover or focus. */
export function Supply({ data }: { data: BlockData<'supply'> }) {
  if (data.items.length === 0) return null;
  return (
    <section aria-labelledby="supply-heading" className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="font-ruqaa text-3xl text-terracotta-500">أصالة</p>
          <h2 id="supply-heading" className="mt-2 font-display text-4xl leading-[1.02] sm:text-6xl">
            {data.heading || 'A trusted supplier for shops across the UK'}
          </h2>
        </div>
        <p className="max-w-md text-lg leading-relaxed text-ink-soft">{SUPPLY_INTRO}</p>
      </div>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.items.map((item, i) => (
          <li
            key={item.title}
            data-delay={String(i % 4)}
            tabIndex={0}
            className={cn('scard reveal group relative h-[440px] overflow-hidden rounded-[20px] text-sand-50 outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500', BACKDROPS[i % BACKDROPS.length])}
          >
            <div className="star-bg absolute inset-0 opacity-[.07] transition duration-[1200ms] group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-night-950/95 via-night-950/20 to-transparent" />
            <div className="absolute inset-x-6 bottom-6">
              <p className="text-[11px] uppercase tracking-[.22em] text-brass-300">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-1 font-display text-3xl">{item.title}</h3>
              {item.text && (
                <div className="more">
                  <p className="pt-2 text-sm text-sand-200">{item.text}</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
