import { notFound } from 'next/navigation';
import { whatsappLink } from '@/lib/contact';
import { apiGet } from '@/lib/server-api';
import { getCategories, getCollections, getSite, TAG } from '@/lib/site-data';
import type { ProductCard, ProductFilters } from '@/types/api';
import { CatalogueView } from './CatalogueView';
import { toApiQuery, type ProductListArgs } from './query';

/**
 * Server-rendered collection page. The first set of products is fetched here,
 * through the API's cache tags, so the HTML already contains the products
 * and a publish in the dashboard refreshes it.
 */
export async function CataloguePage({ args }: { args: ProductListArgs }) {
  const [products, filters, categories, collections, site] = await Promise.all([
    apiGet<ProductCard[]>(`/products?${toApiQuery(args)}`, { tags: [TAG.catalog] }),
    apiGet<ProductFilters>('/products/filters', { tags: [TAG.catalog] }),
    getCategories(),
    getCollections(),
    getSite(),
  ]);

  if (args.collection && !collections.some((c) => c.slug === args.collection)) notFound();

  const meta = products.meta ?? { page: args.page, limit: products.data.length, total: products.data.length, totalPages: 1 };
  return (
    <CatalogueView
      initial={{ args, items: products.data, meta }}
      filters={filters.data}
      categories={categories}
      collections={collections}
      whatsappHref={whatsappLink(site.settings)}
    />
  );
}
