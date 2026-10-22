// Currency utilities and exchange rates for CareerTrack Pro
// Specially optimized for Indian tech applicants applying domestically (INR) and globally (USD, EUR, GBP, AED, etc.)

export const EXCHANGE_RATES_TO_USD = {
  USD: 1.0,
  INR: 84.50, // 1 USD = 84.50 INR
  EUR: 0.92,  // 1 USD = 0.92 EUR (1 EUR ≈ 91.85 INR)
  GBP: 0.77,  // 1 USD = 0.77 GBP (1 GBP ≈ 109.74 INR)
  AED: 3.6725,// 1 USD = 3.6725 AED (1 AED ≈ 23.01 INR)
  AUD: 1.53,  // 1 USD = 1.53 AUD (1 AUD ≈ 55.23 INR)
  CAD: 1.38,  // 1 USD = 1.38 CAD (1 CAD ≈ 61.23 INR)
  SGD: 1.32,  // 1 USD = 1.32 SGD (1 SGD ≈ 64.01 INR)
  JPY: 152.0, // 1 USD = 152 JPY (100 JPY ≈ 55.6 INR)
  KRW: 1380.0,// 1 USD = 1380 KRW (1000 KRW ≈ 61.2 INR)
  CNY: 7.15   // 1 USD = 7.15 CNY (1 CNY ≈ 11.82 INR)
};

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹ - Indian Rupee / LPA)', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', label: 'USD ($ - US Dollar)', flag: '🇺🇸' },
  { code: 'AED', symbol: 'AED', label: 'AED (د.إ - UAE Dirham)', flag: '🇦🇪' },
  { code: 'GBP', symbol: '£', label: 'GBP (£ - British Pound)', flag: '🇬🇧' },
  { code: 'EUR', symbol: '€', label: 'EUR (€ - Euro)', flag: '🇪🇺' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$ - Australian Dollar)', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$ - Canadian Dollar)', flag: '🇨🇦' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$ - Singapore Dollar)', flag: '🇸🇬' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥ - Japanese Yen)', flag: '🇯🇵' },
  { code: 'KRW', symbol: '₩', label: 'KRW (₩ - South Korean Won)', flag: '🇰🇷' },
  { code: 'CNY', symbol: '¥', label: 'CNY (¥ - Chinese Yuan)', flag: '🇨🇳' }
];

/**
 * Normalizes any legacy or freeform currency input (e.g. '$', '₹', 'INR', 'usd') into an official 3-letter code.
 */
export const normalizeCurrencyCode = (raw) => {
  if (!raw) return 'INR';
  const clean = String(raw).trim().toUpperCase();
  if (clean === '$' || clean === 'USD') return 'USD';
  if (clean === '₹' || clean === 'INR' || clean === 'RS' || clean === 'RS.' || clean === 'INR ₹') return 'INR';
  if (clean === '£' || clean === 'GBP') return 'GBP';
  if (clean === '€' || clean === 'EUR') return 'EUR';
  if (clean === 'AED' || clean === 'د.إ') return 'AED';
  if (clean === 'AUD' || clean === 'A$') return 'AUD';
  if (clean === 'CAD' || clean === 'C$') return 'CAD';
  if (clean === 'SGD' || clean === 'S$') return 'SGD';
  if (clean === 'JPY' || clean === '¥') return 'JPY';
  if (clean === 'KRW' || clean === '₩') return 'KRW';
  if (clean === 'CNY') return 'CNY';
  return clean in EXCHANGE_RATES_TO_USD ? clean : 'USD';
};

/**
 * Converts an amount from one currency to another using the exchange rates table.
 */
export const convertSalary = (amount, fromCurr = 'USD', toCurr = 'INR') => {
  const num = Number(amount);
  if (!num || isNaN(num) || num <= 0) return 0;
  
  const from = normalizeCurrencyCode(fromCurr);
  const to = normalizeCurrencyCode(toCurr);
  if (from === to) return num;

  const fromRate = EXCHANGE_RATES_TO_USD[from] || 1;
  const toRate = EXCHANGE_RATES_TO_USD[to] || 1;

  // Convert to USD first, then to target currency
  const inUSD = num / fromRate;
  const converted = inUSD * toRate;
  return Math.round(converted);
};

