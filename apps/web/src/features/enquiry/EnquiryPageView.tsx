'use client';

import { lineQty } from '@/store/site/enquiry.slice';
import { EmptyList, EnquiryLines } from './EnquiryLines';
import { EnquiryForm } from './EnquiryForm';
import { useEnquiryLines } from './useEnquiryLines';

/** The full-page enquiry: the visitor's list with editable quantities, next to the form. */
export function EnquiryPageView() {
  const { lines, ready } = useEnquiryLines();
  const units = lines.reduce((n, l) => n + lineQty(l), 0);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <section className="lg:col-span-5" aria-labelledby="your-list">
        <h2 id="your-list" className="font-display text-3xl">Your enquiry list</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {lines.length ? `${lines.length} product${lines.length > 1 ? 's' : ''} · ~${units} units` : 'No products yet'}
        </p>
        <div className="mt-4 rounded-[20px] bg-sand-100 px-5 ring-1 ring-sand-300">
          {!ready ? (
            <div className="h-40 animate-pulse" aria-busy />
          ) : lines.length > 0 ? (
            <EnquiryLines lines={lines} mode="sizes" />
          ) : (
            <EmptyList />
          )}
        </div>
      </section>
      <div className="lg:col-span-7">
        <EnquiryForm entryPoint="enquiry_page" />
      </div>
    </div>
  );
}
