'use client';

import { useCallback, useState } from 'react';
import { addLine, lineKey, type EnquiryLine } from '@/store/site/enquiry.slice';
import { useSiteDispatch } from '@/store/site/hooks';
import { showToast } from '@/store/site/ui.slice';
import { errorMessage } from '@/store/baseApi';
import type { ProductDetail } from '@/types/api';
import { spreadUnits } from '../enquiry/items';
import { trackEvent } from '../tracking/events';
import { journey } from '../tracking/journey';
import { catalogueApi } from './catalogueApi';

/** A small picture for the list: the colour's own photo when there is one, else the first image. */
function thumbFor(detail: ProductDetail, colourId: string | null): string | null {
  const images = detail.media.filter((m) => m.media.type === 'image');
  const pick = (colourId && images.find((m) => m.colourId === colourId)) || images[0];
  const media = pick?.media;
  if (!media) return null;
  return media.variants.find((v) => v.format === 'webp' && v.width === 320)?.url ?? media.url;
}

/** Builds a list line. `sizes` are the units chosen per size; zero rows are dropped. */
export function buildLine(detail: ProductDetail, colourName: string | null, sizes: Array<{ label: string; qty: number }>): EnquiryLine {
  const colour = detail.colours.find((c) => c.name === colourName) ?? null;
  return {
    key: lineKey(detail.id, colour?.name ?? null),
    productId: detail.id,
    slug: detail.slug,
    name: detail.name,
    code: detail.code,
    colour: colour?.name ?? null,
    thumb: thumbFor(detail, colour?.id ?? null),
    moq: detail.wholesale.moq,
    sizes: sizes.filter((s) => s.qty > 0),
  };
}

/**
 * Adding to the enquiry list from places that only know a product's slug (cards,
 * quick view). The full product is fetched once so the line carries real sizes;
 * the minimum order is spread across the sizes on offer.
 */
export function useAddToList() {
  const dispatch = useSiteDispatch();
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const addMinimum = useCallback(
    async (slug: string, colourName?: string | null): Promise<boolean> => {
      setBusySlug(slug);
      try {
        const detail = await dispatch(catalogueApi.endpoints.getProduct.initiate(slug)).unwrap();
        const available = detail.sizes.filter((s) => s.available).map((s) => s.label);
        const sizes = spreadUnits(available, detail.wholesale.moq);
        dispatch(addLine(buildLine(detail, colourName ?? detail.colours[0]?.name ?? null, sizes)));
        dispatch(showToast(`${detail.name} added to your enquiry list`));
        trackEvent({ type: 'list_add', productId: detail.id, label: detail.name });
        journey.note('added to list');
        return true;
      } catch (err) {
        dispatch(showToast(errorMessage(err, 'That product could not be added. Please try again')));
        return false;
      } finally {
        setBusySlug(null);
      }
    },
    [dispatch],
  );

  /** Adds exactly what the visitor chose on the product page. */
  const addChosen = useCallback(
    (detail: ProductDetail, colourName: string | null, sizes: Array<{ label: string; qty: number }>) => {
      dispatch(addLine(buildLine(detail, colourName, sizes)));
      dispatch(showToast(`${detail.name} added to your enquiry list`));
      trackEvent({ type: 'list_add', productId: detail.id, label: detail.name });
      journey.note('added to list');
    },
    [dispatch],
  );

  return { addMinimum, addChosen, busySlug };
}
