import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { countQueries, setup, teardown, TAG, uploadImage, type Session } from '../../test/helpers';
import { Category, Collection } from '../taxonomy/taxonomy.model';
import { Media } from '../media/media.model';
import { deleteMedia } from '../media/media.service';
import { Product } from './product.model';

let admin: Session;
let app: Awaited<ReturnType<typeof setup>>['app'];
let categoryId = '';
let collectionId = '';
const mediaIds: string[] = [];
const productIds: string[] = [];

async function makeProduct(n: number, extra: Record<string, unknown> = {}) {
  const img1 = await uploadImage(admin, '#1f4a36');
  const img2 = await uploadImage(admin, '#1f3a8a');
  mediaIds.push(img1.id, img2.id);
  const colourId = new mongoose.Types.ObjectId().toString();
  const res = await admin.post('/api/v1/admin/products').send({
    name: `${TAG} Djellaba ${n}`,
    code: `${TAG}-${n}`.toUpperCase(),
    categoryId,
    collectionId,
    order: n,
    summary: 'Integration test product',
    specs: { fabric: 'Silk chiffon', origin: 'Fez, Morocco' },
    wholesale: { moq: 12, packText: 'Pack of 6', packSize: 6, tiers: [{ range: '12+', label: 'Trade price' }] },
    colours: [{ _id: colourId, name: 'Emerald', hex: '#0f4a36', family: 'Green', swatchMediaId: img1.id }],
    sizes: [{ label: 'M', available: true }, { label: 'L', available: true }],
    media: [
      { mediaId: img1.id, colourId, alt: 'Front view' },
      { mediaId: img2.id, colourId: null, alt: 'Detail' },
    ],
    ...extra,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  productIds.push(res.body.data.id);
  return res.body.data;
}

beforeAll(async () => {
  ({ app, admin } = await setup());
  const cat = await admin.post('/api/v1/admin/categories').send({ name: `${TAG} Djellabas` });
  const col = await admin.post('/api/v1/admin/collections').send({ name: `${TAG} Ramadan` });
  expect(cat.status, JSON.stringify(cat.body)).toBe(201);
  categoryId = cat.body.data.id;
  collectionId = col.body.data.id;
});

afterAll(async () => {
  await Product.deleteMany({ _id: { $in: productIds } });
  // Remove files from storage too, not just the database records.
  for (const id of mediaIds) await deleteMedia(id).catch(() => undefined);
  await Media.deleteMany({ _id: { $in: mediaIds } });
  await Category.deleteMany({ name: new RegExp(`^${TAG}`) });
  await Collection.deleteMany({ name: new RegExp(`^${TAG}`) });
  await teardown();
});

describe('product workflow', () => {
  it('rejects uploads that are not real images and images that are too small', async () => {
    const fake = await admin.post('/api/v1/admin/media').attach('file', Buffer.from('not an image'), 'evil.jpg');
    expect(fake.status).toBe(422);

    const sharp = (await import('sharp')).default;
    const tiny = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#fff' } }).jpeg().toBuffer();
    const small = await admin.post('/api/v1/admin/media').attach('file', tiny, 'tiny.jpg');
    expect(small.status).toBe(422);
    expect(small.body.message).toMatch(/too small/i);
  });

  it('keeps a draft out of the public catalogue and blocks publishing when not ready', async () => {
    const product = await makeProduct(1);
    expect(product.status).toBe('draft');
    expect(product.ready).toBe(true);

    const hidden = await request(app).get(`/api/v1/products/${product.slug}`);
    expect(hidden.status).toBe(404);

    // A product without media cannot be published.
    const bare = await admin.post('/api/v1/admin/products').send({
      name: `${TAG} Bare`, code: `${TAG}-BARE`.toUpperCase(), categoryId, collectionId,
    });
    productIds.push(bare.body.data.id);
    const blocked = await admin.post(`/api/v1/admin/products/${bare.body.data.id}/publish`);
    expect(blocked.status).toBe(422);
    expect(blocked.body.errorSources.length).toBeGreaterThan(0);
  });

  it('publishes a ready product and serves it with defaults, ordered media and related cards', async () => {
    const product = await makeProduct(2);
    const published = await admin.post(`/api/v1/admin/products/${product.id}/publish`);
    expect(published.status, JSON.stringify(published.body)).toBe(200);

    const detail = await request(app).get(`/api/v1/products/${product.slug}`);
    expect(detail.status).toBe(200);
    const d = detail.body.data;
    expect(d.media.map((m: { alt: string }) => m.alt)).toEqual(['Front view', 'Detail']);
    expect(d.info.dispatch).toBeTruthy(); // site default applied
    expect(d.specs.fabricType).toBe('Chiffon'); // derived for the Fabric filter
    expect(d.seo.image).toMatch(/^\/media\/images\//);
    expect(d.colours[0].swatch.url).toMatch(/^\/media\/images\//);
  });

  it('saves a new media order exactly as sent', async () => {
    const product = await makeProduct(3);
    const media = [...product.media].reverse().map((m: { mediaId: string; colourId: string | null; alt: string }) => ({
      mediaId: m.mediaId, colourId: m.colourId, alt: m.alt,
    }));
    const res = await admin.patch(`/api/v1/admin/products/${product.id}/media/order`).send({ media });
    expect(res.status).toBe(200);
    expect(res.body.data.media.map((m: { alt: string }) => m.alt)).toEqual(['Detail', 'Front view']);
  });

  it('keeps the page address when a product is renamed, and changes it only when the slug is edited', async () => {
    const product = await makeProduct(7);
    const renamed = await admin.patch(`/api/v1/admin/products/${product.id}`).send({ name: `${TAG} Renamed Djellaba` });
    expect(renamed.status, JSON.stringify(renamed.body)).toBe(200);
    expect(renamed.body.data.name).toBe(`${TAG} Renamed Djellaba`);
    expect(renamed.body.data.slug).toBe(product.slug);

    const moved = await admin.patch(`/api/v1/admin/products/${product.id}`).send({ slug: `${TAG.toLowerCase()}-new-address` });
    expect(moved.body.data.slug).toBe(`${TAG.toLowerCase()}-new-address`);
  });

  it('does not run extra queries per product on the public list (no N+1)', async () => {
    for (const n of [4, 5, 6]) {
      const p = await makeProduct(n);
      await admin.post(`/api/v1/admin/products/${p.id}/publish`);
    }
    const url = (limit: number) => `/api/v1/products?category=${TAG.toLowerCase()}-djellabas&limit=${limit}`;

    const one = await countQueries(() => request(app).get(url(1)));
    const many = await countQueries(() => request(app).get(url(6)));

    expect(one.result.body.data).toHaveLength(1);
    expect(many.result.body.data.length).toBeGreaterThanOrEqual(4);
    // Same number of database operations for 1 product and for many.
    expect(many.queries).toBe(one.queries);
    expect(many.queries).toBeLessThanOrEqual(5);
  });

  it('does not run extra queries per row on the admin product list', async () => {
    const small = await countQueries(() => admin.get('/api/v1/admin/products?limit=1'));
    const large = await countQueries(() => admin.get('/api/v1/admin/products?limit=50'));
    // One media query is skipped when the page has no cover photos, so allow a difference of one.
    // What must never happen is growth with the number of rows.
    expect(large.queries).toBeLessThanOrEqual(6);
    expect(large.queries - small.queries).toBeLessThanOrEqual(1);
  });

  it('filters by colour family and fabric, and reports filter counts', async () => {
    const byColour = await request(app).get(`/api/v1/products?category=${TAG.toLowerCase()}-djellabas&colour=Green`);
    expect(byColour.body.data.length).toBeGreaterThan(0);
    const none = await request(app).get(`/api/v1/products?category=${TAG.toLowerCase()}-djellabas&colour=Pink`);
    expect(none.body.data).toHaveLength(0);

    const filters = await request(app).get('/api/v1/products/filters');
    expect(filters.body.data.colours.some((c: { name: string }) => c.name === 'Green')).toBe(true);
    expect(filters.body.data.fabrics.some((f: { name: string }) => f.name === 'Chiffon')).toBe(true);
  });

  it('refuses to delete a category that still has products', async () => {
    const res = await admin.del(`/api/v1/admin/categories/${categoryId}`);
    expect(res.status).toBe(409);
  });

  it('refuses to delete media that a product uses', async () => {
    const res = await admin.del(`/api/v1/admin/media/${mediaIds[0]}`);
    expect(res.status).toBe(409);
  });

  it('rejects admin calls without a session or without the CSRF header', async () => {
    expect((await request(app).get('/api/v1/admin/products')).status).toBe(401);
    expect((await admin.agent.post('/api/v1/admin/products').send({})).status).toBe(403);
  });
});
