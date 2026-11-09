import Link from 'next/link';
import type { BlockData } from '@/types/api';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/** Seasonal call to order early. Shown only while the Ramadan block is switched on in the dashboard. */
export function RamadanBand({ data }: { data: BlockData<'ramadan'> }) {
  if (!data.enabled) return null;
  return (
    <section aria-label={data.heading} className="relative overflow-hidden bg-majorelle-900 text-sand-50">
      <div className="star-bg absolute inset-0 opacity-[.05]" />
      <div className="relative mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-10">
        <div className="reveal">
          <p className="font-ruqaa text-3xl text-brass-300">رمضان كريم</p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl">{data.heading}</h2>
          {data.text && <p className="mt-2 max-w-xl text-sand-200/90">{data.text}</p>}
        </div>
        <div className="reveal flex flex-wrap items-center gap-x-8 gap-y-4" data-delay="1">
          {data.orderByDate && (
            <p className="text-sm text-sand-200">
              <span className="block text-[11px] uppercase tracking-[.2em] text-brass-300">Order by</span>
              <span className="font-display text-xl text-sand-50">{formatDate(data.orderByDate)}</span>
            </p>
          )}
          <Link href="/enquiry" className="btn-brass rounded-full px-7 py-3.5 text-[15px] font-medium">
            Send your Ramadan enquiry
          </Link>
        </div>
      </div>
    </section>
  );
}
