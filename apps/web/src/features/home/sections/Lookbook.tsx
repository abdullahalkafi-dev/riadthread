import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { BlockData, Media } from '@/types/api';

interface Props {
  data: BlockData<'lookbook'>;
  images: Media[];
}

/** Layout of the first four pictures, as in the design; any further ones fill extra rows. */
const SHAPES = [
  'rounded-b-[20px] rounded-t-[999px] aspect-[3/4] lg:aspect-auto lg:h-[720px]',
  'rounded-[20px] aspect-[4/3] lg:aspect-auto',
  'rounded-[20px] aspect-[4/3] lg:aspect-auto',
  'rounded-b-[20px] rounded-t-[999px] aspect-[3/4] lg:aspect-auto lg:h-[720px] sm:col-span-2 lg:col-span-1',
];

/** "Shop the look": a bento of lifestyle pictures chosen in the dashboard. Hidden until pictures exist. */
export function Lookbook({ data, images }: Props) {
  if (images.length === 0) return null;
  const [a, b, c, d, ...more] = images;
  const heading = data.heading || 'Shop the look';
  const figure = (m: Media | undefined, shape: string, i: number) =>
    m && (
      <figure key={m.id} data-delay={String(i % 3)} className={cn('reveal relative overflow-hidden bg-sand-200', shape)}>
        <ResponsiveImage media={m} alt={`${heading}, look ${i + 1}`} sizes="(min-width:1024px) 33vw, 100vw" fill className="object-cover" />
      </figure>
    );

  // Pictures beyond the first four fill rows of three; a short last row stretches so the grid has no hole.
  const leftover = more.length % 3;
  const extra = (i: number) => {
    const last = i === more.length - 1;
    if (last && leftover === 2) return 'rounded-[20px] aspect-[4/3] lg:col-span-2 lg:aspect-[8/3]';
    if (last && leftover === 1) return 'rounded-[20px] aspect-[4/3] lg:col-span-3 lg:aspect-[16/5]';
    return 'rounded-[20px] aspect-[4/3]';
  };

  return (
    <section id="lookbook" aria-labelledby="lookbook-heading" className="mx-auto max-w-[1400px] scroll-mt-24 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[12px] uppercase tracking-[.3em] text-terracotta-500">Lookbook</p>
          <h2 id="lookbook-heading" className="mt-4 font-display text-4xl leading-[1.02] sm:text-6xl">
            {heading}
          </h2>
        </div>
        <p className="max-w-md text-lg leading-relaxed text-ink-soft">See how the range looks when it is styled, then add what you like to your enquiry.</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {figure(a, SHAPES[0]!, 0)}
        {(b || c) && (
          <div className="grid gap-5 lg:h-[720px] lg:grid-rows-[1fr_1fr]">
            {figure(b, SHAPES[1]!, 1)}
            {figure(c, SHAPES[2]!, 2)}
          </div>
        )}
        {figure(d, SHAPES[3]!, 3)}
        {more.map((m, i) => figure(m, extra(i), i + 4))}
      </div>
    </section>
  );
}
