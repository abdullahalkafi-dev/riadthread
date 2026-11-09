'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import type { ProductDetail } from '@/types/api';

type TabKey = 'desc' | 'tiers' | 'sizes' | 'ship';

/** Description, wholesale tiers, size guide and delivery, as tabs. A tab with nothing to show is left out. */
export function ProductTabs({ product }: { product: ProductDetail }) {
  const base = useId();
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'desc', label: 'Description' },
    ...(product.wholesale.tiers.length > 0 ? [{ key: 'tiers' as const, label: 'Wholesale tiers' }] : []),
    ...(product.sizeGuide.length > 0 ? [{ key: 'sizes' as const, label: 'Size guide' }] : []),
    { key: 'ship', label: 'Packing & delivery' },
  ];
  const [active, setActive] = useState<TabKey>('desc');
  const { specs, wholesale } = product;

  return (
    <div className="mt-16 max-w-4xl lg:mt-24">
      <div role="tablist" aria-label="Product information" className="no-scrollbar flex gap-8 overflow-x-auto border-b border-ink/15 text-[13px] uppercase tracking-[.16em]">
        {tabs.map((t) => (
          <button
            key={t.key}
            id={`${base}-tab-${t.key}`}
            role="tab"
            type="button"
            aria-selected={active === t.key}
            aria-controls={`${base}-panel-${t.key}`}
            onClick={() => setActive(t.key)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 pb-4 transition',
              active === t.key ? 'border-terracotta-500 text-ink' : 'border-transparent text-ink-soft hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div key={t.key} id={`${base}-panel-${t.key}`} role="tabpanel" aria-labelledby={`${base}-tab-${t.key}`} hidden={active !== t.key} className="pt-8">
          {t.key === 'desc' && (
            <div className="prose-rt text-[16px] leading-relaxed text-ink-soft">
              {/* Saved through the API's HTML sanitiser, so it only contains allowed tags. */}
              {product.descriptionHtml ? <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} /> : <p>{product.summary}</p>}
              {(specs.fabric || specs.care || specs.fit) && (
                <>
                  <h4>Fabric &amp; care</h4>
                  {specs.fabric && <p>{specs.fabric}.</p>}
                  {specs.care && <p>{specs.care}</p>}
                  {specs.fit && <p>Fit: {specs.fit}</p>}
                </>
              )}
            </div>
          )}

          {t.key === 'tiers' && (
            <>
              <table className="w-full text-left text-[15px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[.2em] text-ink-soft">
                    <th className="pb-3 font-normal">Quantity</th>
                    <th className="pb-3 font-normal">Pricing</th>
                  </tr>
                </thead>
                <tbody>
                  {wholesale.tiers.map((tier) => (
                    <tr key={tier.range} className="border-t border-ink/10">
                      <td className="py-4">{tier.range}</td>
                      <td className="py-4 font-display text-xl">{tier.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {wholesale.tiersFootnote && <p className="mt-4 text-sm text-ink-soft">{wholesale.tiersFootnote}</p>}
            </>
          )}

          {t.key === 'sizes' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[15px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[.2em] text-ink-soft">
                    <th className="pb-3 font-normal">Size</th>
                    <th className="pb-3 font-normal">Chest (cm)</th>
                    <th className="pb-3 font-normal">Length (cm)</th>
                    <th className="pb-3 font-normal">Fits UK</th>
                  </tr>
                </thead>
                <tbody>
                  {product.sizeGuide.map((row) => (
                    <tr key={row.size} className="border-t border-ink/10">
                      <td className="py-3">{row.size}</td>
                      <td>{row.chest}</td>
                      <td>{row.length}</td>
                      <td>{row.uk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {t.key === 'ship' && (
            <div className="space-y-3 leading-relaxed text-ink-soft">
              {product.info.shipText.split('\n').filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
