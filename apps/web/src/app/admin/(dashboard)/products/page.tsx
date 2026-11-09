import type { Metadata } from 'next';
import { ProductList } from '@/features/admin/products/ProductList';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return <ProductList />;
}
