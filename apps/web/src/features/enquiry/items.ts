import type { EnquiryLine } from '@/store/site/enquiry.slice';
import type { EnquiryItemInput } from './useEnquirySubmission';

/** The part of the enquiry list the API needs: product, colour and units per size. */
export const linesToItems = (lines: EnquiryLine[]): EnquiryItemInput[] =>
  lines.map((line) => ({
    productId: line.productId,
    ...(line.colour ? { colour: line.colour } : {}),
    sizes: line.sizes.filter((s) => s.qty > 0).map((s) => ({ label: s.label, qty: s.qty })),
  }));

/**
 * Spreads a number of units over the sizes on offer, e.g. 12 over 5 sizes gives
 * 3, 3, 2, 2, 2. Used for "add the minimum" shortcuts where the visitor has not
 * chosen sizes yet.
 */
export function spreadUnits(labels: string[], units: number): Array<{ label: string; qty: number }> {
  if (labels.length === 0) return [];
  const base = Math.floor(units / labels.length);
  const extra = units % labels.length;
  return labels.map((label, i) => ({ label, qty: base + (i < extra ? 1 : 0) }));
}
