import type { Metadata } from 'next';
import { TaxonomyManager } from '@/features/admin/taxonomy/TaxonomyManager';

export const metadata: Metadata = { title: 'Categories' };

export default function CategoriesPage() {
  return <TaxonomyManager kind="categories" />;
}
