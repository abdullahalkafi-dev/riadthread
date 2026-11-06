import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { countQueries, setup, teardown, TAG, uploadImage, type Session } from '../../test/helpers';
import { Media } from '../media/media.model';
import { deleteMedia } from '../media/media.service';
import { Outbox } from '../notification/outbox.model';
import { Product } from '../product/product.model';
import { Category, Collection } from '../taxonomy/taxonomy.model';
import { TrackingEvent } from '../tracking/event.model';
import { Enquiry } from './enquiry.model';

let admin: Session;
let app: Awaited<ReturnType<typeof setup>>['app'];
const mediaIds: string[] = [];
const productIds: string[] = [];
let product: { id: string; slug: string; name: string; colour: string };
let keyCounter = 0;

const key = () => `${TAG}-submission-${++keyCounter}-${Math.random().toString(36).slice(2, 8)}`;

const contact = (over: Record<string, unknown> = {}) => ({
  name: 'Aisha Rahman',
  business: 'Al-Noor Boutique',
  email: 'aisha@example.com',
  phone: '+44 7700 900142',
  type: 'Boutique',
  ...over,
});

const body = (over: Record<string, unknown> = {}) => ({
  submissionKey: key(),
  entryPoint: 'product_page',
  contact: contact(),
  items: [{ productId: product.id, colour: product.colour, sizes: [{ label: 'M', qty: 12 }, { label: 'L', qty: 12 }] }],
  ...over,
});

const submit = async (payload: unknown) => {
  const res = await request(app).post('/api/v1/enquiries').send(payload as object);
  // Surface unexpected server errors with their message instead of a vague assertion.
  if (res.status >= 500) throw new Error(`Server error: ${res.body.message} ${String(res.body.stack).slice(0, 400)}`);
  return res;
};

