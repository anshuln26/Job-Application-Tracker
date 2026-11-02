import { describe, expect, it } from 'vitest';
import { computeOffer, indiaTax } from '@/lib/tax';
import { emptyApplication } from '@/data/mappers';
import type { Application } from '@/types';

const app = (over: Partial<Application> = {}): Application => ({
  ...emptyApplication({ company: 'Acme', title: 'SWE', currency: 'INR' }),
  id: '1',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('India new-regime tax', () => {
  it('is zero up to ₹12L taxable thanks to the 87A rebate', () => {
    expect(indiaTax(1_200_000)).toBe(0);
    expect(indiaTax(0)).toBe(0);
  });

  it('applies marginal relief just above ₹12L', () => {
    // slab tax 63,750 but relief caps it at the 25,000 excess; + 4% cess
    expect(indiaTax(1_225_000)).toBe(26_000);
  });

  it('applies slabs and cess', () => {
    // 20k + 40k + 60k + 65k = 1,85,000 + 4% cess
    expect(indiaTax(1_925_000)).toBe(192_400);
  });

  it('adds surcharge above ₹50L', () => {
    const base = indiaTax(5_000_000);
    expect(indiaTax(5_000_001)).toBeGreaterThan(base * 1.09);
  });
});

describe('offer breakdown', () => {
  it('computes in-hand pay for an Indian offer', () => {
    const b = computeOffer(
      app(),
      { base: 2_000_000, bonus: 200_000, joiningBonus: 100_000, stocks: 300_000, other: 0, basicPercent: 50, pf: true, foreignTaxPercent: null, notes: '' },
    );
    expect(b.ctc).toBe(2_500_000);
    expect(b.employeePf).toBe(120_000);
    expect(b.tax).toBe(indiaTax(2_300_000 - 75_000));
    expect(b.monthlyInHand).toBe(Math.round((2_000_000 - indiaTax(1_925_000) - 120_000 - 2_400) / 12));
    expect(b.firstYearValue).toBe(b.firstYearCash + 300_000 + 120_000);
  });

  it('uses a flat estimate for non-INR offers', () => {
    const b = computeOffer(
      app({ currency: 'USD' }),
      { base: 150_000, bonus: 0, joiningBonus: 0, stocks: 0, other: 0, basicPercent: 50, pf: false, foreignTaxPercent: 30, notes: '' },
    );
    expect(b.isIndia).toBe(false);
    expect(b.tax).toBe(45_000);
    expect(b.monthlyInHand).toBe(8_750);
  });

  it('derives defaults from the salary range', () => {
    const b = computeOffer(app({ salaryMin: 50_000, salaryMax: 60_000, salaryPeriod: 'monthly' }));
    expect(b.fixed).toBe(720_000);
    expect(b.tax).toBe(0);
  });
});
