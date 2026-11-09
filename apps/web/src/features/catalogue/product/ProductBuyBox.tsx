'use client';

import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { ProductDetail } from '@/types/api';

export type Quantities = Record<string, number>;

export const totalOf = (q: Quantities) => Object.values(q).reduce((a, b) => a + b, 0);

/** What the quantity bar and hint say about the minimum order. */
export function moqHint(total: number, moq: number, block: boolean): { text: string; ok: boolean } {
  if (total === 0) return { text: `Minimum order ${moq} units — mix sizes freely.`, ok: false };
  if (total < moq) {
    return { text: `${moq - total} more to reach the ${moq}-unit minimum.${block ? '' : ' You can still enquire for less.'}`, ok: false };
  }
  return { text: 'Minimum reached — add to your enquiry list.', ok: true };
}

interface Props {
  product: ProductDetail;
  colourId: string | null;
  onColour: (id: string) => void;
  quantities: Quantities;
  onQuantity: (label: string, qty: number) => void;
  onSpread: () => void;
  onAdd: () => void;
  onAsk: () => void;
  onWhatsApp: () => void;
  whatsappHref: string | null;
  justAdded: boolean;
}

/** The right-hand column of the product page: price note, colour, sizes, actions and key facts. */
export function ProductBuyBox({ product, colourId, onColour, quantities, onQuantity, onSpread, onAdd, onAsk, onWhatsApp, whatsappHref, justAdded }: Props) {
  const { wholesale } = product;
  const total = totalOf(quantities);
  const hint = moqHint(total, wholesale.moq, wholesale.belowMoq === 'block');
  const blocked = wholesale.belowMoq === 'block' && total > 0 && total < wholesale.moq;
  const colour = product.colours.find((c) => c.id === colourId);
  const step = Math.max(1, wholesale.packSize);

  return (
    <div className="lg:sticky lg:top-28">
      <p className="text-[12px] uppercase tracking-[.22em] text-terracotta-600">
        {[product.collection?.name ?? product.category?.name, product.code].filter(Boolean).join(' · ')}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-[1.02] sm:text-5xl">{product.name}</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">{product.summary}</p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-sand-100 p-4 ring-1 ring-sand-300">
        <span className="grid h-12 w-10 place-items-end justify-center rounded-b-md rounded-t-full bg-majorelle-800 pb-2 font-display text-lg text-brass-300">£</span>
        <div className="text-sm">
          <p className="font-medium">{wholesale.priceLine || 'Trade price on request'}</p>
          <p className="text-ink-soft">
            MOQ {wholesale.moq} units{wholesale.packText ? ` · ${wholesale.packText}` : ''}
          </p>
        </div>
      </div>

      {product.colours.length > 0 && (
        <div className="mt-7">
          <p className="text-[12px] uppercase tracking-[.2em] text-ink-soft">
            Colour — <span className="text-ink">{colour?.name}</span>
            {colour && colour.stock !== 'In stock' && <span className="ml-2 normal-case tracking-normal text-terracotta-600">{colour.stock}</span>}
          </p>
          <div role="radiogroup" aria-label="Colour" className="mt-3 flex flex-wrap gap-3">
            {product.colours.map((c) => {
              const active = c.id === colourId;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={c.name}
                  onClick={() => onColour(c.id)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      'relative block h-12 w-10 overflow-hidden rounded-b-[4px] rounded-t-[999px] ring-1 ring-ink/10 transition',
                      active ? 'outline outline-2 outline-offset-2 outline-terracotta-500' : 'hover:-translate-y-0.5',
                    )}
                    style={{ background: c.hex }}
                  >
                    {c.swatch && <ResponsiveImage media={c.swatch} alt="" sizes="40px" fill className="object-cover" />}
                  </span>
                  <span className={cn('text-[11px]', active ? 'text-ink' : 'text-ink-mute')}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[12px] uppercase tracking-[.2em] text-ink-soft">Quantity per size</p>
          <button type="button" onClick={onSpread} className="text-[13px] text-terracotta-600 underline underline-offset-4 hover:text-terracotta-700">
            Spread the minimum for me
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {product.sizes.map((s) => {
            const qty = quantities[s.label] ?? 0;
            return (
              <div
                key={s.label}
                className={cn(
                  'rounded-2xl border p-2.5 text-center transition',
                  qty > 0 ? 'border-ink bg-sand-100' : 'border-sand-300',
                  !s.available && 'opacity-50',
                )}
              >
                <p className="text-[12px] font-medium">{s.label}</p>
                {s.available ? (
                  <div className="mt-1.5 flex items-center justify-between">
                    <button type="button" aria-label={`${step} fewer ${s.label}`} onClick={() => onQuantity(s.label, Math.max(0, qty - step))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand-200">−</button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={qty || ''}
                      placeholder="0"
                      aria-label={`Units in ${s.label}`}
                      onChange={(e) => onQuantity(s.label, Math.max(0, Number.parseInt(e.target.value || '0', 10) || 0))}
                      className="w-[2.6rem] bg-transparent text-center text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button type="button" aria-label={`${step} more ${s.label}`} onClick={() => onQuantity(s.label, qty + step)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand-200">+</button>
                  </div>
                ) : (
                  <p className="mt-2.5 text-xs text-ink-mute">Sold out</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200">
            <div
              className={cn('h-full rounded-full transition-[width,background] duration-500', hint.ok ? 'bg-zellige-500' : 'bg-terracotta-500')}
              style={{ width: `${Math.min(100, (total / wholesale.moq) * 100)}%` }}
            />
          </div>
          <p className="whitespace-nowrap text-sm">
            Total <strong>{total}</strong> / {wholesale.moq}
          </p>
        </div>
        <p aria-live="polite" className={cn('mt-2 text-[13px]', hint.ok ? 'text-zellige-500' : 'text-terracotta-600')}>
          {hint.text}
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAdd}
          disabled={blocked}
          className={cn(
            'btn-terra rounded-full border border-transparent py-4 text-[15px] disabled:cursor-not-allowed disabled:opacity-50',
            justAdded && '!border-zellige-500 !bg-zellige-500 !text-white',
          )}
        >
          {justAdded ? 'Added' : 'Add to enquiry list'}
        </button>
        <button type="button" onClick={onAsk} className="btn-line rounded-full py-4 text-[15px]">
          Enquire about this
        </button>
      </div>
      {whatsappHref && (
        <a
          href={whatsappHref}
          onClick={onWhatsApp}
          className="mt-3 flex items-center justify-center gap-2 rounded-full bg-whatsapp/10 py-3 text-sm text-[#0f6b3a] transition hover:bg-whatsapp/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
          </svg>
          Quick question on WhatsApp
        </a>
      )}

      <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-sand-300 text-sm ring-1 ring-sand-300">
        <Fact term="Fabric" value={product.specs.fabric} />
        <Fact term="Made in" value={product.specs.origin} />
        <Fact term="Dispatch" value={product.info.dispatch} />
        <Fact term="Samples" value={product.info.samples} />
      </dl>
    </div>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="bg-sand-50 p-4">
      <dt className="text-[11px] uppercase tracking-[.18em] text-ink-soft">{term}</dt>
      <dd className="mt-1">{value || '—'}</dd>
    </div>
  );
}
