import Link from 'next/link';
import { CategoryThumb } from '@/components/site/CategoryThumb';
import { categoryHref } from '@/components/site/nav';
import { cn } from '@/lib/cn';
import type { Taxonomy } from '@/types/api';
import { CATEGORY_ARABIC } from '../content';

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/**
 * Grid cell for each tile in the bento layout. The first category is the tall
 * arch; the others fill the remaining columns so the grid has no gaps for any
 * number of categories.
 */
function cellClass(index: number, total: number): string {
  if (index === 0) return total === 1 ? 'col-span-2 lg:col-span-12 h-[420px]' : 'col-span-2 lg:col-span-5 lg:row-span-2 h-[420px] lg:h-auto';
  if (total === 2) return 'col-span-2 lg:col-span-7 lg:row-span-2 h-[260px] lg:h-auto';
  if (total === 3) return 'col-span-2 lg:col-span-7 h-[260px] lg:h-auto';
  if (total === 4 && index === 3) return 'col-span-2 lg:col-span-7 h-[240px] lg:h-auto';
  const spans = ['', 'col-span-2 lg:col-span-4 h-[260px] lg:h-auto', 'lg:col-span-3 h-[240px] lg:h-auto', 'lg:col-span-4 h-[240px] lg:h-auto', 'col-span-2 lg:col-span-3 h-[240px] lg:h-auto'];
  return spans[index] ?? 'lg:col-span-4 h-[240px] lg:h-auto';
}

function Tile({ category, index, total }: { category: Taxonomy; index: number; total: number }) {
  const arch = index === 0;
  const arabic = CATEGORY_ARABIC[category.slug];
  const delay = String(index % 3);
  return (
    <Link
      href={categoryHref(category.slug)}
      data-delay={delay}
      className={cn('ctile reveal group relative overflow-hidden bg-sand-200', arch ? 'rounded-b-[20px] rounded-t-[999px]' : 'rounded-[20px]', cellClass(index, total))}
    >
      <CategoryThumb image={category.image} alt={category.name} sizes={arch ? '(min-width:1024px) 40vw, 100vw' : '(min-width:1024px) 30vw, 100vw'} className={arch ? '' : 'object-top'} />
      <span className={cn('absolute inset-0 bg-gradient-to-t from-night-950/80 to-transparent', arch ? 'via-night-950/10' : 'via-transparent')} />
      <span className={cn('frame pointer-events-none absolute border border-brass-300/70', arch ? 'inset-4 rounded-b-[12px] rounded-t-[999px]' : 'inset-3 rounded-[14px]')} />
      <span className={cn('meta absolute flex items-end justify-between text-sand-50', arch ? 'inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8' : 'inset-x-5 bottom-5 sm:inset-x-6 sm:bottom-6')}>
        <span>
          {arabic && <span className={cn('block font-ruqaa text-brass-300', arch ? 'text-2xl' : 'text-lg')}>{arabic}</span>}
          <span className={cn('block font-display', arch ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl')}>{category.name}</span>
          <span className={cn('block text-sm text-sand-200', arch && 'mt-1')}>
            {category.publishedCount} {category.publishedCount === 1 ? 'style' : 'styles'}
          </span>
        </span>
        <span className={cn('go grid shrink-0 place-items-center rounded-full bg-sand-50 text-ink', arch ? 'h-12 w-12' : 'h-10 w-10 sm:h-11 sm:w-11')} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

export function ShopByCategory({ categories }: { categories: Taxonomy[] }) {
  if (categories.length === 0) return null;
  const word = NUMBER_WORDS[categories.length];
  return (
    <section aria-labelledby="categories-heading" className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[12px] uppercase tracking-[.3em] text-terracotta-500">Shop by category</p>
          <h2 id="categories-heading" className="mt-4 font-display text-4xl leading-[1.02] sm:text-6xl">
            {word ? `${word} ${categories.length === 1 ? 'house' : 'houses'},` : 'Every house,'}
            <br />
            one trusted supplier.
          </h2>
        </div>
        <p className="max-w-md text-lg leading-relaxed text-ink-soft">
          Every category ships in mixed-size packs, so you can try a new style on your rail without overstocking.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:auto-rows-[300px] lg:grid-cols-12">
        {categories.map((c, i) => (
          <Tile key={c.id} category={c} index={i} total={categories.length} />
        ))}
      </div>
    </section>
  );
}
