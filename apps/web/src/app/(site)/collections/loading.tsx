import { Skeleton } from '@/components/ui/Skeleton';
import { ProductGridSkeleton } from '@/features/catalogue/ProductGrid';

/** Shown while the server prepares a collection page. */
export default function Loading() {
  return (
    <>
      <div className="bg-night-900 px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[1400px] space-y-4">
          <Skeleton className="h-3 w-40 bg-night-800" />
          <Skeleton className="h-20 w-2/3 max-w-xl bg-night-800" />
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <ProductGridSkeleton />
      </div>
    </>
  );
}