/** Waits until no e-mail is pending or being sent, so background work does not skew query counts. */
async function settleEmails() {
  for (let i = 0; i < 60; i++) {
    if ((await Outbox.countDocuments({ status: { $in: ['pending', 'sending'] } })) === 0) return;
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function waitForEmails(ref: string) {
  for (let i = 0; i < 40; i++) {
    const e = await Enquiry.findOne({ ref }).lean();
    if (e?.email?.confirmation === 'sent' && e?.email?.notification === 'sent') return e;
    await new Promise((r) => setTimeout(r, 250));
  }
  return Enquiry.findOne({ ref }).lean();
}

beforeAll(async () => {
  ({ app, admin } = await setup());
  const cat = (await admin.post('/api/v1/admin/categories').send({ name: `${TAG} Cat` })).body.data;
  const col = (await admin.post('/api/v1/admin/collections').send({ name: `${TAG} Col` })).body.data;
  const img = await uploadImage(admin);
  mediaIds.push(img.id);
  const colourId = new mongoose.Types.ObjectId().toString();
  const created = await admin.post('/api/v1/admin/products').send({
    name: `${TAG} Enquiry Djellaba`,
    code: `${TAG}-ENQ`.toUpperCase(),
    categoryId: cat.id,
    collectionId: col.id,
    wholesale: { moq: 12, packText: 'Pack of 6', packSize: 6 },
    colours: [{ _id: colourId, name: 'Emerald', hex: '#0f4a36', family: 'Green', swatchMediaId: img.id }],
    sizes: [{ label: 'M', available: true }, { label: 'L', available: true }, { label: 'XL', available: false }],
    media: [{ mediaId: img.id, colourId: null, alt: 'Front' }],
  });
  expect(created.status, JSON.stringify(created.body)).toBe(201);
  productIds.push(created.body.data.id);
  const pub = await admin.post(`/api/v1/admin/products/${created.body.data.id}/publish`);
  expect(pub.status, JSON.stringify(pub.body)).toBe(200);
  product = { id: created.body.data.id, slug: created.body.data.slug, name: created.body.data.name, colour: 'Emerald' };
});

afterAll(async () => {
  const keys = new RegExp(`^${TAG}-submission`);
  const enquiries = await Enquiry.find({ submissionKey: keys }).select('_id').lean();
  await Outbox.deleteMany({ enquiryId: { $in: enquiries.map((e) => e._id) } });
  await Enquiry.deleteMany({ submissionKey: keys });
  await TrackingEvent.deleteMany({ visitorId: new RegExp(`^${TAG}`) });
  await Product.deleteMany({ _id: { $in: productIds } });
  for (const id of mediaIds) await deleteMedia(id).catch(() => undefined);
  await Media.deleteMany({ _id: { $in: mediaIds } });
  await Category.deleteMany({ name: new RegExp(`^${TAG}`) });
  await Collection.deleteMany({ name: new RegExp(`^${TAG}`) });
  await teardown();
});

describe('submitting an enquiry', () => {
  it('saves a frozen snapshot, builds a reference and sends both e-mails', async () => {
    const res = await submit(body({ message: 'Please send trade prices' }));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const ref = res.body.data.ref as string;
    expect(ref).toMatch(/^RT-\d{4}-\d{4}$/);

    const saved = await waitForEmails(ref);
    expect(saved?.items[0]?.name).toBe(product.name);
    expect(saved?.qtyTotal).toBe(24);
    expect(saved?.itemCount).toBe(1);
    expect(saved?.email?.confirmation).toBe('sent');
    expect(saved?.email?.notification).toBe('sent');
  });

  it('never trusts product data sent by the browser', async () => {
    const unknownColour = await submit(body({ items: [{ productId: product.id, colour: 'Chartreuse', sizes: [{ label: 'M', qty: 12 }] }] }));
    expect(unknownColour.status).toBe(422);

    const unavailableSize = await submit(body({ items: [{ productId: product.id, colour: 'Emerald', sizes: [{ label: 'XL', qty: 12 }] }] }));
    expect(unavailableSize.status).toBe(422);

    const unknownProduct = await submit(body({ items: [{ productId: new mongoose.Types.ObjectId().toString(), sizes: [] }] }));
    expect(unknownProduct.status).toBe(422);
  });

  it('turns a retry into the same enquiry, not a second one', async () => {
    const payload = body();
    const first = await submit(payload);
    const retry = await submit(payload);
    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.data.ref).toBe(first.body.data.ref);
    expect(await Enquiry.countDocuments({ submissionKey: payload.submissionKey })).toBe(1);

    const different = await submit({ ...payload, message: 'Something else entirely' });
    expect(different.status).toBe(409);
  });

  it('creates exactly one enquiry when two identical requests arrive together', async () => {
    const payload = body();
    const [a, b] = await Promise.all([submit(payload), submit(payload)]);
    expect([a.status, b.status].every((s) => s === 200 || s === 201)).toBe(true);
    expect(a.body.data.ref).toBe(b.body.data.ref);
    expect(await Enquiry.countDocuments({ submissionKey: payload.submissionKey })).toBe(1);
  });

  it('requires a message for a general enquiry and rejects a filled honeypot', async () => {
    const empty = await submit(body({ items: [], message: '' }));
    expect(empty.status).toBe(400);
    const general = await submit(body({ items: [], message: 'Do you supply to Scotland?' }));
    expect(general.status).toBe(201);
    const bot = await submit(body({ website_url: 'http://spam.example' }));
    expect(bot.status).toBe(400);
  });

  it('keeps editing a product from changing an old enquiry', async () => {
    const res = await submit(body());
    await admin.patch(`/api/v1/admin/products/${product.id}`).send({ name: `${product.name} (renamed)` });
    const enquiry = await Enquiry.findOne({ ref: res.body.data.ref }).lean();
    const detail = await admin.get(`/api/v1/admin/enquiries/${enquiry!._id}`);
    expect(detail.body.data.items[0].name).toBe(product.name);
    await admin.patch(`/api/v1/admin/products/${product.id}`).send({ name: product.name });
  });
});

describe('tracking consent', () => {
  it('stores no journey and no ids without consent', async () => {
    const res = await submit(
      body({ tracking: { consent: false, visitorId: `${TAG}-visitor-aaaaaaaa`, journey: [{ t: 'Home' }] } }),
    );
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const e = await Enquiry.findOne({ ref: res.body.data.ref }).lean();
    expect(e?.visitorId).toBeUndefined();
    expect(e?.journey).toBeUndefined();
    expect(e?.consent?.analytics).toBe(false);
    expect(e?.source?.channel).toBe('Not tracked');
  });

  it('stores the journey and a friendly source with consent', async () => {
    const res = await submit(
      body({
        tracking: {
          consent: true,
          visitorId: `${TAG}-visitor-bbbbbbbb`,
          sessionId: `${TAG}-session-bbbbbbbb`,
          journey: [{ t: 'Landed from Instagram', m: 'utm_campaign=ramadan27', k: 'start' }, { t: product.name, m: '2m 10s, watched video' }],
          attribution: { source: 'instagram', campaign: 'ramadan27' },
        },
      }),
    );
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const e = await Enquiry.findOne({ ref: res.body.data.ref }).lean();
    expect(e?.journey).toHaveLength(2);
    expect(e?.source?.channel).toBe('Instagram');

    const detail = await admin.get(`/api/v1/admin/enquiries/${e!._id}`);
    expect(detail.body.data.journey).toHaveLength(2);
    expect(detail.body.data.score.factors.join()).toMatch(/watched a product video/i);
  });

  it('accepts event batches, ignores duplicates and rejects batches without consent', async () => {
    const batch = {
      consent: true,
      visitorId: `${TAG}-visitor-cccccccc`,
      sessionId: `${TAG}-session-cccccccc`,
      events: [
        { eventId: `${TAG}-evt-0000001`, type: 'page_view', path: '/products?utm_source=x', at: Date.now() },
        { eventId: `${TAG}-evt-0000002`, type: 'product_view', path: `/products/${product.slug}`, productId: product.id, at: Date.now() },
      ],
    };
    const first = await request(app).post('/api/v1/tracking/events').send(batch);
    expect(first.status).toBe(202);
    expect(first.body.data.accepted).toBe(2);

    const retry = await request(app).post('/api/v1/tracking/events').send(batch);
    expect(retry.body.data.accepted).toBe(0);
    expect(await TrackingEvent.countDocuments({ visitorId: batch.visitorId })).toBe(2);
    // The query string was removed before storing.
    expect((await TrackingEvent.findOne({ eventId: `${TAG}-evt-0000001` }).lean())?.path).toBe('/products');

    const noConsent = await request(app).post('/api/v1/tracking/events').send({ ...batch, consent: false });
    expect(noConsent.status).toBe(400);

    // sendBeacon style: text/plain
    const beacon = await request(app)
      .post('/api/v1/tracking/events')
      .set('content-type', 'text/plain')
      .send(JSON.stringify({ ...batch, events: [{ eventId: `${TAG}-evt-0000003`, type: 'page_view', path: '/', at: Date.now() }] }));
    expect(beacon.status).toBe(202);
  });
});

describe('the lead pipeline', () => {
  it('lists enquiries with one set of queries however many rows there are', async () => {
    const refs: string[] = [];
    for (let i = 0; i < 3; i++) refs.push((await submit(body())).body.data.ref);
    // Let the background e-mail jobs finish, so they are not counted as part of the list request.
    for (const ref of refs) await waitForEmails(ref);
    const small = await countQueries(() => admin.get('/api/v1/admin/enquiries?limit=1'));
    const large = await countQueries(() => admin.get('/api/v1/admin/enquiries?limit=50'));
    expect(large.queries).toBe(small.queries);
    expect(large.queries).toBeLessThanOrEqual(3);
    expect(large.result.body.data[0]).toHaveProperty('thumbs');
    expect(large.result.body.meta.statusCounts.new).toBeGreaterThan(0);
  });

  it('moves a lead through the pipeline, records notes and follow-ups, and marks it confirmed', async () => {
    const ref = (await submit(body())).body.data.ref as string;
    const id = String((await Enquiry.findOne({ ref }).lean())!._id);

    expect((await admin.patch(`/api/v1/admin/enquiries/${id}/status`).send({ status: 'contacted' })).body.data.status).toBe('contacted');
    const note = await admin.post(`/api/v1/admin/enquiries/${id}/notes`).send({ text: 'Called, left voicemail' });
    expect(note.body.data.notes[0].text).toBe('Called, left voicemail');
    const follow = await admin.patch(`/api/v1/admin/enquiries/${id}/follow-up`).send({ followUpAt: '2026-12-01' });
    expect(follow.body.data.followUpAt).toMatch(/^2026-12-01/);
    const done = await admin.patch(`/api/v1/admin/enquiries/${id}/status`).send({ status: 'confirmed' });
    expect(done.body.data.status).toBe('confirmed');
    expect(done.body.data.activity.map((a: { text: string }) => a.text)).toEqual(
      expect.arrayContaining(['Status changed to Contacted', 'Note added', 'Status changed to Confirmed']),
    );
  });

  it('hides spam from lists and filters by status and score', async () => {
    const ref = (await submit(body())).body.data.ref as string;
    const id = String((await Enquiry.findOne({ ref }).lean())!._id);
    await admin.patch(`/api/v1/admin/enquiries/${id}/status`).send({ status: 'spam' });
    const list = await admin.get('/api/v1/admin/enquiries?limit=100');
    expect(list.body.data.some((e: { ref: string }) => e.ref === ref)).toBe(false);
    const spam = await admin.get('/api/v1/admin/enquiries?status=spam&limit=100');
    expect(spam.body.data.some((e: { ref: string }) => e.ref === ref)).toBe(true);
  });

  it('exports CSV that a spreadsheet cannot execute', async () => {
    await submit(body({ contact: contact({ business: '=HYPERLINK("http://evil.example","click")' }) }));
    const res = await admin.get('/api/v1/admin/enquiries/export.csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain(`"'=HYPERLINK`);
    expect(res.text).not.toMatch(/,"=HYPERLINK/);
  });

  it('serves the overview in a fixed number of queries', async () => {
    await settleEmails();
    const res = await countQueries(() => admin.get('/api/v1/admin/analytics/overview'));
    expect(res.result.status).toBe(200);
    expect(res.result.body.data.series).toHaveLength(14);
    expect(res.result.body.data.newCount).toBeGreaterThan(0);
    expect(res.queries).toBeLessThanOrEqual(8);
  });

  it('keeps the pipeline private', async () => {
    expect((await request(app).get('/api/v1/admin/enquiries')).status).toBe(401);
    expect((await request(app).get('/api/v1/admin/analytics/overview')).status).toBe(401);
  });
});
