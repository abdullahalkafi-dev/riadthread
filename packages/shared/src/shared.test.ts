import { describe, expect, it } from 'vitest';
import { createEnquirySchema, productInput, productUpdate, publishChecks, taxonomyUpdate } from './index';

const id = 'a'.repeat(24);

const baseEnquiry = {
  submissionKey: 'key-1234567890-abcdef',
  entryPoint: 'product_page' as const,
  contact: {
    name: 'Aisha Rahman',
    business: 'Al-Noor Boutique',
    email: 'Aisha@Example.com',
    phone: '+44 7700 900142',
  },
  items: [{ productId: id, colour: 'Emerald', sizes: [{ label: 'M', qty: 12 }] }],
};

describe('createEnquirySchema', () => {
  it('accepts a product enquiry without a message and lowercases the email', () => {
    const parsed = createEnquirySchema.parse(baseEnquiry);
    expect(parsed.contact.email).toBe('aisha@example.com');
    expect(parsed.message).toBe('');
  });

  it('requires a message when no products are attached', () => {
    const result = createEnquirySchema.safeParse({ ...baseEnquiry, items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a filled honeypot field', () => {
    const result = createEnquirySchema.safeParse({ ...baseEnquiry, website_url: 'http://spam.test' });
    expect(result.success).toBe(false);
  });
});

describe('productInput', () => {
  it('fills sensible defaults for optional sections', () => {
    const parsed = productInput.parse({ name: 'Fez Djellaba', code: 'RT-DJ-104', categoryId: id, collectionId: id });
    expect(parsed.status).toBe('draft');
    expect(parsed.wholesale.priceMode).toBe('hidden');
    expect(parsed.colours).toEqual([]);
  });
});

describe('publishChecks', () => {
  const ready = {
    name: 'Fez Djellaba',
    code: 'RT-DJ-104',
    categoryId: id,
    colours: [{ swatchMediaId: id }],
    sizes: [{ label: 'M' }],
    media: [{ mediaId: id, alt: 'Front view' }],
    wholesale: { moq: 12, packText: 'Pack of 6' },
  };

  it('passes for a complete product', () => {
    const checks = publishChecks(ready, () => 'image');
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it('flags missing alt text and a non-image cover', () => {
    const checks = publishChecks({ ...ready, media: [{ mediaId: id, alt: '' }] }, () => 'video');
    expect(checks.find((c) => c.key === 'alt')?.ok).toBe(false);
    expect(checks.find((c) => c.key === 'cover')?.ok).toBe(false);
  });
});

describe('update schemas', () => {
  it('only contain the keys that were sent, so a PATCH never resets other fields', () => {
    expect(productUpdate.parse({ name: 'Renamed' })).toEqual({ name: 'Renamed' });
    expect(taxonomyUpdate.parse({ isActive: false })).toEqual({ isActive: false });
  });

  it('still validates the keys that are sent', () => {
    expect(productUpdate.safeParse({ code: 'x' }).success).toBe(false);
    expect(productUpdate.safeParse({ status: 'live' }).success).toBe(false);
  });
});
