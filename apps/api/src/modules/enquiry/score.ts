import type { LeadLevel } from '@riad/shared';

/** Bump this when the rules change, so old scores stay explainable. */
export const SCORE_RULE_VERSION = 1;

export interface ScoreInput {
  itemCount: number;
  /** Units across all requested products. */
  qtyTotal: number;
  /** Quantity the retailer typed into the form, if any. */
  estimatedQty?: number | undefined;
  businessType?: string | undefined;
  /** Only present when the visitor accepted tracking. */
  journey?: Array<{ t: string; m?: string | undefined }> | undefined;
}

export interface Score {
  rule: number;
  level: LeadLevel;
  points: number;
  factors: string[];
}

/**
 * Simple, transparent lead score. Every point comes with a plain-language
 * reason, so the dashboard can always show why a lead is hot, warm or cold.
 * Missing tracking never lowers a score: journey factors are simply absent.
 */
export function scoreLead(input: ScoreInput): Score {
  let points = 0;
  const factors: string[] = [];
  const add = (n: number, reason: string) => {
    points += n;
    factors.push(reason);
  };

  if (input.itemCount >= 4) add(2, `${input.itemCount} products requested`);
  else if (input.itemCount >= 2) add(1, `${input.itemCount} products requested`);
  else if (input.itemCount === 1) factors.push('1 product requested');

  const units = Math.max(input.qtyTotal, input.estimatedQty ?? 0);
  if (units >= 200) add(3, `${units} units`);
  else if (units >= 100) add(2, `${units} units`);
  else if (units >= 48) add(1, `${units} units`);
  else if (units > 0) factors.push(`${units} units`);

  const type = input.businessType;
  if (type === 'Distributor') add(2, 'Distributor');
  else if (type === 'Boutique' || type === 'Online store' || type === 'Mosque or centre shop') add(1, type);

  const journey = input.journey ?? [];
  if (journey.some((s) => /watched video/i.test(s.m ?? ''))) add(1, 'Watched a product video');
  const pages = new Set(journey.filter((s) => !/^(home|enquiry|enquiry list|landed)/i.test(s.t)).map((s) => s.t));
  if (pages.size >= 3) add(1, `Looked at ${pages.size} pages before enquiring`);

  const level: LeadLevel = points >= 5 ? 'hot' : points >= 3 ? 'warm' : 'cold';
  return { rule: SCORE_RULE_VERSION, level, points, factors };
}
