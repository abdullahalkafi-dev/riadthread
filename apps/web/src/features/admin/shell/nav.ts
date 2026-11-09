import type { IconName } from '@/components/admin';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Overview must match exactly, otherwise it would be highlighted on every page. */
  exact?: boolean;
  /** Shows the number of new enquiries next to the label. */
  showNewCount?: boolean;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    items: [
      { href: '/admin', label: 'Overview', icon: 'home', exact: true },
      { href: '/admin/enquiries', label: 'Enquiries', icon: 'inbox', showNewCount: true },
    ],
  },
  {
    heading: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products', icon: 'shirt' },
      { href: '/admin/media', label: 'Media library', icon: 'img' },
      { href: '/admin/categories', label: 'Categories', icon: 'layers' },
      { href: '/admin/collections', label: 'Collections', icon: 'box' },
    ],
  },
  {
    heading: 'Website',
    items: [
      { href: '/admin/content', label: 'Website content', icon: 'file' },
      { href: '/admin/settings', label: 'Settings', icon: 'sliders' },
    ],
  },
  {
    heading: 'You',
    items: [{ href: '/admin/account', label: 'Account', icon: 'users' }],
  },
];

export const isActive = (item: NavItem, pathname: string) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
