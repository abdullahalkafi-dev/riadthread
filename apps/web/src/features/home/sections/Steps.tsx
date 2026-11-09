import { OpenDrawerButton } from '@/components/site/OpenDrawerButton';
import { WhatsAppIcon } from '@/components/site/icons';
import { cn } from '@/lib/cn';
import { whatsappLink } from '@/lib/contact';
import type { BlockData, PublicSettings } from '@/types/api';
import { STEPS_INTRO } from '../content';

const COLOURS = ['bg-terracotta-500', 'bg-majorelle-700', 'bg-zellige-500', 'bg-brass-500'];

/** "How it works": numbered steps from the dashboard, then the two ways to get started. */
export function Steps({ data, settings }: { data: BlockData<'steps'>; settings: Pick<PublicSettings, 'whatsapp' | 'business'> }) {
  if (data.items.length === 0) return null;
  const whatsapp = whatsappLink(settings);
  const four = data.items.length >= 4;

  return (
    <section id="process" aria-labelledby="process-heading" className="relative scroll-mt-24 overflow-hidden bg-sand-200">
      <div className="star-bg-ink absolute inset-0 opacity-[.05]" />
      <div className="relative mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-[12px] uppercase tracking-[.3em] text-terracotta-500">How it works</p>
          <h2 id="process-heading" className="mt-4 font-display text-4xl leading-[1.02] sm:text-6xl">
            {data.heading || 'Wholesale, made simple'}
          </h2>
          <p className="mt-5 text-lg text-ink-soft">{STEPS_INTRO}</p>
        </div>

        <ol className={cn('relative mt-16 grid gap-6 md:grid-cols-2', four ? 'lg:grid-cols-4' : 'md:grid-cols-3')}>
          <li aria-hidden="true" className="absolute left-[16%] right-[16%] top-[44px] hidden h-px border-t border-dashed border-ink/30 lg:block" />
          {data.items.map((item, i) => (
            <li
              key={item.title}
              data-delay={String((i % 3) + 1)}
              className="reveal relative rounded-[22px] bg-sand-50 p-8 text-center shadow-[0_30px_60px_-40px_rgba(43,33,25,.5)] transition hover:-translate-y-1"
            >
              <span className={cn('mx-auto grid h-[88px] w-[72px] place-items-center rounded-b-[10px] rounded-t-full font-display text-3xl text-sand-50', COLOURS[i % COLOURS.length])}>{i + 1}</span>
              <h3 className="mt-6 font-display text-2xl">{item.title}</h3>
              {item.text && <p className="mt-2 leading-relaxed text-ink-soft">{item.text}</p>}
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <OpenDrawerButton drawer="enquiry" className="btn-terra rounded-full px-7 py-4 text-[15px]">
            Open my enquiry list
          </OpenDrawerButton>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-whatsapp/15 px-6 py-4 text-[15px] text-[#0f6b3a] transition hover:bg-whatsapp/25">
              <WhatsAppIcon size={18} /> Ask on WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
