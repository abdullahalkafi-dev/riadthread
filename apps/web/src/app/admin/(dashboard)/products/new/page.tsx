import type { Metadata } from 'next';
import { ProductEditor } from '@/features/admin/products/ProductEditor';

export const metadata: Metadata = { title: 'New product' };

export default function NewProductPage() {
  return <ProductEditor />;
}
