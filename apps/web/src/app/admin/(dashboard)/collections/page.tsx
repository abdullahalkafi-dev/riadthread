import type { Metadata } from 'next';
import { TaxonomyManager } from '@/features/admin/taxonomy/TaxonomyManager';

export const metadata: Metadata = { title: 'Collections' };

export default function CollectionsPage() {
  return <TaxonomyManager kind="collections" />;
}
