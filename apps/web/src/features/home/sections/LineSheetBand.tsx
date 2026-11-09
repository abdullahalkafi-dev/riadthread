import { LineSheetForm } from '@/features/enquiry/LineSheetForm';
import { LINE_SHEET } from '../content';

/** Night-blue band offering the trade line sheet by email. Only rendered while the line sheet is switched on. */
export function LineSheetBand() {
  return (
    <section id="linesheet" aria-labelledby="linesheet-heading" className="relative scroll-mt-24 overflow-hidden bg-night-900 text-sand-50">
      <div className="star-bg absolute inset-0 opacity-[.06]" />
      <div className="absolute inset-0 bg-night-glow" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-24">
        <div className="reveal">
          <p className="text-[12px] uppercase tracking-[.3em] text-brass-300">{LINE_SHEET.eyebrow}</p>
          <h2 id="linesheet-heading" className="mt-4 font-display text-4xl leading-[1.02] sm:text-6xl">
            {LINE_SHEET.heading}
          </h2>
        </div>
        <div className="reveal" data-delay="1">
          <LineSheetForm />
          <p className="mt-4 text-sm text-sand-300">Trade customers only. No spam, unsubscribe any time.</p>
        </div>
      </div>
    </section>
  );
}
