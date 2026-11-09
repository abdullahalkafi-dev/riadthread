import type { Media, ProductCard } from '@/types/api';

/**
 * Props sent to client components are serialised into the page, so every byte
 * counts twice (HTML and the data the browser reads). Product cards show small
 * pictures, so the large renditions and the repeated blurred previews are left out.
 */
const CARD_MAX_WIDTH = 960;

export const withoutBlur = <T extends Pick<Media, 'blurDataUrl'>>(media: T): T => ({ ...media, blurDataUrl: null });

const forCard = <T extends Media>(media: T): T => ({
  ...media,
  variants: media.variants.filter((v) => v.width <= CARD_MAX_WIDTH),
});

/** Keeps the blurred preview of the main photo only; hover and colour photos load without one. */
export function lightCard(card: ProductCard): ProductCard {
  return {
    ...card,
    cover: card.cover && forCard(card.cover),
    hover: card.hover && withoutBlur(forCard(card.hover)),
    colours: card.colours.map((c) => ({ ...c, image: c.image && withoutBlur(forCard(c.image)) })),
  };
}
