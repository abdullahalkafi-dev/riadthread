import type { Metadata } from 'next';
import { ProductEditor } from '@/features/admin/products/ProductEditor';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor key={id} productId={id} />;
}
