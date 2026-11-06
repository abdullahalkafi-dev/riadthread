import { HOME_SECTIONS, PAGE_KEYS } from '@riad/shared';

/**
 * Starting content, so the website is complete before anything is edited.
 * Every claim here is a placeholder for the client to confirm in the dashboard.
 */
export const BLOCK_DEFAULTS: Record<string, Record<string, unknown>> = {
  announcement: {
    enabled: true,
    message: 'Ramadan 2027 orders are open. Order early for UK delivery before Ramadan.',
    href: '/collections/ramadan-eid',
  },
  hero: {
    slides: [
      {
        title: 'Moroccan craft, ready for your shelves',
        subtitle: 'Premium djellabas, gandoras and prayer essentials, wholesale for UK retailers.',
        mediaId: null,
        cta: { text: 'Start an enquiry', href: '/enquiry' },
      },
    ],
  },
  ramadan: {
    enabled: true,
    heading: 'Stock up for Ramadan',
    text: 'Retailers order weeks before the month begins. Send your enquiry early.',
    orderByDate: null,
    startDate: null,
  },
  trust: {
    items: [
      { title: 'Made in Morocco', text: '' },
      { title: 'Mixed-size packs', text: '' },
      { title: 'Trade pricing on request', text: '' },
      { title: 'Samples on request', text: '' },
    ],
  },
  steps: {
    heading: 'How wholesale works',
    items: [
      { title: 'Browse the range', text: 'Look through our collections and choose your colours and sizes.' },
      { title: 'Build your enquiry list', text: 'Add products with rough quantities. No payment is taken online.' },
      { title: 'We send your quote', text: 'We contact you with trade prices and delivery details.' },
      { title: 'Confirm and we ship', text: 'Agree the order with us directly and we arrange delivery.' },
    ],
  },
  faq: {
    items: [
      { q: 'What is the minimum order?', a: 'Each product shows its own minimum order quantity. You can mix sizes within a product.' },
      { q: 'Do I pay online?', a: 'No. Send an enquiry and we will contact you to agree prices and delivery.' },
      { q: 'Can I order samples?', a: 'Please ask in your enquiry and we will tell you what is available.' },
    ],
  },
  supply: {
    heading: 'Who we supply',
    items: [
      { title: 'Boutiques', text: '' },
      { title: 'Online stores', text: '' },
      { title: 'Mosque and centre shops', text: '' },
      { title: 'Distributors', text: '' },
    ],
  },
  heritage: { heading: 'Made by hand, finished with care', body: '', mediaId: null },
  craft: { heading: 'The craft', items: [] },
  lookbook: { heading: 'Shop the look', mediaIds: [] },
  brandFilm: { heading: '', mediaId: null, posterMediaId: null },
};

export const PAGE_DEFAULTS: Record<string, { title: string; bodyHtml: string }> = {
  about: { title: 'About us', bodyHtml: '<p>Tell your story here.</p>' },
  contact: { title: 'Contact', bodyHtml: '<p>Add your contact details here.</p>' },
  'faq-page': { title: 'Frequently asked questions', bodyHtml: '' },
  privacy: { title: 'Privacy policy', bodyHtml: '<p>To be completed before launch.</p>' },
  cookies: { title: 'Cookie policy', bodyHtml: '<p>To be completed before launch.</p>' },
  terms: { title: 'Terms', bodyHtml: '<p>To be completed before launch.</p>' },
};

export const DEFAULT_LAYOUT = HOME_SECTIONS.map((key) => ({ key, visible: key !== 'lineSheet' }));
export const PAGE_KEY_LIST = PAGE_KEYS;
