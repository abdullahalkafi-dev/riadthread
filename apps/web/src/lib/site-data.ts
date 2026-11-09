import 'server-only';
import { cache } from 'react';
import type { PageContent, ProductCard, SitePayload, Taxonomy } from '@/types/api';
import { apiGet, apiGetOrNull } from './server-api';

/*
 * Cache tags match what the API sends to /api/revalidate after a publish:
 * "site" for content and settings, "catalog" for products, categories and
 * collections, `product:<slug>` for one product and `page:<key>` for one page.
 */
export const TAG = {
  site: 'site',
  catalog: 'catalog',
  product: (slug: string) => `product:${slug}`,
  page: (key: string) => `page:${key}`,
} as const;

/** Shared by the layout, the home page and the metadata of every page in one render. */
export const getSite = cache(async () => (await apiGet<SitePayload>('/site', { tags: [TAG.site] })).data);

export const getCategories = cache(async () => (await apiGet<Taxonomy[]>('/categories', { tags: [TAG.catalog] })).data);

export const getCollections = cache(async () => (await apiGet<Taxonomy[]>('/collections', { tags: [TAG.catalog] })).data);

export const getPage = cache(async (key: string) => {
  const res = await apiGetOrNull<PageContent>(`/pages/${key}`, { tags: [TAG.site, TAG.page(key)] });
  return res?.data ?? null;
});

export async function getProducts(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') params.set(k, String(v));
  const res = await apiGet<ProductCard[]>(`/products?${params}`, { tags: [TAG.catalog] });
  return { items: res.data, total: res.meta?.total ?? res.data.length };
}

export const getSitemapProducts = () =>
  apiGet<Array<{ slug: string; updatedAt: string }>>('/products/sitemap', { tags: [TAG.catalog] }).then((r) => r.data);
