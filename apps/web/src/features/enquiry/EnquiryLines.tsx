'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { lineQty, removeLine, setSizeQty, type EnquiryLine } from '@/store/site/enquiry.slice';
import { useSiteDispatch } from '@/store/site/hooks';
import { trackEvent } from '../tracking/events';

interface Props {
  lines: EnquiryLine[];
  /** "units": design's compact list. "sizes": each size gets its own stepper (enquiry page). */
  mode?: 'units' | 'sizes';
  onNavigate?: () => void;
}

/** The visitor's enquiry list. */
export function EnquiryLines({ lines, mode = 'units', onNavigate }: Props) {
  const dispatch = useSiteDispatch();
  return (
    <ul className="divide-y divide-ink/10">
      {lines.map((line) => {
        const units = lineQty(line);
        return (
          <li key={line.key} className="flex gap-4 py-5">
            <Link href={`/products/${line.slug}`} onClick={onNavigate} className="shrink-0" aria-label={line.name}>
              {line.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element -- already a small processed rendition
                <img src={line.thumb} alt="" width={64} height={80} className="h-20 w-16 rounded-b-md rounded-t-[999px] bg-sand-200 object-cover" />
              ) : (
                <span className="block h-20 w-16 rounded-b-md rounded-t-[999px] bg-sand-200" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${line.slug}`} onClick={onNavigate} className="font-display text-xl leading-tight hover:text-terracotta-500">
                {line.name}
              </Link>
              <p className="mt-1 text-xs text-ink-soft">
                {[line.colour, line.code].filter(Boolean).join(' · ')}
              </p>
              {mode === 'units' ? (
                <>
                  <p className="mt-2 inline-block rounded-full bg-sand-200 px-3 py-1 text-xs">~{units} units</p>
                  {line.sizes.length > 0 && (
                    <p className="mt-1.5 text-xs text-ink-mute">{line.sizes.map((s) => `${s.label} ×${s.qty}`).join(' · ')}</p>
                  )}
                </>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {line.sizes.map((s) => (
                    <div key={s.label} className="flex items-center justify-between rounded-xl border border-sand-300 px-1.5 py-1">
                      <span className="pl-1.5 text-xs font-medium">{s.label}</span>
                      <span className="flex items-center">
                        <button type="button" aria-label={`One fewer ${s.label}`} onClick={() => dispatch(setSizeQty({ key: line.key, label: s.label, qty: s.qty - 1 }))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-sand-200">−</button>
                        <span className="w-8 text-center text-sm tabular-nums">{s.qty}</span>
                        <button type="button" aria-label={`One more ${s.label}`} onClick={() => dispatch(setSizeQty({ key: line.key, label: s.label, qty: s.qty + 1 }))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-sand-200">+</button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {mode === 'sizes' && (
                <p className={cn('mt-2 text-xs', units >= line.moq ? 'text-zellige-500' : 'text-terracotta-600')}>
                  {units} of {line.moq} minimum
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                dispatch(removeLine(line.key));
                trackEvent({ type: 'list_remove', productId: line.productId, label: line.name });
              }}
              className="self-start text-xs text-ink-soft hover:text-terracotta-500"
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Shown when nothing has been added yet. */
export function EmptyList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
      <img src="/brand/logo.png" alt="" width={96} height={96} className="mx-auto h-24 w-24" />
      <p className="mt-3 font-display text-2xl">Your list is empty</p>
      <p className="mt-1 text-sm text-ink-soft">Add styles from the collection, then send one enquiry for all of them.</p>
      <Link href="/collections" onClick={onNavigate} className="btn-line mt-6 inline-block rounded-full px-6 py-3 text-sm">
        Browse the collection
      </Link>
    </div>
  );
}
