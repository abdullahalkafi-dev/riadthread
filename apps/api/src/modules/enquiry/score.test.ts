import { describe, expect, it } from 'vitest';
import { scoreLead } from './score';

describe('scoreLead', () => {
  it('rates a large distributor enquiry as hot and explains why', () => {
    const s = scoreLead({ itemCount: 5, qtyTotal: 300, businessType: 'Distributor' });
    expect(s.level).toBe('hot');
    expect(s.factors).toContain('5 products requested');
    expect(s.factors).toContain('Distributor');
  });

  it('rates a single small enquiry as cold', () => {
    const s = scoreLead({ itemCount: 1, qtyTotal: 12 });
    expect(s.level).toBe('cold');
  });

  it('does not penalise a visitor who declined tracking', () => {
    const base = { itemCount: 3, qtyTotal: 60, businessType: 'Boutique' };
    const withoutJourney = scoreLead(base);
    const withJourney = scoreLead({
      ...base,
      journey: [{ t: 'Fez Chiffon Djellaba', m: '2m, watched video' }],
    });
    expect(withoutJourney.level).toBe('warm');
    expect(withJourney.points).toBeGreaterThan(withoutJourney.points);
  });

  it('uses the typed estimate when it is larger than the requested units', () => {
    const s = scoreLead({ itemCount: 0, qtyTotal: 0, estimatedQty: 250 });
    expect(s.factors).toContain('250 units');
  });
});
