/**
 * pnpm seed:demo
 *
 * Loads a demo catalogue (categories, collections and nine products with
 * colours, sizes, tiers and ordered media) so the website and dashboard can be
 * built against real data. It reads the placeholder images from the local
 * design folder (DEMO_ASSETS_DIR, default ../../designs/assets), which is not
 * part of the repository, and skips itself if that folder is missing.
 *
 * Safe to run twice: anything that already exists (by product code or
 * category slug) is left alone. Never run it against the production database.
 */

// Run uploads inline so this script does not depend on a worker being up.
process.env.REDIS_QUEUE_URL = '';

import { copyFile, mkdtemp, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { Types } from 'mongoose';

const ASSETS = resolve(process.cwd(), process.env.DEMO_ASSETS_DIR ?? '../../designs/assets');

type Colour = { name: string; hex: string; family: string; img: string; stock?: string; sku?: string };
interface Demo {
  name: string;
  code: string;
  cat: string;
  col: string;
  badge?: string;
  newArrival?: boolean;
  featured?: boolean;
  order: number;
  fabric: string;
  fabricType: string;
  origin: string;
  moq: number;
  pack: string;
  packSize: number;
  summary: string;
  colours: Colour[];
  sizes: string[];
  tiers: Array<[string, string]>;
  /** [file, alt text, colour name or null] in display order. */
  media: Array<[string, string, string | null]>;
  draft?: boolean;
}

const TIERS: Array<[string, string]> = [['12 – 47 units', 'Trade price'], ['48+ units', '− 10%']];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const CATEGORIES = [
  ['Djellabas', 'Hooded and chiffon djellabas, hand-finished in Morocco.', true],
  ['Gandoras', 'Satin and crepe gandoras with sfifa embroidery.', true],
  ['Jabadors', 'Light jabadors for summer and travel.', true],
  ['Prayer essentials', 'Rehals, prayer mats and gift sets.', true],
  ['Accessories', 'Babouches and finishing pieces.', false],
] as const;
const COLLECTIONS = [
  ['Ramadan & Eid', 'Our Ramadan and Eid range for retailers.', true],
  ['Everyday', 'Year-round staples.', true],
] as const;

const PRODUCTS: Demo[] = [
  { name: 'Fez Chiffon Djellaba', code: 'RT-DJ-104', cat: 'Djellabas', col: 'Ramadan & Eid', badge: 'New arrival', newArrival: true, featured: true, order: 1, fabric: 'Silk chiffon', fabricType: 'Chiffon', origin: 'Fez, Morocco', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6,
    summary: 'Hand-finished sfifa and aakad buttons along a sheer chiffon body. Lined, light, made for evening prayers, Eid and special occasions.',
    colours: [{ name: 'Emerald', hex: '#0f4a36', family: 'Green', img: 'emerald-djellaba.png' }, { name: 'Majorelle', hex: '#1f3a8a', family: 'Blue', img: 'navy-detail.png', stock: 'Low stock' }, { name: 'Stone', hex: '#cdc6ba', family: 'Neutral', img: 'stone-djellaba.jpg' }],
    sizes: SIZES, tiers: [['12 – 47 units', 'Trade price'], ['48 – 119 units', '− 8%'], ['120+ units', '− 15%']],
    media: [['emerald-djellaba.png', 'Emerald chiffon djellaba, front', 'Emerald'], ['navy-detail.png', 'Hand-stitched sfifa trim, close up', null], ['riad-courtyard.jpg', 'Shot on location in a Fez riad', null], ['navy-detail.png', 'Majorelle chiffon djellaba, front', 'Majorelle'], ['stone-djellaba.jpg', 'Stone chiffon djellaba, front', 'Stone']] },
  { name: 'Atlas Hooded Djellaba', code: 'RT-DJ-088', cat: 'Djellabas', col: 'Everyday', badge: 'Bestseller', order: 2, fabric: 'Brushed cotton', fabricType: 'Cotton', origin: 'Marrakech, Morocco', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6,
    summary: 'A soft, structured everyday djellaba with a full hood and tonal hand braid.',
    colours: [{ name: 'Stone', hex: '#cdc6ba', family: 'Neutral', img: 'stone-djellaba.jpg' }, { name: 'Ivory', hex: '#efe8dc', family: 'Neutral', img: 'stone-djellaba.jpg', stock: 'Pre-order' }],
    sizes: SIZES, tiers: TIERS,
    media: [['stone-djellaba.jpg', 'Stone hooded djellaba, front', null], ['ph/djellaba-akhmas.jpg', 'Hood and braid detail', null], ['ph/djellaba-daily.jpg', 'Worn on a daily walk', null], ['riad-courtyard.jpg', 'Worn in a riad courtyard', null]] },
  { name: 'Majorelle Djellaba', code: 'RT-DJ-121', cat: 'Djellabas', col: 'Ramadan & Eid', badge: 'Low stock', order: 6, fabric: 'Cotton blend', fabricType: 'Cotton', origin: 'Marrakech, Morocco', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6,
    summary: 'Deep Majorelle blue with a dense hand-braided placket and knotted buttons.',
    colours: [{ name: 'Majorelle', hex: '#1f3a8a', family: 'Blue', img: 'navy-detail.png', stock: 'Low stock' }],
    sizes: SIZES, tiers: TIERS,
    media: [['navy-detail.png', 'Majorelle djellaba, front', null], ['ph/chaouen-doors.jpg', 'Against blue Chaouen doors', null]] },
  { name: 'Sfifa Gandora', code: 'RT-GA-210', cat: 'Gandoras', col: 'Ramadan & Eid', badge: 'New', newArrival: true, order: 3, fabric: 'Satin', fabricType: 'Satin', origin: 'Fez, Morocco', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6,
    summary: 'Short-sleeve gandora with a deep sfifa neckline in gold or tonal blush thread.',
    colours: [{ name: 'Ivory & Gold', hex: '#efe4cc', family: 'Neutral', img: 'gandora-pair.png' }, { name: 'Blush', hex: '#d8b4a6', family: 'Pink', img: 'gandora-pair.png' }],
    sizes: SIZES, tiers: TIERS,
    media: [['gandora-pair.png', 'Sfifa gandora in ivory and gold, pair', null], ['ph/embroidery-fez.jpg', 'Sfifa embroidery being finished in Fez', null], ['ph/zellige.jpg', 'Zellige tile pattern that inspired the neckline', null]] },
  { name: 'Royal Plum Gandora', code: 'RT-GA-117', cat: 'Gandoras', col: 'Ramadan & Eid', order: 4, fabric: 'Satin', fabricType: 'Satin', origin: 'Casablanca, Morocco', moq: 12, pack: 'Pack of 6 · M–XXL', packSize: 6,
    summary: 'Rich plum satin with tone-on-tone embroidery at the neck and sleeves.',
    colours: [{ name: 'Plum', hex: '#4b1f4f', family: 'Purple', img: 'plum-gandora.png' }],
    sizes: ['M', 'L', 'XL', 'XXL'], tiers: TIERS,
    media: [['plum-gandora.png', 'Royal plum gandora, front', null], ['ph/embroidery-fez.jpg', 'Tone-on-tone embroidery', null]] },
  { name: 'Medina Gandora', code: 'RT-GA-131', cat: 'Gandoras', col: 'Everyday', order: 5, fabric: 'Crepe', fabricType: 'Crepe', origin: 'Casablanca, Morocco', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6,
    summary: 'Charcoal crepe gandora with a contrast silver sfifa, a year-round staple.',
    colours: [{ name: 'Charcoal', hex: '#26262a', family: 'Black', img: 'charcoal-gandora.png' }],
    sizes: SIZES, tiers: TIERS,
    media: [['charcoal-gandora.png', 'Charcoal gandora, front', null], ['ph/madrasa-doors.jpg', 'Styled against madrasa doors', null]] },
  { name: 'Riad Stripe Jabador', code: 'RT-JA-045', cat: 'Jabadors', col: 'Everyday', order: 7, fabric: 'Cotton', fabricType: 'Cotton', origin: 'Tangier, Morocco', moq: 18, pack: 'Pack of 6 · S–XL', packSize: 6,
    summary: 'Light striped jabador with a hood, breathable for summer and Umrah travel.',
    colours: [{ name: 'Sage stripe', hex: '#b7b8a3', family: 'Neutral', img: 'mint-tea-jabador.jpg' }],
    sizes: ['S', 'M', 'L', 'XL'], tiers: [['18 – 71 units', 'Trade price'], ['72+ units', '− 10%']],
    media: [['mint-tea-jabador.jpg', 'Sage stripe jabador, front', null], ['ph/chaouen-door.jpg', 'Against a blue Chaouen door', null]] },
  { name: 'Rehal & Prayer Mat Set', code: 'RT-PR-009', cat: 'Prayer essentials', col: 'Ramadan & Eid', badge: 'Gift set', newArrival: true, order: 8, fabric: 'Carved wood · chenille', fabricType: 'Chenille', origin: 'Fez, Morocco', moq: 24, pack: 'Carton of 12', packSize: 12,
    summary: 'Hand-carved cedar rehal paired with a gold-bordered chenille prayer mat.',
    colours: [{ name: 'Midnight & Gold', hex: '#1d2335', family: 'Blue', img: 'prayer-set.jpg' }],
    sizes: ['One size'], tiers: [['24 – 95 units', 'Trade price'], ['96+ units', '− 10%']],
    media: [['prayer-set.jpg', 'Cedar rehal with midnight and gold prayer mat', null], ['ph/mihrab.jpg', 'Mihrab-inspired arch pattern', null]] },
  { name: 'Fez Leather Babouche', code: 'RT-AC-302', cat: 'Accessories', col: 'Everyday', badge: 'New', newArrival: true, order: 9, fabric: 'Goat leather', fabricType: 'Leather', origin: 'Fez, Morocco', moq: 24, pack: 'Box of 12 pairs · 38–45', packSize: 12,
    summary: 'Hand-stitched leather slippers in the classic pointed Fez shape, in twelve souk colours.',
    colours: [{ name: 'Souk mix', hex: '#d9a441', family: 'Neutral', img: 'ph/babouches.jpg' }],
    sizes: ['38–39', '40–41', '42–43', '44–45'], tiers: [['24 – 95 units', 'Trade price'], ['96+ units', '− 10%']],
    media: [['ph/babouches.jpg', 'Fez leather babouches in assorted colours', null], ['ph/lantern-stall.jpg', 'Souk stall in Fez', null]] },
];

async function main() {
  if (!existsSync(ASSETS)) {
    console.log(`Demo images not found at ${ASSETS}. Skipping the demo seed.`);
    return;
  }

  // Imported after the environment tweak above, so jobs run inline.
  const { connectDb, disconnectDb } = await import('../config/db');
  const { env } = await import('../config/env');
  await import('../jobs');
  const { storage } = await import('../lib/storage');
  const { Media } = await import('../modules/media/media.model');
  const { createFromUpload } = await import('../modules/media/media.service');
  const { Product } = await import('../modules/product/product.model');
  const productService = await import('../modules/product/product.service');
  const { Category, Collection } = await import('../modules/taxonomy/taxonomy.model');
  const taxonomy = await import('../modules/taxonomy/taxonomy.service');
  const { User } = await import('../modules/user/user.model');
  const { saveBlock } = await import('../modules/cms/cms.service');

  await connectDb();
  await storage.ensureBuckets();
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('No admin account. Run pnpm seed:admin first.');
  const userId = String(admin._id);
  void env;

  // Upload each image once, wait until it is processed, and reuse it everywhere.
  const mediaByFile = new Map<string, string>();
  async function mediaFor(file: string): Promise<string> {
    const cached = mediaByFile.get(file);
    if (cached) return cached;
    const tmp = join(await mkdtemp(join(tmpdir(), 'riad-seed-')), basename(file));
    await copyFile(join(ASSETS, file), tmp);
    const created = await createFromUpload({ path: tmp, originalname: basename(file), size: (await stat(join(ASSETS, file))).size }, userId, { allowSmallImages: true });
    for (let i = 0; i < 120; i++) {
      const m = await Media.findById(created.id).lean();
      if (m?.status === 'ready') break;
      if (m?.status === 'failed') throw new Error(`Processing failed for ${file}: ${m.error}`);
      await new Promise((r) => setTimeout(r, 500));
    }
    mediaByFile.set(file, created.id);
    console.log(`  uploaded ${file}`);
    return created.id;
  }

  async function ensure(model: typeof Category, kind: 'category' | 'collection', [name, description, showOnHome]: readonly [string, string, boolean], order: number) {
    const existing = await model.findOne({ name });
    if (existing) return String(existing._id);
    const created = await taxonomy.create(kind, { name, description, order, showOnHome, isActive: true, imageMediaId: null });
    return created.id;
  }

  console.log('Categories and collections');
  const catIds = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) catIds.set(c[0], await ensure(Category, 'category', c, i));
  const colIds = new Map<string, string>();
  for (const [i, c] of COLLECTIONS.entries()) colIds.set(c[0], await ensure(Collection, 'collection', c, i));

  console.log('Products');
  for (const p of PRODUCTS) {
    if (await Product.exists({ code: p.code })) {
      console.log(`  ${p.code} exists, skipped`);
      continue;
    }
    const colours = await Promise.all(
      p.colours.map(async (c) => ({
        _id: new Types.ObjectId().toString(),
        name: c.name,
        hex: c.hex,
        family: c.family as never,
        sku: `${p.code}-${c.name.slice(0, 2).toUpperCase()}`,
        stock: (c.stock ?? 'In stock') as never,
        swatchMediaId: await mediaFor(c.img),
      })),
    );
    const colourId = (name: string | null) => (name ? colours.find((c) => c.name === name)?._id ?? null : null);
    const media = [];
    for (const [file, alt, colour] of p.media) media.push({ mediaId: await mediaFor(file), colourId: colourId(colour), alt });

    const created = await productService.create(
      {
        name: p.name,
        code: p.code,
        categoryId: catIds.get(p.cat)!,
        collectionId: colIds.get(p.col)!,
        badge: (p.badge ?? '') as never,
        status: 'draft',
        order: p.order,
        featured: p.featured ?? false,
        newArrival: p.newArrival ?? false,
        summary: p.summary,
        descriptionHtml: `<p>${p.summary}</p><ul><li>Supplied folded in branded sleeves, ready for shelf or online listing photos.</li><li>Made in ${p.origin}.</li></ul><h4>Fabric &amp; care</h4><p>${p.fabric}. Gentle 30° wash or dry clean; cool iron on reverse.</p>`,
        specs: { fabric: p.fabric, fabricType: p.fabricType, origin: p.origin, care: 'Gentle 30° wash or dry clean; cool iron on reverse.', fit: '' },
        wholesale: { moq: p.moq, packText: p.pack, packSize: p.packSize, priceMode: 'hidden', belowMoq: 'allow', tiers: p.tiers.map(([range, label]) => ({ range, label })) },
        colours,
        sizes: p.sizes.map((label) => ({ label, available: true })),
        sizeGuide: p.sizes.length === 1 ? [] : p.sizes.map((s) => ({ size: s, chest: '', length: '', uk: '' })),
        media,
        overrides: { dispatch: '', samples: '', shipText: '' },
        relatedIds: [],
        seo: { title: '', description: '' },
      },
      userId,
    );
    await productService.setStatus(created.id, 'published');
    console.log(`  created ${p.code} ${p.name}`);
  }

  // A first hero slide, so the homepage has an image before the client edits anything.
  const heroImage = await mediaFor('emerald-djellaba.png');
  await saveBlock(
    'hero',
    { data: { slides: [{ title: 'Moroccan craft, ready for your shelves', subtitle: 'Premium djellabas, gandoras and prayer essentials, wholesale for UK retailers.', mediaId: heroImage, cta: { text: 'Start an enquiry', href: '/enquiry' } }] } },
    userId,
  );

  console.log('Demo catalogue ready.');
  await disconnectDb();
  process.exit(0);
}

main().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
