import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ProductCardItem } from '@/features/catalogue/ProductCardItem';
import { ProductView } from '@/features/catalogue/product/ProductView';
import { RecentlyViewed } from '@/features/catalogue/product/RecentlyViewed';
import { breadcrumbJsonLd, jsonLdString, productJsonLd } from '@/features/catalogue/product/structuredData';
import { whatsappLink } from '@/lib/contact';
import { serverEnv } from '@/lib/env';
import { apiGetOrNull } from '@/lib/server-api';
import { getSite, TAG } from '@/lib/site-data';
import type { ProductDetail } from '@/types/api';

type Params = Promise<{ slug: string }>;

/** One fetch per request, shared by the metadata and the page. Refreshed when this product is published. */
const getProduct = cache(async (slug: string) => {
  const res = await apiGetOrNull<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { tags: [TAG.catalog, TAG.product(slug)], revalidate: 300 });
  return res?.data ?? null;
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found' };
  const { seo } = product;
  return {
    // The API already builds the full "name | ... | Riad Threads" title.
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: seo.canonicalPath },
    openGraph: { title: seo.title, description: seo.description, type: 'website', url: seo.canonicalPath, ...(seo.image ? { images: [seo.image] } : {}) },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description, ...(seo.image ? { images: [seo.image] } : {}) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, site] = await Promise.all([getProduct(slug), getSite()]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-28 pt-8 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(product, serverEnv.siteUrl, site.settings.business.name)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(product, serverEnv.siteUrl)) }} />

      <nav aria-label="Breadcrumb" className="text-[12px] uppercase tracking-[.18em] text-ink-soft">
        <Link href="/" className="hover:text-terracotta-500">Home</Link>
        <span className="mx-2 text-brass-500">/</span>
        <Link href="/collections" className="hover:text-terracotta-500">Collection</Link>
        {product.category && (
          <>
            <span className="mx-2 text-brass-500">/</span>
            <Link href={`/collections?category=${product.category.slug}`} className="text-terracotta-500">{product.category.name}</Link>
          </>
        )}
      </nav>

      <ProductView product={product} whatsappHref={whatsappLink(site.settings, product)} />

      {product.related.length > 0 && (
        <section className="mt-20 lg:mt-28" aria-labelledby="related-heading">
          <div className="flex items-end justify-between">
            <h2 id="related-heading" className="font-display text-3xl sm:text-5xl">Retailers also enquire about</h2>
            <Link href="/collections" className="hidden border-b border-ink pb-1 text-sm sm:inline">View all</Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-7 lg:grid-cols-4">
            {product.related.map((p) => (
              <ProductCardItem key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed current={product} />
    </div>
  );
}
