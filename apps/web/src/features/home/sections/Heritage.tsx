import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { BlockData, Media, ProductCard } from '@/types/api';
import { HERITAGE } from '../content';
import { ParallaxItem } from './ParallaxItem';

interface Props {
  data: BlockData<'heritage'> | undefined;
  image: Media | null;
  /** Styles shown in the sliding ribbon under the section. */
  ribbon: ProductCard[];
}

const frame = 'overflow-hidden rounded-b-[14px] rounded-t-[999px] ring-1 ring-brass-400/50 ring-offset-[10px] ring-offset-night-900 shadow-2xl';

/** Dark "our heritage" section: story text, three framed images and a ribbon of the collection. */
export function Heritage({ data, image, ribbon }: Props) {
  const heading = data?.heading || 'Rooted in Fez, a city of craft.';
  const body = data?.body || HERITAGE.body;
  const strip = ribbon.filter((p) => p.cover);

  return (
    <section aria-labelledby="heritage-heading" className="relative overflow-hidden bg-night-900 text-sand-100">
      <div className="absolute inset-0 bg-night-glow" />
      <div className="star-bg absolute inset-0 opacity-[.035]" />
      <p aria-hidden="true" className="outline-brass pointer-events-none absolute -right-10 top-10 select-none font-ruqaa text-[16rem] leading-none lg:text-[26rem]">
        تراث
      </p>

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-10 lg:py-32">
        <div className="reveal lg:col-span-5">
          <p className="text-[12px] uppercase tracking-[.3em] text-brass-300">{HERITAGE.eyebrow}</p>
          <h2 id="heritage-heading" className="mt-5 font-display text-5xl leading-[1] text-sand-50 sm:text-6xl lg:text-7xl">
            {heading}
          </h2>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-sand-200/80">{body}</p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-brass-400/25 pt-8">
            {HERITAGE.stats.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-4xl text-brass-300">{s.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-sand-300">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative h-[520px] sm:h-[640px] lg:col-span-7">
          <ParallaxItem factor={-0.06} className={cn('absolute right-0 top-0 aspect-[3/4] w-[64%] sm:w-[56%] lg:right-6', frame)}>
            {image ? <ResponsiveImage media={image} alt={data?.heading ?? 'Moroccan craft'} sizes="(min-width:1024px) 30vw, 60vw" fill className="object-cover" /> : <div className="star-bg h-full w-full bg-majorelle-800" />}
          </ParallaxItem>
          <ParallaxItem factor={0.08} className={cn('absolute bottom-0 left-0 aspect-[3/4] w-[50%] sm:w-[42%]', frame)}>
            <div className="star-bg h-full w-full bg-night-800 opacity-90" />
          </ParallaxItem>
          <ParallaxItem factor={0.14} className="absolute left-[34%] top-[8%] h-28 w-28 overflow-hidden rounded-full shadow-2xl ring-[6px] ring-night-900 sm:left-[30%] sm:h-36 sm:w-36">
            <div className="zellige-strip brass spin h-full w-full" style={{ animationDuration: '60s', height: '100%' }} />
          </ParallaxItem>
        </div>
      </div>

      {strip.length >= 4 && (
        <div className="marquee-wrap relative pb-20 lg:pb-28" aria-hidden="true">
          <div className="marquee-slow flex w-max gap-5">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-5">
                {strip.map((p, i) => (
                  <figure
                    key={p.id}
                    className={cn(
                      'gal-item relative h-[260px] shrink-0 overflow-hidden bg-night-800 sm:h-[320px]',
                      i % 2 ? 'w-[200px] rounded-b-[14px] rounded-t-full sm:w-[240px]' : 'w-[300px] rounded-[14px] sm:w-[380px]',
                    )}
                  >
                    <ResponsiveImage media={p.cover} alt="" sizes="380px" fill className="gal-img object-cover" />
                    <figcaption className="absolute bottom-3 left-3 rounded-full bg-night-950/70 px-3 py-1 text-[11px] text-sand-200 backdrop-blur">{p.name}</figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
