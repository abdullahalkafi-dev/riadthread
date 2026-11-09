import type { Metadata } from 'next';
import Link from 'next/link';
import { EnquiryPageView } from '@/features/enquiry/EnquiryPageView';

export const metadata: Metadata = {
  title: 'Send an enquiry',
  description: 'Tell Riad Threads about your shop and the styles you would like to stock. A real person replies within one working day with trade prices.',
  alternates: { canonical: '/enquiry' },
};

export default function EnquiryPage() {
  return (
    <>
      <div className="relative overflow-hidden bg-sunset">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <p className="text-[12px] uppercase tracking-[.3em] text-terracotta-600">
            <Link href="/" className="hover:text-terracotta-500">Home</Link> / Enquiry
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[.98] sm:text-7xl">Our door is open.</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            Review your list, tell us about your shop, and send it in one go. A real person replies within one working day.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <EnquiryPageView />
      </div>
    </>
  );
}
