import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <Image src="/brand/logo.png" alt="" width={112} height={112} className="mx-auto h-28 w-28" />
      <p className="mt-6 text-[12px] uppercase tracking-[.3em] text-terracotta-500">Error 404</p>
      <h1 className="mt-3 font-display text-5xl leading-tight">We could not find that page</h1>
      <p className="mt-4 text-ink-soft">It may have moved or no longer be available. The collection is a good place to start again.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/collections" className="btn-terra rounded-full px-7 py-4 text-[15px]">
          Browse the collection
        </Link>
        <Link href="/" className="btn-line rounded-full px-7 py-4 text-[15px]">
          Back to the home page
        </Link>
      </div>
    </div>
  );
}
