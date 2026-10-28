import type { SalaryPeriod } from '@/types';

/** Units of each currency per 1 USD. Static reference rates — good enough for comparing offers. */
export const RATES_PER_USD: Record<string, number> = {
  USD: 1,
  INR: 84.5,
  EUR: 0.92,
  GBP: 0.77,
  AED: 3.6725,
  AUD: 1.53,
  CAD: 1.38,
  SGD: 1.32,
  JPY: 152,
  KRW: 1380,
  CNY: 7.15,
};

export const CURRENCIES = Object.keys(RATES_PER_USD);

const SYMBOL_ALIASES: Record<string, string> = {
  $: 'USD',
  '₹': 'INR',
  RS: 'INR',
  'RS.': 'INR',
  '£': 'GBP',
  '€': 'EUR',
  'A$': 'AUD',
  'C$': 'CAD',
  'S$': 'SGD',
  '₩': 'KRW',
  '¥': 'JPY',
};

export function normalizeCurrency(raw: string | null | undefined): string {
  if (!raw) return 'INR';
  const clean = raw.trim().toUpperCase();
  if (clean in RATES_PER_USD) return clean;
  return SYMBOL_ALIASES[clean] ?? 'USD';
}

export function convert(amount: number, from: string, to: string): number {
  const f = RATES_PER_USD[normalizeCurrency(from)] ?? 1;
  const t = RATES_PER_USD[normalizeCurrency(to)] ?? 1;
  return (amount / f) * t;
}

/** Convert a pay figure into an annual amount so different periods can be compared. */
export function annualize(amount: number, period: SalaryPeriod, hoursPerWeek = 40): number {
  if (period === 'monthly') return amount * 12;
  if (period === 'hourly') return amount * hoursPerWeek * 52;
  return amount;
}

/**
 * Compact money formatting. INR uses lakh / crore notation (₹12.5L, ₹1.2Cr),
 * everything else uses k / M.
 */
export function formatMoney(amount: number, currency: string, opts: { compact?: boolean } = {}): string {
  const code = normalizeCurrency(currency);
  const compact = opts.compact ?? true;

  if (code === 'INR' && compact) {
    if (amount >= 1e7) return `₹${trim(amount / 1e7)}Cr`;
    if (amount >= 1e5) return `₹${trim(amount / 1e5)}L`;
    if (amount >= 1e3) return `₹${trim(amount / 1e3)}k`;
    return `₹${Math.round(amount)}`;
  }

  return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: code,
    notation: compact && amount >= 1e4 ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(amount);
}

function trim(n: number): string {
  return n.toFixed(n >= 100 ? 0 : 1).replace(/\.0$/, '');
}

export function formatRange(
  min: number | null,
  max: number | null,
  currency: string,
): string | null {
  const lo = min || null;
  const hi = max || null;
  if (!lo && !hi) return null;
  if (lo && hi && lo !== hi) return `${formatMoney(lo, currency)} – ${formatMoney(hi, currency)}`;
  return formatMoney((lo ?? hi)!, currency);
}
