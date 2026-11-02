import type { Application, OfferDetails } from '@/types';
import { annualize, convert, normalizeCurrency } from './currency';

/**
 * India — new tax regime (Budget 2025 slabs, the default regime from FY 2025-26).
 * Update these constants when the slabs change.
 */
export const INDIA_TAX = {
  label: 'New regime (Budget 2025 slabs)',
  standardDeduction: 75_000,
  rebateLimit: 1_200_000,
  slabs: [
    { upTo: 400_000, rate: 0 },
    { upTo: 800_000, rate: 0.05 },
    { upTo: 1_200_000, rate: 0.1 },
    { upTo: 1_600_000, rate: 0.15 },
    { upTo: 2_000_000, rate: 0.2 },
    { upTo: 2_400_000, rate: 0.25 },
    { upTo: Infinity, rate: 0.3 },
  ],
  surcharge: [
    { above: 20_000_000, rate: 0.25 },
    { above: 10_000_000, rate: 0.15 },
    { above: 5_000_000, rate: 0.1 },
  ],
  cess: 0.04,
  professionalTax: 2_400,
  pfRate: 0.12,
};

/** Income tax + surcharge + cess on taxable income (after the standard deduction). */
export function indiaTax(taxable: number): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const slab of INDIA_TAX.slabs) {
    if (taxable > lower) tax += (Math.min(taxable, slab.upTo) - lower) * slab.rate;
    lower = slab.upTo;
  }
  // Section 87A rebate, with marginal relief just above the limit
  if (taxable <= INDIA_TAX.rebateLimit) tax = 0;
  else tax = Math.min(tax, taxable - INDIA_TAX.rebateLimit);

  const s = INDIA_TAX.surcharge.find((x) => taxable > x.above);
  const surcharge = s ? tax * s.rate : 0;
  return Math.round((tax + surcharge) * (1 + INDIA_TAX.cess));
}

export function defaultOfferDetails(app: Application): OfferDetails {
  const lo = app.salaryMin ?? app.salaryMax;
  const hi = app.salaryMax ?? app.salaryMin;
  const base = lo && hi && !app.salaryUndisclosed ? Math.round(annualize(hi, app.salaryPeriod, app.hoursPerWeek)) : null;
  return {
    base,
    bonus: null,
    joiningBonus: null,
    stocks: null,
    other: null,
    basicPercent: 50,
    pf: normalizeCurrency(app.currency) === 'INR' && app.salaryPeriod === 'yearly',
    foreignTaxPercent: null,
    notes: '',
  };
}

export interface OfferBreakdown {
  currency: string;
  isIndia: boolean;
  ctc: number;
  fixed: number;
  variable: number;
  joining: number;
  stocks: number;
  other: number;
  employeePf: number;
  tax: number;
  professionalTax: number;
  /** Monthly take-home from fixed pay only */
  monthlyInHand: number;
  /** Cash received in the first year: fixed + bonus + joining − tax − PF − PT */
  firstYearCash: number;
  /** firstYearCash + stocks + PF savings + other benefits */
  firstYearValue: number;
  /** Effective tax rate on cash pay */
  effectiveTaxRate: number;
}

export function computeOffer(app: Application, d: OfferDetails = app.offerDetails ?? defaultOfferDetails(app)): OfferBreakdown {
  const currency = normalizeCurrency(app.currency);
  const isIndia = currency === 'INR';
  const fixed = d.base ?? 0;
  const variable = d.bonus ?? 0;
  const joining = d.joiningBonus ?? 0;
  const stocks = d.stocks ?? 0;
  const other = d.other ?? 0;
  const employeePf = d.pf ? Math.round(fixed * (d.basicPercent / 100) * INDIA_TAX.pfRate) : 0;
  const cash = fixed + variable + joining;

  let tax: number;
  let taxOnFixed: number;
  let professionalTax = 0;
  if (isIndia) {
    tax = indiaTax(cash - INDIA_TAX.standardDeduction);
    taxOnFixed = indiaTax(fixed - INDIA_TAX.standardDeduction);
    professionalTax = fixed > 0 ? INDIA_TAX.professionalTax : 0;
  } else {
    const rate = (d.foreignTaxPercent ?? 0) / 100;
    tax = Math.round(cash * rate);
    taxOnFixed = Math.round(fixed * rate);
  }

  const monthlyInHand = Math.max(0, Math.round((fixed - taxOnFixed - employeePf - professionalTax) / 12));
  const firstYearCash = Math.max(0, cash - tax - employeePf - professionalTax);
  return {
    currency,
    isIndia,
    ctc: fixed + variable + stocks + other,
    fixed,
    variable,
    joining,
    stocks,
    other,
    employeePf,
    tax,
    professionalTax,
    monthlyInHand,
    firstYearCash,
    firstYearValue: firstYearCash + stocks + employeePf + other,
    effectiveTaxRate: cash ? tax / cash : 0,
  };
}

/** Convert every money field of a breakdown into another currency. */
export function convertBreakdown(b: OfferBreakdown, to: string): OfferBreakdown {
  if (b.currency === to) return b;
  const c = (n: number) => Math.round(convert(n, b.currency, to));
  return {
    ...b,
    currency: to,
    ctc: c(b.ctc),
    fixed: c(b.fixed),
    variable: c(b.variable),
    joining: c(b.joining),
    stocks: c(b.stocks),
    other: c(b.other),
    employeePf: c(b.employeePf),
    tax: c(b.tax),
    professionalTax: c(b.professionalTax),
    monthlyInHand: c(b.monthlyInHand),
    firstYearCash: c(b.firstYearCash),
    firstYearValue: c(b.firstYearValue),
  };
}
