import { Types } from 'mongoose';
import type { ProductInput } from '@riad/shared';
import { cached, CACHE_TAGS, invalidate } from '../../lib/cache';
import { revalidateWeb } from '../../lib/revalidate';
import { cleanHtml } from '../../lib/sanitizeHtml';
import { AppError } from '../../utils/AppError';
import { escapeRegex, slugify } from '../../utils/text';
import { Enquiry } from '../enquiry/enquiry.model';
import { loadMedia } from '../media/media.service';
import { getSettings } from '../settings/settings.service';
import { Category, Collection } from '../taxonomy/taxonomy.model';
import { taxonomyIndex } from '../taxonomy/taxonomy.service';
import { cardMediaIds, toAdminProductDto, toCardDto } from './product.dto';
import { Product, type ProductDoc } from './product.model';

type Input = Partial<ProductInput>;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const lastWord = (s: string) => {
  const w = s.trim().split(/\s+/).pop() ?? '';
  return w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : '';
};

async function uniqueValue(field: 'slug' | 'code', base: string, excludeId?: string) {
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const clash = await Product.exists({ [field]: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
  }
  throw AppError.conflict(`Could not create a unique ${field}`);
}

/** Clean and validate a product payload against the database, in a fixed number of queries. */
async function normalise(input: Input, existing?: ProductDoc): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...input };

  if (input.categoryId || input.collectionId) {
    const [cat, col] = await Promise.all([
      input.categoryId ? Category.exists({ _id: input.categoryId }) : true,
      input.collectionId ? Collection.exists({ _id: input.collectionId }) : true,
    ]);
    if (!cat) throw AppError.badRequest('That category does not exist', [{ path: 'body.categoryId', message: 'Unknown category' }]);
    if (!col) throw AppError.badRequest('That collection does not exist', [{ path: 'body.collectionId', message: 'Unknown collection' }]);
  }

  if (input.name !== undefined || input.slug !== undefined) {
    const base = slugify(input.slug ?? input.name ?? existing?.slug ?? '');
    if (!base) throw AppError.badRequest('The page address is empty');
    out.slug = await uniqueValue('slug', base, existing ? String(existing._id) : undefined);
  }
  if (input.code !== undefined) {
    const clash = await Product.exists({ code: input.code, ...(existing ? { _id: { $ne: existing._id } } : {}) });
    if (clash) throw AppError.conflict('Another product already uses that code');
  }

  if (input.descriptionHtml !== undefined) out.descriptionHtml = cleanHtml(input.descriptionHtml);

  if (input.specs) {
    const fabricType = input.specs.fabricType || lastWord(input.specs.fabric);
    out.specs = { ...input.specs, fabricType };
  }

  // Colours: keep supplied ids, give new colours one, so media can be tagged straight away.
  const colours = input.colours?.map((c) => ({ ...c, _id: new Types.ObjectId(c._id ?? undefined) }));
  if (colours) out.colours = colours;
  const colourIds = new Set((colours ?? existing?.colours ?? []).map((c) => String(c._id)));

  if (input.media) {
    for (const m of input.media) {
      if (m.colourId && !colourIds.has(m.colourId)) {
        throw AppError.badRequest('A photo is tagged with a colour that does not exist', [{ path: 'body.media', message: 'Unknown colour' }]);
      }
    }
  }

  if (input.media || colours) {
    const ids = [
      ...(input.media ?? []).map((m) => m.mediaId),
      ...(colours ?? []).map((c) => c.swatchMediaId).filter((v): v is string => !!v),
    ];
    const found = await loadMedia(ids);
    const missing = ids.find((id) => !found.has(id));
    if (missing) throw AppError.badRequest('One of the chosen files no longer exists', [{ path: 'body.media', message: `Unknown file ${missing}` }]);
  }

  return out;
}

async function afterChange(p: { slug: string }, previousSlug?: string) {
  await invalidate(CACHE_TAGS.catalog, CACHE_TAGS.overview);
  void revalidateWeb(['catalog', `product:${p.slug}`, ...(previousSlug && previousSlug !== p.slug ? [`product:${previousSlug}`] : [])]);
}

async function mediaFor(products: ProductDoc[]) {
  return loadMedia(products.flatMap(cardMediaIds));
}

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

