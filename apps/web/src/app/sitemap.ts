import type { MetadataRoute } from 'next';
import { serverEnv } from '@/lib/env';
import { getCollections, getSitemapProducts } from '@/lib/site-data';

const PAGES = ['/about', '/contact', '/faq', '/enquiry', '/privacy', '/cookies', '/terms'];

/** Every public address: home, catalogue, collections, each published product and the text pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getSitemapProducts(), getCollections()]);
  const url = (path: string) => `${serverEnv.siteUrl}${path}`;

  return [
    { url: url('/'), changeFrequency: 'weekly', priority: 1 },
    { url: url('/collections'), changeFrequency: 'daily', priority: 0.9 },
    ...collections
      .filter((c) => c.isActive && c.publishedCount > 0)
      .map((c) => ({ url: url(`/collections/${c.slug}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: url(`/products/${p.slug}`),
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...PAGES.map((path) => ({ url: url(path), changeFrequency: 'monthly' as const, priority: 0.4 })),
  ];
}
