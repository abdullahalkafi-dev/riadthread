import { lightCard } from '@/lib/light';
import { getProducts } from '@/lib/site-data';
import type { ProductCard, Taxonomy } from '@/types/api';
import { ShowcaseSlider, type ShowcaseTab } from './ShowcaseSlider';

const PER_TAB = 12;
const MAX_COLLECTION_TABS = 3;

interface Props {
  /** The catalogue in display order, already fetched by the page. */
  products: ProductCard[];
  total: number;
  collections: Taxonomy[];
}

/**
 * Builds the showcase tabs on the server: new arrivals, bestsellers (styles the
 * team marked as featured) and one tab per collection shown on the home page.
 * Empty tabs are dropped, so a young catalogue still looks complete.
 */
export async function Showcase({ products, total, collections }: Props) {
  const shown = collections.filter((c) => c.isActive && c.showOnHome && c.publishedCount > 0).slice(0, MAX_COLLECTION_TABS);
  const [newest, ...byCollection] = await Promise.all([
    getProducts({ sort: 'newest', limit: PER_TAB }),
    ...shown.map((c) => getProducts({ collection: c.slug, limit: PER_TAB })),
  ]);

  const flaggedNew = newest.items.filter((p) => p.newArrival);
  const lists: Array<{ key: string; label: string; items: ProductCard[] }> = [
    { key: 'new', label: 'New arrivals', items: flaggedNew.length >= 4 ? flaggedNew : newest.items },
    { key: 'best', label: 'Bestsellers', items: products.filter((p) => p.featured).slice(0, PER_TAB) },
    ...shown.map((c, i) => ({ key: c.slug, label: c.name, items: byCollection[i]?.items ?? [] })),
  ].filter((l) => l.items.length > 0);

  if (lists.length === 0) return null;
  const byId = Object.fromEntries(lists.flatMap((l) => l.items).map((p) => [p.id, lightCard(p)]));
  const tabs: ShowcaseTab[] = lists.map((l) => ({ key: l.key, label: l.label, ids: l.items.map((p) => p.id) }));
  return <ShowcaseSlider tabs={tabs} products={byId} total={total} />;
}
