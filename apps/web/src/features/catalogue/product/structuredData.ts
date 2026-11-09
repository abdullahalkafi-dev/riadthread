import type { ProductDetail } from '@/types/api';

/** Absolute address for a path or already-absolute URL. */
const absolute = (siteUrl: string, value: string) => (/^https?:/.test(value) ? value : `${siteUrl}${value}`);

/**
 * schema.org Product data for search engines. There is no price on purpose:
 * this is a trade catalogue with prices on request, and a made-up price would
 * be worse than none.
 */
export function productJsonLd(product: ProductDetail, siteUrl: string, brand: string) {
  const images = product.media.filter((m) => m.media.type === 'image' && m.media.url).map((m) => absolute(siteUrl, m.media.url!));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.code,
    description: product.seo.description || product.summary,
    url: `${siteUrl}${product.seo.canonicalPath}`,
    brand: { '@type': 'Brand', name: brand },
    ...(images.length ? { image: images } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    ...(product.specs.fabric ? { material: product.specs.fabric } : {}),
    ...(product.colours.length ? { color: product.colours.map((c) => c.name).join(', ') } : {}),
  };
}

export function breadcrumbJsonLd(product: ProductDetail, siteUrl: string) {
  const trail = [
    { name: 'Home', url: siteUrl },
    { name: 'Collection', url: `${siteUrl}/collections` },
    ...(product.category ? [{ name: product.category.name, url: `${siteUrl}/collections?category=${product.category.slug}` }] : []),
    { name: product.name, url: `${siteUrl}${product.seo.canonicalPath}` },
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: t.url })),
  };
}

/** Safe to place inside a <script> tag: "<" can never close it early. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
