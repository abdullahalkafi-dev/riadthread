import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EnquiriesScreen } from '@/features/admin/enquiries/EnquiriesScreen';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Enquiries' };

export default function EnquiriesPage() {
  // The screen reads the address bar (filters, open panel), which needs a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" />}>
      <EnquiriesScreen />
    </Suspense>
  );
}
