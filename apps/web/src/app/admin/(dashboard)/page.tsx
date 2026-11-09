import type { Metadata } from 'next';
import { OverviewScreen } from '@/features/admin/overview/OverviewScreen';

export const metadata: Metadata = { title: 'Overview' };

export default function OverviewPage() {
  return <OverviewScreen />;
}
