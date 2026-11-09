import type { Metadata } from 'next';
import { ContentScreen } from '@/features/admin/content/ContentScreen';

export const metadata: Metadata = { title: 'Website content' };

export default function ContentPage() {
  return <ContentScreen />;
}
