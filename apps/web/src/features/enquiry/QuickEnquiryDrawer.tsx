'use client';

import { useEffect, useMemo } from 'react';
import { Drawer } from '@/components/site/Drawer';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { closeDrawer } from '@/store/site/ui.slice';
import { trackEvent } from '../tracking/events';
import { EnquiryForm } from './EnquiryForm';
import type { EnquiryItemInput } from './useEnquirySubmission';

/** "Ask about this style": a short question about one product, without building a list. */
export function QuickEnquiryDrawer() {
  const dispatch = useSiteDispatch();
  const open = useSiteSelector((s) => s.ui.drawer === 'quickEnquiry');
  const product = useSiteSelector((s) => s.ui.quickEnquiryProduct);

  const items = useMemo<EnquiryItemInput[]>(
    () => (product ? [{ productId: product.id, ...(product.colour ? { colour: product.colour } : {}), sizes: [] }] : []),
    [product],
  );

  useEffect(() => {
    if (open && product) trackEvent({ type: 'form_open', label: `ask about ${product.name}`, productId: product.id });
  }, [open, product]);

  return (
    <Drawer name="quickEnquiry" side="right" label="Ask about this style" className="flex h-full w-full flex-col overflow-y-auto bg-sand-50 sm:w-[460px]">
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-ink/10 px-6">
        <p className="font-display text-2xl">Ask about this style</p>
        <button type="button" onClick={() => dispatch(closeDrawer())} className="p-2" aria-label="Close">
          ✕
        </button>
      </div>
      {product && (
        <EnquiryForm
          key={product.id}
          entryPoint="quick_enquiry"
          items={items}
          productLabel={product.colour ? `${product.name} · ${product.colour}` : product.name}
        />
      )}
    </Drawer>
  );
}
