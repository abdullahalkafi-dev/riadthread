import Link from 'next/link';
import { whatsappLink } from '@/lib/contact';
import type { BlockData, PublicSettings } from '@/types/api';
import { FAQ_HEADING } from '../content';

/**
 * Accordion of common questions, using native <details> so it works without
 * JavaScript. The same questions are published as FAQPage structured data,
 * which search engines can show directly in results.
 */
export function Faq({ data, settings }: { data: BlockData<'faq'>; settings: Pick<PublicSettings, 'whatsapp' | 'business'> }) {
  if (data.items.length === 0) return null;
  const whatsapp = whatsappLink(settings);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };

  return (
    <section aria-labelledby="faq-heading" className="bg-sand-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-5">
          <div className="reveal lg:sticky lg:top-32">
            <p className="text-[12px] uppercase tracking-[.3em] text-terracotta-500">Questions</p>
            <h2 id="faq-heading" className="mt-4 font-display text-4xl leading-[1.02] sm:text-6xl">
              {FAQ_HEADING}
            </h2>
            <div className="star-bg mt-8 aspect-[4/3] overflow-hidden rounded-b-[20px] rounded-t-[999px] bg-majorelle-800" aria-hidden="true" />
            <p className="mt-6 text-ink-soft">
              Something else?{' '}
              {whatsapp && (
                <>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-terracotta-600 underline underline-offset-4">
                    Message us on WhatsApp
                  </a>{' '}
                  or{' '}
                </>
              )}
              <Link href="/enquiry" className="text-terracotta-600 underline underline-offset-4">
                send an enquiry
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="border-t border-ink/15 lg:col-span-7">
          {data.items.map((item, i) => (
            <details key={item.q} className="faq reveal border-b border-ink/15" open={i === 0}>
              <summary className="flex items-center justify-between gap-6 py-6 font-display text-2xl transition">
                {item.q}
                <span className="pm grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/20 font-sans text-xl" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="pb-6 pr-14 leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
