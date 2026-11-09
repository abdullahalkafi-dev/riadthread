import { cn } from '@/lib/cn';
import type { ProductCard } from '@/types/api';
import { ProductCardItem, ProductCardSkeleton } from './ProductCardItem';

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-7 md:grid-cols-3 xl:grid-cols-4';

/** The grid of product cards. `busy` dims it while new results load. */
export function ProductGrid({ items, busy = false, onClear }: { items: ProductCard[]; busy?: boolean; onClear?: () => void }) {
  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
        <img src="/brand/logo.png" alt="" width={96} height={96} className="mx-auto h-24 w-24" />
        <p className="mt-2 font-display text-4xl">Nothing here, yet.</p>
        {onClear && (
          <button type="button" onClick={onClear} className="mt-4 text-terracotta-500 underline underline-offset-4">
            Clear filters
          </button>
        )}
      </div>
    );
  }
  return (
    <div className={cn(GRID, 'transition-opacity', busy && 'opacity-50')} aria-busy={busy}>
      {items.map((p, i) => (
        <ProductCardItem key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
