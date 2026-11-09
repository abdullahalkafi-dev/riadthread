import type { BlockData, MediaWithAlt, ProductCard } from '@/types/api';
import { CRAFT_DEFAULTS } from '../content';
import { CraftStepper } from './CraftStepper';

/** Craft section: dashboard text when there is some, the design's copy otherwise. Pictures come from the collection. */
export function Craft({ data, products }: { data: BlockData<'craft'> | undefined; products: ProductCard[] }) {
  const items = data && data.items.length > 0 ? data.items : [...CRAFT_DEFAULTS.items];
  const heading = data?.heading && data.items.length > 0 ? data.heading : CRAFT_DEFAULTS.heading;

  // Close-up shots first (a style's second photo), then the cover, one per step.
  const images: Array<MediaWithAlt | null> = items.map((_, i) => {
    const p = products[i % Math.max(1, products.length)];
    return p?.hover ?? p?.cover ?? null;
  });

  return <CraftStepper heading={heading} items={items} images={images} />;
}