export async function adminList(q: {
  q?: string | undefined;
  status?: string | undefined;
  categoryId?: string | undefined;
  collectionId?: string | undefined;
  page: number;
  limit: number;
}) {
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.categoryId) filter.categoryId = q.categoryId;
  if (q.collectionId) filter.collectionId = q.collectionId;
  if (q.q) {
    const re = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ name: re }, { code: re }];
  }

  const [docs, total, categories, collections] = await Promise.all([
    Product.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Product.countDocuments(filter),
    Category.find().select('name').lean(),
    Collection.find().select('name').lean(),
  ]);
  const products = docs as unknown as ProductDoc[];
  const ids = products.map((p) => p._id);

  // Cover photos and enquiry counts for the whole page: one query each, never one per row.
  const [media, counts] = await Promise.all([
    loadMedia(products.map((p) => (p.media[0] ? String(p.media[0].mediaId) : null))),
    ids.length
      ? Enquiry.aggregate<{ _id: Types.ObjectId; n: number }>([
          { $match: { 'items.productId': { $in: ids }, status: { $ne: 'spam' } } },
          { $unwind: '$items' },
          { $match: { 'items.productId': { $in: ids } } },
          { $group: { _id: '$items.productId', n: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
  ]);
  const catName = new Map(categories.map((c) => [String(c._id), c.name]));
  const colName = new Map(collections.map((c) => [String(c._id), c.name]));
  const enquiries = new Map(counts.map((c) => [String(c._id), c.n]));

  const items = products.map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    code: p.code,
    badge: p.badge,
    status: p.status,
    order: p.order,
    category: catName.get(String(p.categoryId)) ?? null,
    collection: colName.get(String(p.collectionId)) ?? null,
    moq: p.wholesale.moq,
    packText: p.wholesale.packText,
    colours: p.colours.map((c) => ({ name: c.name, hex: c.hex })),
    sizeCount: p.sizes.length,
    cover: p.media[0] ? (media.get(String(p.media[0].mediaId)) ?? null) : null,
    enquiryCount: enquiries.get(String(p._id)) ?? 0,
    updatedAt: p.updatedAt,
  }));
  return { items, total };
}

export async function adminGet(id: string) {
  const doc = await Product.findById(id).lean();
  if (!doc) throw AppError.notFound('Product not found');
  const product = doc as unknown as ProductDoc;
  return toAdminProductDto(product, await mediaFor([product]));
}

export async function create(input: ProductInput, userId: string) {
  if (input.status === 'published') {
    // Publishing needs the completed checklist, which a brand-new product cannot have.
    throw AppError.unprocessable('Save the product as a draft first, then publish it once it is ready');
  }
  const data = await normalise(input);
  data.code = input.code;
  const doc = await Product.create({ ...data, updatedBy: userId });
  await afterChange(doc);
  return adminGet(String(doc._id));
}

export async function update(id: string, input: Input, userId: string) {
  const existing = await Product.findById(id);
  if (!existing) throw AppError.notFound('Product not found');
  const previousSlug = existing.slug;
  const data = await normalise(input, existing.toObject() as unknown as ProductDoc);
  existing.set({ ...data, updatedBy: userId });

  if (existing.status === 'published') await assertPublishable(existing.toObject() as unknown as ProductDoc);
  if (existing.status === 'published' && !existing.publishedAt) existing.publishedAt = new Date();
  await existing.save();
  await afterChange(existing, previousSlug);
  return adminGet(id);
}

async function assertPublishable(product: ProductDoc) {
  const dto = toAdminProductDto(product, await mediaFor([product]));
  const failing = dto.checks.filter((c) => !c.ok);
  if (failing.length) {
    throw AppError.unprocessable(
      'This product is not ready to publish',
      failing.map((c) => ({ path: `checks.${c.key}`, message: c.label })),
    );
  }
}

export async function setStatus(id: string, status: 'published' | 'draft' | 'archived') {
  const product = await Product.findById(id);
  if (!product) throw AppError.notFound('Product not found');
  if (status === 'published') {
    await assertPublishable(product.toObject() as unknown as ProductDoc);
    product.publishedAt ??= new Date();
  }
  product.status = status;
  await product.save();
  await afterChange(product);
  return adminGet(id);
}

export async function updateMediaOrder(id: string, media: NonNullable<Input['media']>) {
  const product = await Product.findById(id);
  if (!product) throw AppError.notFound('Product not found');
  const data = await normalise({ media }, product.toObject() as unknown as ProductDoc);
  product.set({ media: data.media });
  if (product.status === 'published') await assertPublishable(product.toObject() as unknown as ProductDoc);
  await product.save();
  await afterChange(product);
  return adminGet(id);
}

export async function duplicate(id: string, userId: string) {
  const source = await Product.findById(id).lean();
  if (!source) throw AppError.notFound('Product not found');
  const { _id, createdAt, updatedAt, publishedAt, __v, ...rest } = source as unknown as Record<string, unknown> & { name: string; slug: string; code: string };
  void _id; void createdAt; void updatedAt; void publishedAt; void __v;
  const copy = await Product.create({
    ...rest,
    name: `${source.name} (copy)`,
    slug: await uniqueValue('slug', `${source.slug}-copy`),
    code: await uniqueValue('code', `${source.code}-COPY`),
    status: 'draft',
    featured: false,
    publishedAt: null,
    updatedBy: userId,
  });
  await afterChange(copy);
  return adminGet(String(copy._id));
}

