import { Skeleton } from '@/components/ui/Skeleton';

/** Shown while a page streams in: a calm placeholder shaped like a heading and a content block. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-5 h-14 w-full max-w-xl" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/4] w-full rounded-b-[16px] rounded-t-full" />
            <Skeleton className="mx-auto mt-4 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
