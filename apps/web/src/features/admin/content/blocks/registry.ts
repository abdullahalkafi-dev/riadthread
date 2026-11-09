import type { BlockKey } from '@/types/api';
import { brandFilmBlock, heroBlock, lookbookBlock } from './MediaBlocks';
import { announcementBlock, craftBlock, faqBlock, heritageBlock, ramadanBlock, stepsBlock, supplyBlock, trustBlock } from './SimpleBlocks';
import type { AnyBlockDef } from './types';

/** Every editable block, in the order the owner meets them. A missing key is a compile error. */
export const BLOCKS: { [K in BlockKey]: AnyBlockDef & { key: K } } = {
  announcement: announcementBlock,
  hero: heroBlock,
  ramadan: ramadanBlock,
  trust: trustBlock,
  steps: stepsBlock,
  faq: faqBlock,
  supply: supplyBlock,
  heritage: heritageBlock,
  craft: craftBlock,
  lookbook: lookbookBlock,
  brandFilm: brandFilmBlock,
};