export async function remove(id: string) {
  const product = await Product.findById(id);
  if (!product) throw AppError.notFound('Product not found');
  if (product.status === 'published') throw AppError.conflict('Unpublish this product before deleting it');
  await product.deleteOne();
  await Product.updateMany({ relatedIds: product._id }, { $pull: { relatedIds: product._id } });
  await afterChange(product);
}

/* ------------------------------------------------------------------ */
/* Public (cached; a fixed number of queries whatever the page size)    */
/* ------------------------------------------------------------------ */

export interface PublicListQuery {
  page: number;
  limit: number;
  category?: string | undefined;
  collection?: string | undefined;
  colour?: string | undefined;
  fabric?: string | undefined;
  q?: string | undefined;
  sort: 'order' | 'newest';
}

const csv = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

export function publicList(q: PublicListQuery) {
  // Normalise so equivalent queries share one cache entry (and arbitrary searches are not cached).
  const key = JSON.stringify({ ...q, colour: csv(q.colour).sort(), fabric: csv(q.fabric).sort(), q: q.q ?? '' });
  const load = async () => {
    const [categories, collections] = await Promise.all([taxonomyIndex('category'), taxonomyIndex('collection')]);
    const filter: Record<string, unknown> = { status: 'published' };

    if (q.category) {
      const c = categories.find((x) => x.slug === q.category && x.isActive);
      if (!c) return { items: [], total: 0 };
      filter.categoryId = new Types.ObjectId(c.id);
    }
    if (q.collection) {
      const c = collections.find((x) => x.slug === q.collection && x.isActive);
      if (!c) return { items: [], total: 0 };
      filter.collectionId = new Types.ObjectId(c.id);
    }
    const colours = csv(q.colour);
    if (colours.length) filter['colours.family'] = { $in: colours };
    const fabrics = csv(q.fabric);
    if (fabrics.length) filter['specs.fabricType'] = { $in: fabrics };
    if (q.q) {
      const re = new RegExp(escapeRegex(q.q), 'i');
      filter.$or = [{ name: re }, { code: re }];
    }

    const [docs, total] = await Promise.all([
      Product.find(filter)
        .select('name slug code badge summary wholesale.moq wholesale.packText newArrival featured colours media categoryId collectionId order createdAt')
        .sort(q.sort === 'newest' ? { createdAt: -1 } : { order: 1, _id: 1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    const products = docs as unknown as ProductDoc[];
    const media = await mediaFor(products);
    const catById = new Map(categories.map((c) => [c.id, c]));
    const colById = new Map(collections.map((c) => [c.id, c]));

    return {
      items: products.map((p) =>
        toCardDto(p, media, {
          ...(catById.get(String(p.categoryId)) ? { category: pick(catById.get(String(p.categoryId))!) } : {}),
          ...(colById.get(String(p.collectionId)) ? { collection: pick(colById.get(String(p.collectionId))!) } : {}),
        }),
      ),
      total,
    };
  };
  // Free-text searches are not cached: the keys would be unbounded.
  return q.q ? load() : cached(CACHE_TAGS.catalog, `list:${key}`, 300, load);
}

const pick = (t: { slug: string; name: string }) => ({ slug: t.slug, name: t.name });

/** Filter options with counts, from one aggregation over published products. */
export const publicFilters = () =>
  cached(CACHE_TAGS.catalog, 'filters', 300, async () => {
    const [facets, categories, collections] = await Promise.all([
      Product.aggregate<{
        families: { _id: string; n: number }[];
        fabrics: { _id: string; n: number }[];
        categories: { _id: Types.ObjectId; n: number }[];
        collections: { _id: Types.ObjectId; n: number }[];
      }>([
        { $match: { status: 'published' } },
        {
          $facet: {
            families: [
              { $project: { f: { $setUnion: ['$colours.family', []] } } },
              { $unwind: '$f' },
              { $group: { _id: '$f', n: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            fabrics: [
              { $match: { 'specs.fabricType': { $ne: '' } } },
              { $group: { _id: '$specs.fabricType', n: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            categories: [{ $group: { _id: '$categoryId', n: { $sum: 1 } } }],
            collections: [{ $group: { _id: '$collectionId', n: { $sum: 1 } } }],
          },
        },
      ]),
      taxonomyIndex('category'),
      taxonomyIndex('collection'),
    ]);
    const f = facets[0] ?? { families: [], fabrics: [], categories: [], collections: [] };
    const label = (list: typeof categories, rows: { _id: Types.ObjectId; n: number }[]) =>
      list
        .filter((t) => t.isActive)
        .map((t) => ({ slug: t.slug, name: t.name, count: rows.find((r) => String(r._id) === t.id)?.n ?? 0 }));
    return {
      categories: label(categories, f.categories),
      collections: label(collections, f.collections),
      colours: f.families.map((x) => ({ name: x._id, count: x.n })),
      fabrics: f.fabrics.map((x) => ({ name: x._id, count: x.n })),
    };
  });

/**
 * Public product page. Queries: product (1), related products (1), media (1);
 * settings and taxonomy come from the cache. The whole result is cached per slug.
 */
export const publicDetail = (slug: string) =>
  cached(CACHE_TAGS.catalog, `product:${slug}`, 3600, async () => {
    const doc = await Product.findOne({ slug, status: 'published' }).lean();
    if (!doc) throw AppError.notFound('Product not found');
    const p = doc as unknown as ProductDoc;

    const [related, settings, categories, collections] = await Promise.all([
      p.relatedIds.length
        ? Product.find({ _id: { $in: p.relatedIds }, status: 'published' }).lean()
        : Product.find({ status: 'published', categoryId: p.categoryId, _id: { $ne: p._id } })
            .sort({ order: 1 })
            .limit(4)
            .lean(),
      getSettings(),
      taxonomyIndex('category'),
      taxonomyIndex('collection'),
    ]);
    const relatedDocs = related as unknown as ProductDoc[];
    const media = await mediaFor([p, ...relatedDocs]);
    const cat = categories.find((c) => c.id === String(p.categoryId));
    const col = collections.find((c) => c.id === String(p.collectionId));
    const taxFor = (x: ProductDoc) => {
      const c = categories.find((t) => t.id === String(x.categoryId));
      const k = collections.find((t) => t.id === String(x.collectionId));
      return { ...(c ? { category: pick(c) } : {}), ...(k ? { collection: pick(k) } : {}) };
    };

    const defaults = settings.productDefaults;
    const ready = (mid: string) => media.get(mid)?.status === 'ready';
    return {
      id: String(p._id),
      slug: p.slug,
      code: p.code,
      name: p.name,
      badge: p.badge,
      summary: p.summary,
      descriptionHtml: p.descriptionHtml,
      category: cat ? pick(cat) : null,
      collection: col ? pick(col) : null,
      specs: p.specs,
      wholesale: {
        moq: p.wholesale.moq,
        packText: p.wholesale.packText,
        packSize: p.wholesale.packSize,
        priceMode: p.wholesale.priceMode,
        belowMoq: p.wholesale.belowMoq,
        tiers: p.wholesale.tiers,
        tiersFootnote: defaults.tiersFootnote,
        priceLine: defaults.priceLine,
      },
      colours: p.colours.map((c) => ({
        id: String(c._id),
        name: c.name,
        hex: c.hex,
        family: c.family,
        stock: c.stock,
        swatch: c.swatchMediaId && ready(String(c.swatchMediaId)) ? media.get(String(c.swatchMediaId)) : null,
      })),
      sizes: p.sizes,
      sizeGuide: p.sizeGuide.filter((r) => r.chest || r.length || r.uk),
      // The order set in the dashboard, exactly as stored.
      media: p.media
        .filter((m) => ready(String(m.mediaId)))
        .map((m) => ({ colourId: m.colourId ? String(m.colourId) : null, alt: m.alt || p.name, media: media.get(String(m.mediaId))! })),
      info: {
        dispatch: p.overrides.dispatch || defaults.dispatch,
        samples: p.overrides.samples || defaults.samples,
        shipText: p.overrides.shipText || defaults.shipText,
      },
      related: relatedDocs.map((r) => toCardDto(r, media, taxFor(r))),
      seo: {
        title: p.seo.title || `${p.name} | Premium Moroccan Wholesale | ${settings.business.name}`,
        description: p.seo.description || p.summary,
        canonicalPath: `/products/${p.slug}`,
        // The cover is used for link previews on WhatsApp, Instagram and Facebook.
        image: p.media.find((m) => media.get(String(m.mediaId))?.type === 'image') ? (media.get(String(p.media.find((m) => media.get(String(m.mediaId))?.type === 'image')!.mediaId))?.url ?? null) : null,
      },
      updatedAt: p.updatedAt,
    };
  });

/** Slugs and last-modified times for the sitemap. */
export const sitemapProducts = () =>
  cached(CACHE_TAGS.catalog, 'sitemap', 3600, async () => {
    const rows = await Product.find({ status: 'published' }).select('slug updatedAt').lean();
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt }));
  });
