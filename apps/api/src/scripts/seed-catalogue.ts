/**
 * pnpm seed:catalogue
 *
 * Loads the client's real catalogue (their Google Drive folder, downloaded to
 * docs/client-catalogue) into the database, so the website and the dashboard
 * can be built and reviewed against real photos instead of placeholders.
 *
 *  - creates the four categories and three collections,
 *  - creates one product per "Type" folder, with colours taken from the file
 *    names, and publishes it through the normal service (checklist included),
 *  - removes the older placeholder products that seed-demo created,
 *  - fills the homepage blocks and a few business settings.
 *
 * Product names are provisional: the client had not named the styles yet, so
 * they are described by what the photos show and should be renamed in the
 * dashboard. Prices were not supplied, so every product shows "on request".
 *
 * Safe to run twice (everything is matched by product code, slug or file name).
 * It refuses to run in production, or against a database whose name does not
 * contain "test" unless ALLOW_SEED=true is set.
 */

// Run uploads inline so this script does not depend on a worker being up.
process.env.REDIS_QUEUE_URL = '';
// The site is refreshed once at the end instead of after every product.
const webRevalidateUrl = process.env.WEB_REVALIDATE_URL;
process.env.WEB_REVALIDATE_URL = '';

import { existsSync } from 'node:fs';
import { copyFile, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { Types } from 'mongoose';
import sharp from 'sharp';
import type { COLOUR_FAMILIES } from '@riad/shared';

const CATALOGUE = resolve(process.cwd(), process.env.CATALOGUE_DIR ?? '../../docs/client-catalogue');
const DESIGN_ASSETS = resolve(process.cwd(), process.env.DEMO_ASSETS_DIR ?? '../../designs/assets');

/* ------------------------------------------------------------------ */
/* Catalogue data                                                       */
/* ------------------------------------------------------------------ */

type Family = (typeof COLOUR_FAMILIES)[number];

/**
 * Where a photo comes from, relative to the catalogue folder:
 *   "Djellaba/Type 1/Blue.jpg"                       a file
 *   "Gandora (Thobes)/Type 2/Type 2 gandora.pdf#1"   the first photo inside a slide deck
 *   "design:ph/zellige.jpg"                          one of the design placeholders
 */
type Source = string;

interface ColourSpec {
  name: string;
  hex: string;
  family: Family;
  /** The colour's own photo. Without one, the product's cover photo stands in as the swatch. */
  photo?: Source;
}

interface ProductSpec {
  code: string;
  name: string;
  category: string;
  collection: string;
  order: number;
  badge?: 'New arrival';
  featured?: boolean;
  newArrival?: boolean;
  fabric: string;
  fabricType: string;
  origin: string;
  moq: number;
  pack: string;
  packSize: number;
  sizes: string[];
  summary: string;
  /** Plain statements about what the photos show. */
  points: string[];
  colours: ColourSpec[];
  /** The photo shown first (the cover). */
  cover: Source;
  /** Extra photos that are not a colour: close-ups, group shots, range overviews. */
  gallery: Array<{ src: Source; alt: string }>;
}

const ADULT = ['S', 'M', 'L', 'XL', 'XXL'];
const TIERS: Array<[string, string]> = [['12 – 47 units', 'Trade price'], ['48+ units', '− 10%']];

const D = 'Djellaba';
const G = 'Gandora (Thobes)';
const J = 'Jabador';

const PRODUCTS: ProductSpec[] = [
  {
    code: 'RT-DJ-001', name: 'Classic Sheer Djellaba', category: 'Djellabas', collection: 'Everyday essentials', order: 1,
    featured: true, fabric: 'Lightweight sheer', fabricType: 'Sheer', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A light, semi-sheer djellaba with a collar and a hand-finished trim down the front, in a range of soft and deep colours.',
    points: ['Collared neckline with a trimmed front placket', 'Full-length cut with long sleeves', 'Available in seven colours'],
    cover: `${D}/Type 1/Light blue.jpg`,
    colours: [
      { name: 'Blue', hex: '#2a4a9b', family: 'Blue', photo: `${D}/Type 1/Blue.jpg` },
      { name: 'Bright blue', hex: '#2f2fd0', family: 'Blue', photo: `${D}/Type 1/Bright blue.jpg` },
      { name: 'Green', hex: '#2f6b45', family: 'Green', photo: `${D}/Type 1/Green.jpg` },
      { name: 'Light blue', hex: '#8fb0e8', family: 'Blue', photo: `${D}/Type 1/Light blue.jpg` },
      { name: 'Light pink', hex: '#f2b8a2', family: 'Pink', photo: `${D}/Type 1/Light pink.jpg` },
      { name: 'Light turquoise', hex: '#9fd8e4', family: 'Blue', photo: `${D}/Type 1/Light turquoise.jpg` },
      { name: 'Red', hex: '#a0203f', family: 'Red', photo: `${D}/Type 1/Red.jpg` },
    ],
    gallery: [],
  },
  {
    code: 'RT-DJ-002', name: 'Mlifa Collar Djellaba', category: 'Djellabas', collection: 'New arrivals', order: 2,
    newArrival: true, badge: 'New arrival', fabric: 'Mlifa', fabricType: 'Mlifa', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A djellaba in mlifa fabric with a collar and a neat hand-stitched front trim, in four easy-to-sell colours.',
    points: ['Mlifa fabric with a soft, textured finish', 'Collared neckline with a trimmed placket', 'Close-up photos of the trim are included'],
    cover: `${D}/Type 2 (Mlifa fabric)/Black.png`,
    colours: [
      { name: 'Black', hex: '#1c1c1f', family: 'Black', photo: `${D}/Type 2 (Mlifa fabric)/Black.png` },
      { name: 'Dark green', hex: '#14412f', family: 'Green', photo: `${D}/Type 2 (Mlifa fabric)/Dark green.png` },
      { name: 'Light beige', hex: '#d3bfae', family: 'Neutral', photo: `${D}/Type 2 (Mlifa fabric)/Light beige.png` },
      { name: 'Light blue', hex: '#6f9bc7', family: 'Blue', photo: `${D}/Type 2 (Mlifa fabric)/Light blue.png` },
    ],
    gallery: [
      { src: `${D}/Type 2 (Mlifa fabric)/Close up 1.jpg`, alt: 'Close-up of the hand-stitched front trim, in blue' },
      { src: `${D}/Type 2 (Mlifa fabric)/Close up 2.jpg`, alt: 'Close-up of the front trim, in light turquoise' },
    ],
  },
  {
    code: 'RT-DJ-003', name: 'Kashmiri Hooded Djellaba', category: 'Djellabas', collection: 'Everyday essentials', order: 3,
    featured: true, fabric: 'Kashmiri', fabricType: 'Kashmiri', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A hooded djellaba in kashmiri fabric with a buttoned front and tonal braid, in four colours.',
    points: ['Full hood and buttoned front with tonal braid', 'Kashmiri fabric with a brushed, woollen look', 'A flat-lay of the colour range is included'],
    cover: `${D}/Type 3 (Kashmiri fabric)/Burgundy.jpg`,
    colours: [
      { name: 'Burgundy', hex: '#7a2a45', family: 'Red', photo: `${D}/Type 3 (Kashmiri fabric)/Burgundy.jpg` },
      { name: 'Dark grey', hex: '#55565a', family: 'Neutral', photo: `${D}/Type 3 (Kashmiri fabric)/Dark grey.jpg` },
      { name: 'Light brown', hex: '#b8a090', family: 'Brown', photo: `${D}/Type 3 (Kashmiri fabric)/Light brown.jpg` },
      { name: 'Off-white', hex: '#d8d0c4', family: 'Neutral', photo: `${D}/Type 3 (Kashmiri fabric)/Off-white.jpg` },
    ],
    gallery: [{ src: `${D}/Type 3 (Kashmiri fabric)/2025020522053659.jpg`, alt: 'Folded Kashmiri hooded djellabas in the available colours' }],
  },
  {
    code: 'RT-DJ-004', name: 'Striped Hooded Djellaba', category: 'Djellabas', collection: 'Everyday essentials', order: 4,
    fabric: '', fabricType: '', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A hooded djellaba in a pale base with bold vertical stripes and a matching braided front, in four stripe colours.',
    points: ['Full hood with a braided front', 'Vertical stripes in blue, green or mauve-taupe', 'A flat-lay of all the stripe colours is included'],
    cover: `${D}/Type 4/Blue.jpg`,
    colours: [
      { name: 'Blue', hex: '#3b4f95', family: 'Blue', photo: `${D}/Type 4/Blue.jpg` },
      { name: 'Dark blue', hex: '#2b3156', family: 'Blue', photo: `${D}/Type 4/Dark blue.jpg` },
      { name: 'Green', hex: '#2d5a47', family: 'Green', photo: `${D}/Type 4/Green.jpg` },
      { name: 'Mauve-taupe', hex: '#9c8280', family: 'Brown', photo: `${D}/Type 4/Mauve-taupe.jpg` },
    ],
    gallery: [
      { src: `${D}/Type 4/IMG-20240504-WA0048.jpg`, alt: 'Folded striped djellabas in the full colour range' },
      { src: `${D}/Type 1/White and green stripped Jellaba.jpg`, alt: 'White djellaba with green stripes and a braided front, close up' },
    ],
  },
  {
    code: 'RT-GA-001', name: 'Sfifa Gandora, Classic Trim', category: 'Gandoras (Thobes)', collection: 'New arrivals', order: 5,
    featured: true, newArrival: true, badge: 'New arrival', fabric: '', fabricType: '', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A gandora with a deep sfifa neckline and knotted buttons, in eight colour and trim combinations.',
    points: ['Deep V neckline with sfifa trim and knotted buttons', 'Trim in gold, grey or matching thread', 'A photo of the full colour range is included'],
    cover: `${G}/Type 1/White with gold trim.png`,
    colours: [
      { name: 'Black with gold trim', hex: '#17171a', family: 'Black', photo: `${G}/Type 1/Black with gold trim.jpg` },
      { name: 'Black with grey trim', hex: '#222226', family: 'Black', photo: `${G}/Type 1/Black with grey trim.jpg` },
      { name: 'Blue', hex: '#3f78c8', family: 'Blue', photo: `${G}/Type 1/Blue.jpg` },
      { name: 'Bright blue', hex: '#1f3fd0', family: 'Blue', photo: `${G}/Type 1/Bright blue.jpg` },
      { name: 'Green with matching trim', hex: '#24533a', family: 'Green', photo: `${G}/Type 1/Green with matching green trim.png` },
      { name: 'Maroon', hex: '#6b2c3c', family: 'Red', photo: `${G}/Type 1/Maroon.png` },
      { name: 'Warm beige', hex: '#cdbca8', family: 'Neutral', photo: `${G}/Type 1/Warm Beige.png` },
      { name: 'White with gold trim', hex: '#f2ecdf', family: 'Neutral', photo: `${G}/Type 1/White with gold trim.png` },
    ],
    gallery: [{ src: `${G}/Type 1/IMG-20251125-WA0002.jpg`, alt: 'Sfifa gandoras folded in every available colour' }],
  },
  {
    code: 'RT-GA-002', name: 'Sfifa Gandora, Two-Tone Trim', category: 'Gandoras (Thobes)', collection: 'Ramadan & Eid', order: 6,
    fabric: '', fabricType: '', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A gandora with a V neckline trimmed in a contrasting or tonal sfifa, shown in navy, cream, light blue and royal blue.',
    points: ['V neckline with sfifa trim in blue, gold or silver', 'Navy, cream, light blue and royal blue shown', 'Photos show the range together'],
    cover: `${G}/Type 2/Type 2 gandora.pdf#1`,
    colours: [
      { name: 'Navy with light blue trim', hex: '#1c2c52', family: 'Blue' },
      { name: 'Cream with gold trim', hex: '#efe8d4', family: 'Neutral' },
      { name: 'Light blue with silver trim', hex: '#9fc0e8', family: 'Blue' },
      { name: 'Royal blue', hex: '#1d3fb0', family: 'Blue' },
      { name: 'Navy with silver trim', hex: '#22397a', family: 'Blue' },
    ],
    gallery: [{ src: `${G}/Type 2/Type 2 gandora.pdf#2`, alt: 'Five sfifa gandoras laid out in a row, from cream to navy' }],
  },
  {
    code: 'RT-GA-003', name: 'Sfifa Gandora, Heavy Embroidery', category: 'Gandoras (Thobes)', collection: 'Ramadan & Eid', order: 7,
    fabric: '', fabricType: '', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A gandora with a wide, densely worked sfifa neckline in silver, gold or tonal thread.',
    points: ['Wide, heavily embroidered V neckline', 'Silver, gold and tonal trims', 'A photo of the full colour range is included'],
    // The single-colour shots in this folder are small (about 500 px); the overview photo is much sharper.
    cover: `${G}/Type 3/IMG-20251125-WA0003.jpg`,
    colours: [
      { name: 'Dark blue with silver trim', hex: '#2a4a82', family: 'Blue', photo: `${G}/Type 3/Dark blue gandora with silver matching trim.jpg` },
      { name: 'Green', hex: '#3a8f7f', family: 'Green', photo: `${G}/Type 3/Green.jpg` },
      { name: 'Off-white', hex: '#e5e0d6', family: 'Neutral', photo: `${G}/Type 3/Off-white.jpg` },
      { name: 'Rose pink', hex: '#c9779a', family: 'Pink', photo: `${G}/Type 3/Red.jpg` },
      { name: 'White with gold trim', hex: '#f4efe4', family: 'Neutral', photo: `${G}/Type 3/White with gold trim.jpg` },
    ],
    gallery: [{ src: `${G}/Type 3/IMG-20251125-WA0003.jpg`, alt: 'Heavily embroidered gandoras folded in every available colour' }],
  },
  {
    code: 'RT-JA-001', name: 'Summer Jabador Set', category: 'Jabadors', collection: 'Everyday essentials', order: 8,
    featured: true, fabric: '', fabricType: '', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A short-sleeve jabador set with an embroidered neckline, in a light summer weight.',
    points: ['Short sleeves with trousers to match', 'Embroidered V neckline in white, blue, silver or gold', 'Five colour and trim combinations'],
    cover: `${J}/Summer Jabador/Dark blue with white trim.jpg`,
    colours: [
      { name: 'Dark blue with white trim', hex: '#26438f', family: 'Blue', photo: `${J}/Summer Jabador/Dark blue with white trim.jpg` },
      { name: 'Light blue with blue trim', hex: '#a7c4e6', family: 'Blue', photo: `${J}/Summer Jabador/Light blue with blue trim.jpg` },
      { name: 'Light blue with silver trim', hex: '#9ebde0', family: 'Blue', photo: `${J}/Summer Jabador/Light blue with silver trim.jpg` },
      { name: 'Medium blue', hex: '#3f78c8', family: 'Blue', photo: `${J}/Summer Jabador/Medium blue.jpg` },
      { name: 'Off-white with dark trim', hex: '#e0ddd2', family: 'Neutral', photo: `${J}/Summer Jabador/Off-white with green trim.jpg` },
    ],
    gallery: [
      { src: `${J}/Summer Jabador/Summer Jabador.pdf#2`, alt: 'Cream short-sleeve jabador with grey embroidery, with matching trousers' },
      { src: `${J}/Summer Jabador/Summer Jabador.pdf#3`, alt: 'Cream short-sleeve jabador with gold embroidery, with matching trousers' },
    ],
  },
  {
    code: 'RT-JA-002', name: 'Junior Jabador Set', category: 'Jabadors', collection: 'Ramadan & Eid', order: 9,
    newArrival: true, badge: 'New arrival', fabric: '', fabricType: '', origin: '', moq: 12, pack: 'Pack of 6 · assorted ages', packSize: 6,
    sizes: ['2–3 yrs', '4–5 yrs', '6–7 yrs', '8–9 yrs'],
    summary: "A children's jabador set: a sheer embroidered outer layer over a white tunic and trousers.",
    points: ['Sheer, trimmed outer layer over a white tunic and trousers', 'Trim along the front, hem and sleeves', 'Photos show the set worn and flat'],
    cover: `${J}/Junior/Junior jabador.pdf#1`,
    colours: [
      { name: 'Bright blue', hex: '#2323c8', family: 'Blue', photo: `${J}/Junior/Bright blue.jpg` },
      { name: 'Dark blue', hex: '#232a52', family: 'Blue', photo: `${J}/Junior/Dark blue.jpg` },
      { name: 'Green', hex: '#234d38', family: 'Green', photo: `${J}/Junior/Green.jpg` },
      { name: 'Light turquoise with blue trim', hex: '#8fc3c8', family: 'Blue', photo: `${J}/Junior/Light turquoise with blue trim.jpg` },
    ],
    gallery: [
      { src: `${J}/Junior/Junior jabador.pdf#2`, alt: 'Junior jabador set in royal blue, worn' },
      { src: `${J}/Junior/IMG-20240524-WA0009.jpg`, alt: 'Junior jabador set in cream and gold, shown on a doll' },
    ],
  },
  {
    code: 'RT-JA-003', name: "Men's Three-Piece Jabador", category: 'Jabadors', collection: 'Ramadan & Eid', order: 10,
    fabric: '', fabricType: '', origin: '', moq: 12, pack: 'Pack of 6 · S–XXL', packSize: 6, sizes: ADULT,
    summary: 'A men\'s jabador set: a sheer trimmed outer layer over a white tunic and trousers, in six colours.',
    points: ['Sheer outer layer with trimmed front, hem and sleeves', 'Worn over a white tunic and trousers', 'Royal blue, light blue, green, cream and gold, and burgundy shown'],
    cover: `${J}/Untitled presentation.pdf#1`,
    colours: [
      { name: 'Royal blue', hex: '#2c3fd0', family: 'Blue' },
      { name: 'Light blue', hex: '#bfe0ee', family: 'Blue' },
      { name: 'Dark green', hex: '#1f4a2e', family: 'Green' },
      { name: 'Cream with gold trim', hex: '#efe4c0', family: 'Neutral' },
      { name: 'Burgundy', hex: '#7b1f2e', family: 'Red' },
    ],
    gallery: [{ src: `${J}/Untitled presentation.pdf#2`, alt: "Men's three-piece jabador sets worn in six colours" }],
  },
  {
    code: 'RT-PR-001', name: 'Prayer Mat', category: 'Prayer essentials', collection: 'Ramadan & Eid', order: 11,
    featured: true, fabric: 'Polyester, cotton and viscose blend', fabricType: 'Blend', origin: 'Turkey', moq: 12, pack: 'Pack of 12', packSize: 12, sizes: ['One size'],
    summary: 'A woven prayer mat with a bordered pattern and fringed ends, in turquoise and an assortment of other designs.',
    points: ['Size 70 × 110 cm, as printed on the supplier label', 'Blend of polyester, cotton and viscose, per the label', 'Bordered pattern with a fringed end'],
    cover: 'Accessories/Prayer mat/IMG-20240504-WA0012(1).jpg',
    colours: [
      { name: 'Turquoise', hex: '#2aa6a0', family: 'Green', photo: 'Accessories/Prayer mat/IMG-20240504-WA0012(1).jpg' },
      { name: 'Assorted designs', hex: '#3a3a4a', family: 'Neutral', photo: 'Accessories/Prayer mat/IMG-20240504-WA0013(1).png' },
    ],
    gallery: [
      { src: 'Accessories/Prayer mat/IMG-20240504-WA0016(1).png', alt: 'Prayer mats folded in navy, black and gold designs' },
      { src: 'Accessories/Prayer mat/IMG-20240504-WA0017(1).jpg', alt: 'Stacked prayer mats in green and black with gold patterns' },
      { src: 'Accessories/Prayer mat/IMG-20240504-WA0018(1).jpg', alt: 'Fringed end of a prayer mat with the supplier label' },
    ],
  },
];

/** Name, blurb, home tile, and the photo each one uses. Legacy names are matched so a re-run renames instead of duplicating. */
interface TaxonomySpec { name: string; slug: string; description: string; showOnHome: boolean; photo: Source; legacy?: string[] }
const CATEGORIES: TaxonomySpec[] = [
  { name: 'Djellabas', slug: 'djellabas', description: 'Hooded, collared and sheer djellabas in a wide range of colours.', showOnHome: true, photo: `${D}/Type 3 (Kashmiri fabric)/Burgundy.jpg` },
  { name: 'Gandoras (Thobes)', slug: 'gandoras', description: 'Gandoras with sfifa necklines in gold, silver and tonal trims.', showOnHome: true, photo: `${G}/Type 1/White with gold trim.png`, legacy: ['Gandoras'] },
  { name: 'Jabadors', slug: 'jabadors', description: 'Summer, junior and three-piece jabador sets.', showOnHome: true, photo: `${J}/Summer Jabador/Dark blue with white trim.jpg` },
  { name: 'Prayer essentials', slug: 'prayer-essentials', description: 'Prayer mats for your customers.', showOnHome: true, photo: 'Accessories/Prayer mat/IMG-20240504-WA0012(1).jpg' },
];
const COLLECTIONS: TaxonomySpec[] = [
  { name: 'New arrivals', slug: 'new-arrivals', description: 'The latest additions to the range.', showOnHome: true, photo: `${G}/Type 1/Black with gold trim.jpg` },
  { name: 'Ramadan & Eid', slug: 'ramadan-eid', description: 'Our Ramadan and Eid range for retailers.', showOnHome: true, photo: `${G}/Type 3/White with gold trim.jpg` },
  { name: 'Everyday essentials', slug: 'everyday-essentials', description: 'Year-round styles that sell steadily.', showOnHome: true, photo: `${D}/Type 1/Green.jpg`, legacy: ['Everyday'] },
];

/** What seed-demo created, so the placeholder range can be cleared without touching anything else. */
const DEMO_CODES = ['RT-DJ-104', 'RT-DJ-088', 'RT-DJ-121', 'RT-GA-210', 'RT-GA-117', 'RT-GA-131', 'RT-JA-045', 'RT-PR-009', 'RT-AC-302'];
const DEMO_CATEGORIES = ['Accessories'];

/** The WhatsApp number from the client's own chat. The flyer shows +44 7983 932335, which the client must confirm. */
const WHATSAPP_NUMBER = '+44 7584 513521';

const HERO_SLIDES: Array<{ title: string; subtitle: string; photo: Source; cta: { text: string; href: string } }> = [
  {
    title: 'Moroccan craft, ready for your shelves',
    subtitle: 'Djellabas, gandoras, jabadors and prayer mats, wholesale for UK retailers.',
    photo: `${D}/Type 3 (Kashmiri fabric)/Dark grey.jpg`,
    cta: { text: 'Start an enquiry', href: '/enquiry' },
  },
  {
    title: 'Gandoras with hand-finished sfifa',
    subtitle: 'Deep necklines in gold, silver and tonal thread, in a full colour range.',
    photo: `${G}/Type 1/White with gold trim.png`,
    cta: { text: 'View gandoras', href: '/collections?category={Gandoras (Thobes)}' },
  },
  {
    title: 'Djellabas for every season',
    subtitle: 'Sheer, hooded and striped styles, with mixed sizes and colours per pack.',
    photo: `${D}/Type 1/Light blue.jpg`,
    cta: { text: 'View djellabas', href: '/collections?category={Djellabas}' },
  },
];

/** Placeholder photography from the design (see designs/assets/ph/CREDITS.txt) until the client supplies their own. */
const HERITAGE_PHOTO: Source = 'design:riad-courtyard.jpg';
const LOOKBOOK_PHOTOS: Source[] = [
  'design:ph/djellaba-daily.jpg', 'design:ph/djellaba-akhmas.jpg', 'design:ph/embroidery-fez.jpg',
  'design:ph/chaouen-doors.jpg', 'design:ph/madrasa-doors.jpg', 'design:ph/zellige.jpg',
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const descriptionFor = (p: ProductSpec) =>
  `<p>${esc(p.summary)}</p><ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
  `<p>Trade prices and delivery are confirmed in your quote.</p>`;

/** Reads the embedded JPEG photos out of a Google Slides export (they are stored as raw streams). The logo is skipped. */
async function photosInPdf(file: string): Promise<Buffer[]> {
  const buf = await readFile(file);
  const found: Buffer[] = [];
  let pos = 0;
  for (;;) {
    const start = buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]), pos);
    if (start < 0) break;
    const end = buf.indexOf(Buffer.from([0xff, 0xd9]), start + 3);
    if (end < 0) break;
    pos = end + 2;
    const jpg = buf.subarray(start, end + 2);
    if (jpg.length < 20_000) continue;
    try {
      const meta = await sharp(jpg).metadata();
      await sharp(jpg).raw().toBuffer(); // a truncated stream fails here
      const isLogo = meta.width === 1080 && meta.height === 952;
      const duplicate = found.some((f) => f.length === jpg.length && f.equals(jpg));
      if (!isLogo && !duplicate) found.push(Buffer.from(jpg));
    } catch {
      /* not a complete photo: ignore */
    }
  }
  return found;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed: NODE_ENV is production.');
    process.exit(1);
  }
  const uri = process.env.MONGODB_URI ?? '';
  const dbName = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/.exec(uri)?.[1] || 'test';
  if (!/test/i.test(dbName) && process.env.ALLOW_SEED !== 'true') {
    console.error(`Refusing to seed database "${dbName}": its name does not contain "test". Set ALLOW_SEED=true to override.`);
    process.exit(1);
  }
  if (!existsSync(CATALOGUE)) {
    console.log(`Client catalogue not found at ${CATALOGUE}. Skipping the catalogue seed.`);
    return;
  }

  // Imported after the environment tweak above, so jobs run inline.
  const { connectDb, disconnectDb } = await import('../config/db');
  await import('../jobs');
  const { storage } = await import('../lib/storage');
  const { Media } = await import('../modules/media/media.model');
  const { createFromUpload, deleteMedia } = await import('../modules/media/media.service');
  const { Product } = await import('../modules/product/product.model');
  const productService = await import('../modules/product/product.service');
  const { Category, Collection } = await import('../modules/taxonomy/taxonomy.model');
  const taxonomy = await import('../modules/taxonomy/taxonomy.service');
  const { User } = await import('../modules/user/user.model');
  const { listBlocks, saveBlock } = await import('../modules/cms/cms.service');
  const { getSettings, updateSettings } = await import('../modules/settings/settings.service');

  await connectDb();
  await storage.ensureBuckets();
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('No admin account. Run pnpm seed:admin first.');
  const userId = String(admin._id);

  const stats = { uploaded: 0, reused: 0, created: 0, skipped: 0, demoRemoved: 0 };

  /* ---- media: upload each photo once, reuse it everywhere, and across runs ---- */

  const mediaBySource = new Map<string, string>();
  const pdfCache = new Map<string, Buffer[]>();

  async function waitUntilReady(id: string, label: string, seconds: number) {
    for (let i = 0; i < seconds * 2; i++) {
      const m = await Media.findById(id).lean();
      if (m?.status === 'ready') return;
      if (m?.status === 'failed') throw new Error(`Processing failed for ${label}: ${m.error}`);
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Timed out waiting for ${label}`);
  }

  /** Returns a ready media id for a source, uploading it only if it is not already in the library. */
  async function mediaFor(src: Source, opts: { waitSeconds?: number } = {}): Promise<string> {
    const cached = mediaBySource.get(src);
    if (cached) return cached;

    // The stored name doubles as the idempotency key, so a second run finds what the first one uploaded.
    const key = (src.startsWith('design:') ? `design/${src.slice(7)}` : `catalogue/${src}`).slice(0, 200);
    const existing = await Media.findOne({ originalName: key, status: 'ready' }).select('_id').lean();
    if (existing) {
      stats.reused++;
      mediaBySource.set(src, String(existing._id));
      return String(existing._id);
    }

    const dir = await mkdtemp(join(tmpdir(), 'riad-catalogue-'));
    let tmp: string;
    const pdfRef = /^(.*\.pdf)#(\d+)$/.exec(src);
    if (pdfRef) {
      const pdfPath = join(CATALOGUE, pdfRef[1]!);
      let photos = pdfCache.get(pdfPath);
      if (!photos) pdfCache.set(pdfPath, (photos = await photosInPdf(pdfPath)));
      const photo = photos[Number(pdfRef[2]) - 1];
      if (!photo) throw new Error(`No photo number ${pdfRef[2]} in ${pdfRef[1]}`);
      tmp = join(dir, `${basename(pdfRef[1]!, '.pdf')}-${pdfRef[2]}.jpg`);
      await writeFile(tmp, photo);
    } else {
      const from = src.startsWith('design:') ? join(DESIGN_ASSETS, src.slice(7)) : join(CATALOGUE, src);
      tmp = join(dir, `upload${extname(from)}`);
      await copyFile(from, tmp);
    }

    const created = await createFromUpload({ path: tmp, originalname: key, size: (await stat(tmp)).size }, userId, { allowSmallImages: true });
    await waitUntilReady(created.id, src, opts.waitSeconds ?? 60);
    stats.uploaded++;
    console.log(`  uploaded ${src}`);
    mediaBySource.set(src, created.id);
    return created.id;
  }

  /* ---- categories and collections ---- */

  async function upsertTaxonomy(kind: 'category' | 'collection', spec: TaxonomySpec, order: number): Promise<{ id: string; slug: string }> {
    const model = kind === 'category' ? Category : Collection;
    const imageMediaId = await mediaFor(spec.photo);
    const fields = { name: spec.name, slug: spec.slug, description: spec.description, order, showOnHome: spec.showOnHome, isActive: true, imageMediaId };
    const found = await model.findOne({ name: { $in: [spec.name, ...(spec.legacy ?? [])] } });
    const dto = found ? await taxonomy.update(kind, String(found._id), fields) : await taxonomy.create(kind, fields);
    return { id: dto.id, slug: dto.slug };
  }

  console.log('Categories and collections');
  const categoryId = new Map<string, string>();
  const categorySlug = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const t = await upsertTaxonomy('category', c, i);
    categoryId.set(c.name, t.id);
    categorySlug.set(c.name, t.slug);
  }
  const collectionId = new Map<string, string>();
  for (const [i, c] of COLLECTIONS.entries()) collectionId.set(c.name, (await upsertTaxonomy('collection', c, i)).id);

  /* ---- products ---- */

  // RESEED_CODES=RT-GA-003,RT-DJ-001 rebuilds just those products after a change to the data above.
  const reseed = (process.env.RESEED_CODES ?? '').split(',').map((c) => c.trim()).filter(Boolean);
  for (const code of reseed) {
    const old = await Product.findOne({ code }).select('_id').lean();
    if (!old) continue;
    await productService.setStatus(String(old._id), 'draft');
    await productService.remove(String(old._id));
    console.log(`  ${code} removed for a rebuild`);
  }

  console.log('Products');
  for (const p of PRODUCTS) {
    if (await Product.exists({ code: p.code })) {
      console.log(`  ${p.code} already exists, skipped`);
      stats.skipped++;
      continue;
    }

    const coverId = await mediaFor(p.cover);
    const colours = [];
    for (const c of p.colours) {
      colours.push({
        _id: new Types.ObjectId().toString(),
        name: c.name,
        hex: c.hex,
        family: c.family,
        sku: `${p.code}-${c.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}`,
        stock: 'In stock' as const,
        swatchMediaId: c.photo ? await mediaFor(c.photo) : coverId,
      });
    }

    // Colour photos first (tagged with their colour), then the extras; the chosen cover is moved to the front.
    const items: Array<{ mediaId: string; colourId: string | null; alt: string }> = [];
    for (const [i, c] of p.colours.entries()) {
      if (c.photo) items.push({ mediaId: await mediaFor(c.photo), colourId: colours[i]!._id, alt: `${p.name} in ${c.name}` });
    }
    for (const g of p.gallery) items.push({ mediaId: await mediaFor(g.src), colourId: null, alt: g.alt });
    // A cover that is not a colour photo or a listed extra (a group shot from a slide deck) still leads the list.
    let coverAt = items.findIndex((m) => m.mediaId === coverId);
    if (coverAt === -1) {
      items.unshift({ mediaId: coverId, colourId: null, alt: p.name });
      coverAt = 0;
    }
    const media = [items[coverAt]!, ...items.filter((_, i) => i !== coverAt)];

    const created = await productService.create(
      {
        name: p.name,
        code: p.code,
        categoryId: categoryId.get(p.category)!,
        collectionId: collectionId.get(p.collection)!,
        badge: (p.badge ?? '') as never,
        status: 'draft',
        order: p.order,
        featured: p.featured ?? false,
        newArrival: p.newArrival ?? false,
        summary: p.summary,
        descriptionHtml: descriptionFor(p),
        specs: { fabric: p.fabric, fabricType: p.fabricType, origin: p.origin, care: '', fit: '' },
        wholesale: { moq: p.moq, packText: p.pack, packSize: p.packSize, priceMode: 'hidden', belowMoq: 'allow', tiers: TIERS.map(([range, label]) => ({ range, label })) },
        colours: colours as never,
        sizes: p.sizes.map((label) => ({ label, available: true })),
        sizeGuide: p.sizes.length === 1 ? [] : p.sizes.map((s) => ({ size: s, chest: '', length: '', uk: '' })),
        media,
        overrides: { dispatch: '', samples: '', shipText: '' },
        relatedIds: [],
        seo: { title: '', description: '' },
      },
      userId,
    );
    // Publishing runs the dashboard's checklist; a failure here means the data above needs fixing.
    await productService.setStatus(created.id, 'published');
    stats.created++;
    console.log(`  created ${p.code}  ${p.name}  (${p.colours.length} colours, ${media.length} photos)`);
  }

  /* ---- home page content ---- */

  console.log('Homepage content');
  const blocks = await listBlocks();
  const current = (key: string) => (blocks.find((b) => b.key === key)?.data ?? {}) as Record<string, unknown>;

  const slides = [];
  for (const s of HERO_SLIDES) {
    // Links point at the real category slugs, which differ between a fresh and a renamed database.
    const href = s.cta.href.replace(/\{([^}]+)\}/, (_m, name: string) => categorySlug.get(name) ?? '');
    slides.push({ title: s.title, subtitle: s.subtitle, mediaId: await mediaFor(s.photo), cta: { text: s.cta.text, href } });
  }
  await saveBlock('hero', { data: { slides } }, userId);

  await saveBlock('heritage', { data: { ...current('heritage'), mediaId: await mediaFor(HERITAGE_PHOTO) } }, userId);
  const lookbookIds: string[] = [];
  for (const src of LOOKBOOK_PHOTOS) lookbookIds.push(await mediaFor(src));
  await saveBlock('lookbook', { data: { ...current('lookbook'), mediaIds: lookbookIds } }, userId);

  // The brand film is optional: a missing file or a slow upload must not stop the seed.
  try {
    const film = join(DESIGN_ASSETS, 'brand/brand-film-hd.mp4');
    if (existsSync(film)) {
      const mediaId = await mediaFor('design:brand/brand-film-hd.mp4', { waitSeconds: 180 });
      const posterMediaId = await mediaFor('design:brand/brand-film-hd-poster.jpg');
      await saveBlock('brandFilm', { data: { ...current('brandFilm'), mediaId, posterMediaId } }, userId);
    } else {
      console.log('  brand film not found, skipped');
    }
  } catch (err) {
    console.log(`  brand film skipped: ${err instanceof Error ? err.message : String(err)}`);
  }

  /* ---- settings ---- */

  const { updatedAt: _updatedAt, ...settings } = await getSettings();
  void _updatedAt;
  await updateSettings({
    ...settings,
    business: { ...settings.business, phone: WHATSAPP_NUMBER },
    whatsapp: { ...settings.whatsapp, number: WHATSAPP_NUMBER },
  });

  /* ---- placeholder demo range ---- */

  console.log('Removing the placeholder demo range');
  const demoProducts = await Product.find({ code: { $in: DEMO_CODES } }).select('_id code status media colours').lean();
  const demoMediaIds = new Set<string>();
  for (const d of demoProducts) {
    for (const m of d.media ?? []) demoMediaIds.add(String(m.mediaId));
    for (const c of d.colours ?? []) if (c.swatchMediaId) demoMediaIds.add(String(c.swatchMediaId));
    // A published product must be taken down before it can be deleted.
    await productService.setStatus(String(d._id), 'draft');
    await productService.remove(String(d._id));
    stats.demoRemoved++;
    console.log(`  removed ${d.code}`);
  }
  for (const name of DEMO_CATEGORIES) {
    const old = await Category.findOne({ name }).select('_id').lean();
    if (old) await taxonomy.remove('category', String(old._id)).catch((e: unknown) => console.log(`  kept category ${name}: ${e instanceof Error ? e.message : String(e)}`));
  }
  // The old homepage image and demo photos: deleted only when nothing uses them any more.
  const demoHero = await Media.find({ originalName: { $in: ['emerald-djellaba.png'] } }).select('_id').lean();
  for (const m of demoHero) demoMediaIds.add(String(m._id));
  let mediaRemoved = 0;
  for (const id of demoMediaIds) {
    try {
      await deleteMedia(id);
      mediaRemoved++;
    } catch {
      /* still in use or already gone: leave it */
    }
  }

  const total = await Product.countDocuments({ status: 'published' });
  console.log(
    `\nDone. Products created: ${stats.created}, already present: ${stats.skipped}, published in total: ${total}.` +
      `\nPhotos uploaded: ${stats.uploaded}, reused: ${stats.reused}. Demo products removed: ${stats.demoRemoved}, demo files removed: ${mediaRemoved}.`,
  );
  // Ask the website to refresh its pages (best effort; pages also expire on their own).
  if (webRevalidateUrl && process.env.REVALIDATE_SECRET) {
    try {
      const res = await fetch(webRevalidateUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-revalidate-secret': process.env.REVALIDATE_SECRET },
        body: JSON.stringify({ tags: ['catalog', 'site'] }),
        signal: AbortSignal.timeout(5000),
      });
      console.log(`Website refresh: ${res.status}`);
    } catch {
      console.log('Website refresh: not reachable (pages will update when their cache expires)');
    }
  }
  await disconnectDb();
  process.exit(0);
}

main().catch((err) => {
  console.error('Catalogue seed failed:', err);
  process.exit(1);
});
