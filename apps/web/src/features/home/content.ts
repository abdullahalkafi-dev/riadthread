/**
 * Copy from design 5 that no content block provides. These are placeholders the
 * client confirms before launch; anything the dashboard can edit (blocks and
 * settings) always wins over what is written here.
 */

export const TOP_BAR_MESSAGES = [
  'Minimum 12 units · mix sizes & colours',
  'Dispatched from UK stock within 48 hours',
  'Samples available for new stockists',
] as const;

/** Arabic calligraphy label shown on a category tile, keyed by category slug. */
export const CATEGORY_ARABIC: Record<string, string> = {
  djellabas: 'جلابة',
  djellaba: 'جلابة',
  gandoras: 'قندورة',
  gandora: 'قندورة',
  jabadors: 'جبادور',
  jabador: 'جبادور',
  'prayer-essentials': 'سجادة',
  'prayer-mats': 'سجادة',
  accessories: 'بلغة',
};

export const HERO_TONES = ['#e3ebe4', '#f2e3d6', '#e1e5f2', '#ebe4dc', '#efe7da', '#e6e9de', '#e7e2db'] as const;

export const STORY = {
  eyebrow: 'Our story',
  heading: 'Moroccan tradition, made for your rail.',
  body: "We don't just sell garments. Every order carries a piece of Morocco's heritage, made by skilled artisans using traditional techniques, with comfort and quality in every stitch.",
  stats: [
    { value: 'Fez & Marrakech', label: 'Family workshops we work with' },
    { value: '12 units', label: 'Minimum order, sizes mixed' },
    { value: '48 hours', label: 'Dispatch from UK stock' },
    { value: '1 day', label: 'Typical reply with trade prices' },
  ],
} as const;

export const HERITAGE = {
  eyebrow: 'Our heritage',
  body: 'For twelve centuries, Fez has been the heart of Moroccan learning and craft: carved cedar, zellige tilework and silk-cord embroidery. Our partner workshops carry that tradition into every piece we supply.',
  stats: [
    { value: '789', label: 'Fez founded' },
    { value: '1,200+', label: 'Years of craft' },
    { value: '100%', label: 'Hand-finished trims' },
  ],
} as const;

export const CRAFT_DEFAULTS = {
  heading: 'Every detail, finished by hand.',
  items: [
    { title: 'Sfifa embroidery', text: 'Silk cord couched by hand along necklines and plackets, in patterns passed down through Fez families.' },
    { title: 'Aakad buttons', text: 'Knotted thread buttons, tied one by one. A single djellaba can carry more than forty.' },
    { title: 'Workshops of the medina', text: 'Small family workshops cut, sew and finish each run, so we know who made every piece.' },
    { title: 'Colour from zellige', text: 'Seasonal palettes drawn from Moroccan tilework: emerald, majorelle, saffron and stone.' },
  ],
} as const;

export const STEPS_INTRO = 'No account and no checkout. Send one enquiry and we take it from there.';

export const SUPPLY_INTRO =
  'Whether you run a boutique, an online store or a centre shop, we help you stock authentic Moroccan wear without the risk of large orders.';

export const FAQ_HEADING = 'Before you order';

export const LINE_SHEET = {
  eyebrow: 'Trade line sheet',
  heading: 'Every style, colour and minimum, in one PDF.',
} as const;

export const ENQUIRY_INVITE = {
  arabic: 'أهلاً وسهلاً',
  heading: 'Our door is open.',
  text: 'Tell us about your shop. A real person replies within one working day.',
} as const;

export const FOOTER_TEXT = 'Trusted supplier of Moroccan craftsmanship for retailers and boutiques across the UK.';
export const OPENING_HOURS = 'Mon–Fri, 9am–6pm UK time';