/**
 * Formats a single salary number nicely according to currency conventions.
 * In INR: formats as Lakhs (LPA) or Crores (Cr)
 * In USD: formats as $k or $M
 */
export const formatSingleSalary = (amount, currency = 'INR', compact = true) => {
  const num = Number(amount);
  if (!num || isNaN(num) || num <= 0) return 'N/A';
  const curr = normalizeCurrencyCode(currency);

  if (curr === 'INR') {
    if (num >= 10000000) {
      const cr = num / 10000000;
      return `₹${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      const l = num / 100000;
      return compact ? `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L` : `₹${l.toFixed(1)} LPA`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  }

  const symbol = curr === 'USD' ? '$' : (SUPPORTED_CURRENCIES.find(c => c.code === curr)?.symbol || '$');
  if (num >= 1000000) {
    return `${symbol}${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${symbol}${Math.round(num / 1000)}k`;
  }
  return `${symbol}${num.toLocaleString()}`;
};

/**
 * Formats a salary range (min - max) converted to target display currency.
 * Also returns original format info for hover/subtext indications.
 */
export const formatSalaryRange = (min, max, fromCurr = 'USD', targetCurr = 'INR') => {
  const minNum = Number(min) || 0;
  const maxNum = Number(max) || 0;

  if (maxNum <= 0 && minNum <= 0) {
    return {
      formatted: 'Not Disclosed',
      original: '',
      isConverted: false,
      fromCurrency: fromCurr,
      targetCurrency: targetCurr,
      convertedMin: 0,
      convertedMax: 0
    };
  }

  const from = normalizeCurrencyCode(fromCurr);
  const target = normalizeCurrencyCode(targetCurr);

  const convMin = convertSalary(minNum, from, target);
  const convMax = convertSalary(maxNum, from, target);

  let targetStr = '';
  if (target === 'INR') {
    if (convMax >= 10000000) {
      const minCr = (convMin / 10000000).toFixed(1);
      const maxCr = (convMax / 10000000).toFixed(1);
      targetStr = `₹${minCr} - ₹${maxCr} Cr`;
    } else if (convMax >= 100000) {
      const minL = (convMin / 100000).toFixed(convMin % 100000 === 0 ? 0 : 1);
      const maxL = (convMax / 100000).toFixed(convMax % 100000 === 0 ? 0 : 1);
      targetStr = `₹${minL}L - ₹${maxL}L`;
    } else {
      targetStr = `₹${convMin.toLocaleString('en-IN')} - ₹${convMax.toLocaleString('en-IN')}`;
    }
  } else {
    const sym = target === 'USD' ? '$' : (SUPPORTED_CURRENCIES.find(c => c.code === target)?.symbol || '$');
    targetStr = `${sym}${Math.round(convMin / 1000)}k - ${sym}${Math.round(convMax / 1000)}k`;
  }

  const isConverted = from !== target;
  let originalStr = '';
  if (isConverted) {
    if (from === 'INR') {
      const origMinL = (minNum / 100000).toFixed(minNum % 100000 === 0 ? 0 : 1);
      const origMaxL = (maxNum / 100000).toFixed(maxNum % 100000 === 0 ? 0 : 1);
      originalStr = `₹${origMinL}L - ₹${origMaxL}L`;
    } else {
      const origSym = from === 'USD' ? '$' : (SUPPORTED_CURRENCIES.find(c => c.code === from)?.symbol || from);
      originalStr = `${origSym}${Math.round(minNum / 1000)}k - ${origSym}${Math.round(maxNum / 1000)}k`;
    }
  }

  return {
    formatted: targetStr,
    original: originalStr,
    isConverted,
    fromCurrency: from,
    targetCurrency: target,
    convertedMin: convMin,
    convertedMax: convMax
  };
};
