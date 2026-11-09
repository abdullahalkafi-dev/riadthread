import type { BlockData, Media } from '@/types/api';
import { STORY } from '../content';
import { FilmPlayer } from './FilmPlayer';

interface Props {
  data: BlockData<'brandFilm'> | undefined;
  video: Media | null;
  poster: Media | null;
}

/** "Our story" band: headline, the brand film when one is uploaded, and four proof points. */
export function BrandFilm({ data, video, poster }: Props) {
  const heading = data?.heading || STORY.heading;
  const posterUrl = poster?.url ?? video?.posterUrl ?? undefined;
  return (
    <section id="story" aria-labelledby="story-heading" className="relative overflow-hidden bg-night-900 text-sand-100">
      <div className="absolute inset-0 bg-night-glow" />
      <div className="relative mx-auto grid max-w-[1400px] items-end gap-8 px-4 pb-12 pt-20 sm:px-6 lg:grid-cols-12 lg:px-10 lg:pt-28">
        <div className="reveal lg:col-span-6">
          <p className="text-[12px] uppercase tracking-[.3em] text-brass-300">{STORY.eyebrow}</p>
          <h2 id="story-heading" className="mt-4 font-display text-4xl leading-[1.02] text-sand-50 sm:text-6xl">
            {heading}
          </h2>
        </div>
        <div className="reveal lg:col-span-5 lg:col-start-8" data-delay="1">
          <p className="text-lg leading-relaxed text-sand-200/80">{STORY.body}</p>
        </div>
      </div>

      {video?.url && (
        <div className="relative">
          <div className="zellige-strip brass" />
          <FilmPlayer src={video.url} {...(posterUrl ? { poster: posterUrl } : {})} {...(video.durationSec ? { duration: `0:${String(video.durationSec).padStart(2, '0')}` } : {})} />
          <div className="zellige-strip brass" />
        </div>
      )}

      <dl className="relative mx-auto grid max-w-[1400px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-10">
        {STORY.stats.map((s, i) => (
          <div key={s.value} className="reveal" data-delay={String(i)}>
            <dt className="font-display text-2xl text-brass-300 sm:text-4xl">{s.value}</dt>
            <dd className="mt-1 text-sm text-sand-300">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
