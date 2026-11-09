import type { Media, Taxonomy } from '@/types/api';

export interface NavLink {
  label: string;
  href: string;
}

/** What the header, menu drawer and footer need to know about a category. */
export interface NavCategory {
  slug: string;
  name: string;
  image: Media | null;
}

export const toNavCategory = (c: Taxonomy): NavCategory => ({ slug: c.slug, name: c.name, image: c.image });

export const categoryHref = (slug: string) => `/collections?category=${encodeURIComponent(slug)}`;
export const collectionHref = (slug: string) => `/collections/${encodeURIComponent(slug)}`;

/**
 * Header links. Anchors to home sections are only offered while that section
 * is switched on in the dashboard, so no link ever points at nothing.
 */
export function mainLinks(layout: string[]): NavLink[] {
  const links: NavLink[] = [{ label: 'Home', href: '/' }];
  if (layout.includes('lookbook')) links.push({ label: 'Lookbook', href: '/#lookbook' });
  if (layout.includes('steps')) links.push({ label: 'How it works', href: '/#process' });
  links.push({ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' });
  return links;
}
