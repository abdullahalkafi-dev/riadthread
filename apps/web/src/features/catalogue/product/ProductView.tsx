'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useSiteDispatch } from '@/store/site/hooks';
import { openQuickEnquiry } from '@/store/site/ui.slice';
import type { ProductDetail } from '@/types/api';
import { spreadUnits } from '../../enquiry/items';
import { trackEvent } from '../../tracking/events';
import { journey } from '../../tracking/journey';
import { galleryFor } from '../gallery';
import { useAddToList } from '../useAddToList';
import { moqHint, ProductBuyBox, totalOf, type Quantities } from './ProductBuyBox';
import { ProductGallery } from './ProductGallery';
import { ProductTabs } from './ProductTabs';

interface Props {
  product: ProductDetail;
  whatsappHref: string | null;
}

/**
 * The interactive part of a product page. The product itself is fetched on the
 * server (so search engines and first paint have everything); this holds what
 * the visitor chooses: colour, photo and quantities per size.
 */
export function ProductView({ product, whatsappHref }: Props) {
  const dispatch = useSiteDispatch();
  const { addChosen } = useAddToList();
  const [colourId, setColourId] = useState<string | null>(product.colours[0]?.id ?? null);
  const [index, setIndex] = useState(0);
  const [quantities, setQuantities] = useState<Quantities>({});
  const [justAdded, setJustAdded] = useState(false);

  const gallery = useMemo(() => galleryFor(product, colourId), [product, colourId]);
  const colour = product.colours.find((c) => c.id === colourId) ?? null;
  const { wholesale } = product;
  const total = totalOf(quantities);
  const available = useMemo(() => product.sizes.filter((s) => s.available).map((s) => s.label), [product.sizes]);

  useEffect(() => {
    trackEvent({ type: 'product_view', productId: product.id, label: product.name });
    journey.relabel(`Product · ${product.name}`);
  }, [product.id, product.name]);

  const selectColour = useCallback(
    (id: string) => {
      setColourId(id);
      setIndex(0);
      const name = product.colours.find((c) => c.id === id)?.name;
      trackEvent({ type: 'variant_select', productId: product.id, label: name ?? 'colour' });
    },
    [product.colours, product.id],
  );

  const spread = useCallback(() => {
    setQuantities(Object.fromEntries(spreadUnits(available, wholesale.moq).map((s) => [s.label, s.qty])));
  }, [available, wholesale.moq]);

  const add = useCallback(() => {
    // Nothing chosen yet: add the minimum order spread across the sizes, as the shortcut would.
    const chosen = total > 0 ? Object.entries(quantities).map(([label, qty]) => ({ label, qty })) : spreadUnits(available, wholesale.moq);
    addChosen(product, colour?.name ?? null, chosen);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }, [addChosen, available, colour?.name, product, quantities, total, wholesale.moq]);

  const ask = useCallback(
    () => dispatch(openQuickEnquiry({ id: product.id, slug: product.slug, name: product.name, code: product.code, colour: colour?.name ?? null })),
    [colour?.name, dispatch, product.code, product.id, product.name, product.slug],
  );

  const hint = moqHint(total, wholesale.moq, wholesale.belowMoq === 'block');
  const blocked = wholesale.belowMoq === 'block' && total > 0 && total < wholesale.moq;

  return (
    <>
      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-14">
        <ProductGallery items={gallery} index={index} onIndex={setIndex} productId={product.id} productName={product.name} badge={product.badge} />
        <div className="lg:col-span-5">
          <ProductBuyBox
            product={product}
            colourId={colourId}
            onColour={selectColour}
            quantities={quantities}
            onQuantity={(label, qty) => setQuantities((q) => ({ ...q, [label]: qty }))}
            onSpread={spread}
            onAdd={add}
            onAsk={ask}
            onWhatsApp={() => trackEvent({ type: 'whatsapp_click', productId: product.id, label: product.name })}
            whatsappHref={whatsappHref}
            justAdded={justAdded}
          />
        </div>
      </div>

      <ProductTabs product={product} />

      {/* Mobile bar: always within thumb reach while choosing quantities. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-ink/10 bg-sand-50/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="text-sm leading-tight">
          <p className="text-xs text-ink-soft">Selected</p>
          <p>
            <strong>{total}</strong> / {wholesale.moq} units
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={blocked}
          aria-describedby="mobile-moq-hint"
          className={cn('btn-terra flex-1 rounded-full border border-transparent py-3.5 text-[15px] disabled:opacity-50', justAdded && '!border-zellige-500 !bg-zellige-500')}
        >
          {justAdded ? 'Added' : 'Add to enquiry list'}
        </button>
        <span id="mobile-moq-hint" className="sr-only">{hint.text}</span>
      </div>
    </>
  );
}
