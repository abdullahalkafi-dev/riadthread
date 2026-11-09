import { cn } from '@/lib/cn';

/** Loading placeholder. Size and shape come from the caller via className. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-sand-200', className)} />;
}
