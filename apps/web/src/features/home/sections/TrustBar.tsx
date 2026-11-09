import { BoxIcon, HeartIcon, ShopIcon, StarIcon, TruckIcon } from '@/components/site/icons';
import type { BlockData } from '@/types/api';

const ICONS = [ShopIcon, BoxIcon, TruckIcon, StarIcon, HeartIcon];

/** Single-line strip of reassurances under the hero. Scrolls sideways on small screens. */
export function TrustBar({ items }: { items: BlockData<'trust'>['items'] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Why retailers choose us" className="border-y border-sand-300 bg-sand-50">
      <ul className="no-scrollbar mx-auto flex max-w-[1400px] gap-8 overflow-x-auto whitespace-nowrap px-4 py-5 text-[14px] sm:px-6 lg:justify-between lg:px-10">
        {items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
            <li key={item.title} className="flex items-center gap-3" title={item.text || undefined}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-sand-200 text-terracotta-600">
                <Icon size={17} />
              </span>
              {item.title}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
