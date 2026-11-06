import { Types, type Model } from 'mongoose';
import type { TaxonomyInput } from '@riad/shared';
import { cached, CACHE_TAGS, invalidate } from '../../lib/cache';
import { revalidateWeb } from '../../lib/revalidate';
import { AppError } from '../../utils/AppError';
import { slugify } from '../../utils/text';
import { toMediaDto, type MediaDto } from '../media/media.dto';
import { loadMedia } from '../media/media.service';
import { Product } from '../product/product.model';
import { Category, Collection, type TaxonomyDoc, type TaxonomyKind } from './taxonomy.model';

interface Config {
  model: Model<TaxonomyDoc>;
  /** Field on the product that points here. */
  field: 'categoryId' | 'collectionId';
  label: string;
}

const CONFIG: Record<TaxonomyKind, Config> = {
  category: { model: Category, field: 'categoryId', label: 'category' },
  collection: { model: Collection, field: 'collectionId', label: 'collection' },
};

export interface TaxonomyDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
  image: MediaDto | null;
  productCount: number;
  publishedCount: number;
}

/** Product totals per category/collection in ONE grouped query (no count per row). */
async function countsFor(field: Config['field']) {
  const rows = await Product.aggregate<{ _id: Types.ObjectId; total: number; published: number }>([
    {
      $group: {
        _id: `$${field}`,
        total: { $sum: 1 },
        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

async function toDtos(kind: TaxonomyKind, docs: TaxonomyDoc[]): Promise<TaxonomyDto[]> {
  const cfg = CONFIG[kind];
  const [counts, media] = await Promise.all([
    countsFor(cfg.field),
    loadMedia(docs.map((d) => (d.imageMediaId ? String(d.imageMediaId) : null))),
  ]);
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    description: d.description,
    order: d.order,
    isActive: d.isActive,
    showOnHome: d.showOnHome,
    image: d.imageMediaId ? (media.get(String(d.imageMediaId)) ?? null) : null,
    productCount: counts.get(String(d._id))?.total ?? 0,
    publishedCount: counts.get(String(d._id))?.published ?? 0,
  }));
}

/** Admin list: three queries in total however many rows there are. */
export async function adminList(kind: TaxonomyKind) {
  const docs = await CONFIG[kind].model.find().sort({ order: 1, name: 1 }).lean();
  return toDtos(kind, docs as unknown as TaxonomyDoc[]);
}

/** Public list: active entries only, cached with the catalogue. */
export const publicList = (kind: TaxonomyKind) =>
  cached(CACHE_TAGS.catalog, `taxonomy:${kind}`, 3600, async () => {
    const docs = await CONFIG[kind].model.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    const dtos = await toDtos(kind, docs as unknown as TaxonomyDoc[]);
    // Visitors only need published counts.
    return dtos.map(({ productCount: _total, ...rest }) => rest);
  });

async function uniqueSlug(model: Model<TaxonomyDoc>, base: string, excludeId?: string) {
  const root = slugify(base) || 'item';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
  }
  throw AppError.conflict('Could not create a unique address for this name');
}

async function assertImage(id: string | null | undefined) {
  if (!id) return;
  const media = await loadMedia([id]);
  const m = media.get(id);
  if (!m || m.type !== 'image') throw AppError.badRequest('Choose an uploaded image');
}

async function afterChange() {
  await invalidate(CACHE_TAGS.catalog, CACHE_TAGS.site);
  void revalidateWeb(['catalog', 'site']);
}

export async function create(kind: TaxonomyKind, input: TaxonomyInput) {
  const cfg = CONFIG[kind];
  await assertImage(input.imageMediaId);
  const slug = input.slug ? await uniqueSlug(cfg.model, input.slug) : await uniqueSlug(cfg.model, input.name);
  const doc = await cfg.model.create({ ...input, slug });
  await afterChange();
  return (await toDtos(kind, [doc.toObject() as TaxonomyDoc]))[0]!;
}

export async function update(kind: TaxonomyKind, id: string, input: Partial<TaxonomyInput>) {
  const cfg = CONFIG[kind];
  const doc = await cfg.model.findById(id);
  if (!doc) throw AppError.notFound(`${cfg.label[0]!.toUpperCase()}${cfg.label.slice(1)} not found`);
  if (input.imageMediaId !== undefined) await assertImage(input.imageMediaId);
  if (input.slug && input.slug !== doc.slug) input.slug = await uniqueSlug(cfg.model, input.slug, id);
  doc.set(input);
  await doc.save();
  await afterChange();
  return (await toDtos(kind, [doc.toObject() as TaxonomyDoc]))[0]!;
}

export async function remove(kind: TaxonomyKind, id: string) {
  const cfg = CONFIG[kind];
  if (await Product.exists({ [cfg.field]: id })) {
    throw AppError.conflict(`Move this ${cfg.label}'s products to another ${cfg.label} first`);
  }
  const res = await cfg.model.deleteOne({ _id: id });
  if (!res.deletedCount) throw AppError.notFound(`${cfg.label[0]!.toUpperCase()}${cfg.label.slice(1)} not found`);
  await afterChange();
}

/** Slug → id and id → entry maps for filtering and for product pages. Cached with the catalogue. */
export const taxonomyIndex = (kind: TaxonomyKind) =>
  cached(CACHE_TAGS.catalog, `taxonomy-index:${kind}`, 3600, async () => {
    const docs = (await CONFIG[kind].model.find().lean()) as unknown as TaxonomyDoc[];
    return docs.map((d) => ({ id: String(d._id), slug: d.slug, name: d.name, isActive: d.isActive }));
  });

export { toMediaDto };
