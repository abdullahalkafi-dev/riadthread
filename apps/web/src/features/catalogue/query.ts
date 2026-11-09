/**
 * The catalogue's filters live in the URL, so a filtered view can be shared and
 * the back button works. These helpers turn the URL into API arguments and back.
 * They are plain functions, used by the server pages and the client view alike.
 */

export type SortKey = 'order' | 'newest';

export interface ProductListArgs {
  category?: string;
  collection?: string;
  colour: string[];
  fabric: string[];
  q: string;
  sort: SortKey;
  page: number;
}

export const PAGE_SIZE = 24;

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

const first = (raw: RawParams, key: string): string | undefined => {
  if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
  const v = raw[key];
  return Array.isArray(v) ? v[0] : v;
};

const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

/** Reads filters from search params. `pathCollection` is the slug in /collections/[slug], when present. */
export function parseProductArgs(raw: RawParams, pathCollection?: string): ProductListArgs {
  const page = Number.parseInt(first(raw, 'page') ?? '1', 10);
  const args: ProductListArgs = {
    colour: list(first(raw, 'colour')),
    fabric: list(first(raw, 'fabric')),
    q: (first(raw, 'q') ?? '').trim().slice(0, 80),
    sort: first(raw, 'sort') === 'newest' ? 'newest' : 'order',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
  const category = first(raw, 'category');
  const collection = pathCollection ?? first(raw, 'collection');
  if (category) args.category = category;
  if (collection) args.collection = collection;
  return args;
}

/** Query string for the API. Empty values are left out so equal filters share one cache entry. */
export function toApiQuery(args: ProductListArgs): string {
  const sp = new URLSearchParams();
  if (args.category) sp.set('category', args.category);
  if (args.collection) sp.set('collection', args.collection);
  if (args.colour.length) sp.set('colour', [...args.colour].sort().join(','));
  if (args.fabric.length) sp.set('fabric', [...args.fabric].sort().join(','));
  if (args.q) sp.set('q', args.q);
  if (args.sort !== 'order') sp.set('sort', args.sort);
  if (args.page > 1) sp.set('page', String(args.page));
  sp.set('limit', String(PAGE_SIZE));
  return sp.toString();
}

/**
 * The address shown in the browser for a set of filters. A collection lives in the
 * path (/collections/ramadan-eid); everything else is a search parameter.
 */
export function toPageHref(args: ProductListArgs): string {
  const sp = new URLSearchParams();
  if (args.category) sp.set('category', args.category);
  if (args.colour.length) sp.set('colour', args.colour.join(','));
  if (args.fabric.length) sp.set('fabric', args.fabric.join(','));
  if (args.q) sp.set('q', args.q);
  if (args.sort !== 'order') sp.set('sort', args.sort);
  if (args.page > 1) sp.set('page', String(args.page));
  const path = args.collection ? `/collections/${args.collection}` : '/collections';
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

export const activeFilterCount = (args: ProductListArgs) =>
  (args.category ? 1 : 0) + args.colour.length + args.fabric.length;

export const sameArgs = (a: ProductListArgs, b: ProductListArgs) => toApiQuery(a) === toApiQuery(b);
