import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getPage } from '@/lib/site-data';

/** Metadata for a text page: dashboard SEO fields first, the page title otherwise. */
export async function textPageMetadata(key: string, path: string): Promise<Metadata> {
  const page = await getPage(key);
  if (!page) return {};
  const title = page.seoTitle || page.title;
  return {
    title,
    ...(page.seoDescription ? { description: page.seoDescription } : {}),
    alternates: { canonical: path },
    openGraph: { title, ...(page.seoDescription ? { description: page.seoDescription } : {}), url: path },
  };
}

interface Props {
  /** Page key in the content API ("about", "faq-page" ...). */
  pageKey: string;
  /** Extra content shown under the text, such as the contact details. */
  children?: ReactNode;
}

/**
 * A plain content page (about, contact, FAQ, privacy ...): heading band, then the
 * text written in the dashboard. The API sanitises the HTML when it is saved.
 */
export async function TextPage({ pageKey, children }: Props) {
  const page = await getPage(pageKey);
  if (!page) notFound();

  return (
    <article>
      <header className="relative overflow-hidden bg-sand-100">
        <div className="star-bg-ink absolute inset-0 opacity-[.05]" />
        <div className="relative mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <nav aria-label="Breadcrumb" className="text-[12px] uppercase tracking-[.18em] text-ink-soft">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{page.title}</span>
          </nav>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-7xl">{page.title}</h1>
        </div>
        <div className="zellige-strip" />
      </header>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="prose-rt text-[17px]" dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
        {children}
      </div>
    </article>
  );
}
