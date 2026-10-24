// Currency utilities and exchange rates for CareerTrack Pro
// Specially optimized for Indian tech applicants applying domestically (INR) and globally (USD, EUR, GBP, AED, etc.)
// Supports Yearly (Annual CTC), Monthly (Internship Stipend / Monthly Salary), and Hourly (Freelance/Contract)

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

export const SALARY_PERIODS = [
  { id: 'yearly', label: 'Yearly (Annual CTC)', unit: '/ yr', badge: 'Annual' },
  { id: 'monthly', label: 'Monthly Stipend / Salary (Intern/Contract)', unit: '/ mo', badge: 'Monthly' },
  { id: 'hourly', label: 'Hourly Rate (Contract/Remote)', unit: '/ hr', badge: 'Hourly' }
];

/**
 * Normalizes any legacy or freeform currency input into an official 3-letter code.
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
  if (toCurr === 'native') return num;
  
  const from = normalizeCurrencyCode(fromCurr);
  const to = normalizeCurrencyCode(toCurr);
  if (from === to) return num;

  const fromRate = EXCHANGE_RATES_TO_USD[from] || 1;
  const toRate = EXCHANGE_RATES_TO_USD[to] || 1;

  const inUSD = num / fromRate;
  const converted = inUSD * toRate;
  return Math.round(converted);
};

/**
 * Annualizes any salary (monthly * 12, hourly * hoursPerWeek * 52)
 */
export const annualizeSalary = (amount, period = 'yearly', hoursPerWeek = 40) => {
  const num = Number(amount) || 0;
  if (num <= 0) return 0;
  if (period === 'monthly') return num * 12;
  if (period === 'hourly') return num * (Number(hoursPerWeek) || 40) * 52;
  return num;
};

/**
 * Converts any salary to monthly equivalent (yearly / 12, hourly * hoursPerWeek * 4.333)
 */
export const monthlyizeSalary = (amount, period = 'yearly', hoursPerWeek = 40) => {
  const num = Number(amount) || 0;
  if (num <= 0) return 0;
  if (period === 'monthly') return num;
  if (period === 'hourly') return Math.round(num * (Number(hoursPerWeek) || 40) * 4.333);
  return Math.round(num / 12);
};

/**
 * Formats a single salary number nicely according to currency conventions and period.
 */
export const formatSingleSalary = (amount, currency = 'INR', period = 'yearly', compact = true) => {
  const num = Number(amount);
  if (!num || isNaN(num) || num <= 0) return 'N/A';
  const curr = currency === 'native' ? 'INR' : normalizeCurrencyCode(currency);
  const symbol = curr === 'USD' ? '$' : (SUPPORTED_CURRENCIES.find(c => c.code === curr)?.symbol || (curr === 'INR' ? '₹' : curr));

  if (period === 'monthly') {
    if (curr === 'INR') {
      if (num >= 100000) {
        const l = num / 100000;
        return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L / mo`;
      }
      return `₹${Math.round(num).toLocaleString('en-IN')} / mo`;
    }
    return `${symbol}${Math.round(num).toLocaleString()} / mo`;
  }

  if (period === 'hourly') {
    if (curr === 'INR') {
      return `₹${Math.round(num).toLocaleString('en-IN')} / hr`;
    }
    return `${symbol}${Math.round(num)} / hr`;
  }

  // Yearly (default)
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
 * Fully supports Yearly, Monthly (Stipend), and Hourly rates, plus Native mode!
 */
export const formatSalaryRange = (min, max, fromCurr = 'USD', targetCurr = 'INR', period = 'yearly', hoursPerWeek = 40) => {
  const minNum = Number(min) || 0;
  const maxNum = Number(max) || 0;

  if (maxNum <= 0 && minNum <= 0) {
    return {
      formatted: 'Not Disclosed',
      original: '',
      isConverted: false,
      fromCurrency: fromCurr,
      targetCurrency: targetCurr,
      period: period || 'yearly',
      convertedMin: 0,
      convertedMax: 0
    };
  }

  const isNative = targetCurr === 'native';
  const from = normalizeCurrencyCode(fromCurr);
  const target = isNative ? from : normalizeCurrencyCode(targetCurr);

  const convMin = isNative ? minNum : convertSalary(minNum, from, target);
  const convMax = isNative ? maxNum : convertSalary(maxNum, from, target);

  let targetStr = '';
  let originalStr = '';
  const isConverted = !isNative && from !== target;
  const targetSym = target === 'USD' ? '$' : (SUPPORTED_CURRENCIES.find(c => c.code === target)?.symbol || (target === 'INR' ? '₹' : `${target} `));
  const origSym = from === 'USD' ? '$' : (SUPPORTED_CURRENCIES.find(c => c.code === from)?.symbol || (from === 'INR' ? '₹' : `${from} `));

  if (period === 'monthly') {
    // Monthly format (e.g., ₹60,000 / mo or $710 / mo)
    if (target === 'INR') {
      if (convMax >= 100000) {
        const minL = (convMin / 100000).toFixed(convMin % 100000 === 0 ? 0 : 1);
        const maxL = (convMax / 100000).toFixed(convMax % 100000 === 0 ? 0 : 1);
        targetStr = convMin === convMax ? `₹${maxL}L / mo` : `₹${minL}L - ₹${maxL}L / mo`;
      } else {
        targetStr = convMin === convMax
          ? `₹${convMax.toLocaleString('en-IN')} / mo`
          : `₹${convMin.toLocaleString('en-IN')} - ₹${convMax.toLocaleString('en-IN')} / mo`;
      }
    } else {
      targetStr = convMin === convMax
        ? `${targetSym}${Math.round(convMax).toLocaleString()} / mo`
        : `${targetSym}${Math.round(convMin).toLocaleString()} - ${targetSym}${Math.round(convMax).toLocaleString()} / mo`;
    }

    if (isConverted) {
      if (from === 'INR') {
        originalStr = minNum === maxNum
          ? `₹${maxNum.toLocaleString('en-IN')} / mo`
          : `₹${minNum.toLocaleString('en-IN')} - ₹${maxNum.toLocaleString('en-IN')} / mo`;
      } else {
        originalStr = minNum === maxNum
          ? `${origSym}${Math.round(maxNum).toLocaleString()} / mo`
          : `${origSym}${Math.round(minNum).toLocaleString()} - ${origSym}${Math.round(maxNum).toLocaleString()} / mo`;
      }
    }
  } else if (period === 'hourly') {
    // Hourly format
    const hrsSuffix = hoursPerWeek ? ` (${hoursPerWeek}h/wk)` : '';
    if (target === 'INR') {
      targetStr = convMin === convMax
        ? `₹${convMax.toLocaleString('en-IN')}/hr${hrsSuffix}`
        : `₹${convMin.toLocaleString('en-IN')} - ₹${convMax.toLocaleString('en-IN')}/hr${hrsSuffix}`;
    } else {
      targetStr = convMin === convMax
        ? `${targetSym}${Math.round(convMax)}/hr${hrsSuffix}`
        : `${targetSym}${Math.round(convMin)} - ${targetSym}${Math.round(convMax)}/hr${hrsSuffix}`;
    }

    if (isConverted) {
      if (from === 'INR') {
        originalStr = minNum === maxNum
          ? `₹${maxNum.toLocaleString('en-IN')}/hr`
          : `₹${minNum.toLocaleString('en-IN')} - ₹${maxNum.toLocaleString('en-IN')}/hr`;
      } else {
        originalStr = minNum === maxNum
          ? `${origSym}${Math.round(maxNum)}/hr`
          : `${origSym}${Math.round(minNum)} - ${origSym}${Math.round(maxNum)}/hr`;
      }
    }
  } else {
    // Yearly format (Annual CTC)
    if (target === 'INR') {
      if (convMax >= 10000000) {
        const minCr = (convMin / 10000000).toFixed(1);
        const maxCr = (convMax / 10000000).toFixed(1);
        targetStr = convMin === convMax ? `₹${maxCr} Cr` : `₹${minCr} - ₹${maxCr} Cr`;
      } else if (convMax >= 100000) {
        const minL = (convMin / 100000).toFixed(convMin % 100000 === 0 ? 0 : 1);
        const maxL = (convMax / 100000).toFixed(convMax % 100000 === 0 ? 0 : 1);
        targetStr = convMin === convMax ? `₹${maxL}L` : `₹${minL}L - ₹${maxL}L`;
      } else {
        targetStr = convMin === convMax
          ? `₹${convMax.toLocaleString('en-IN')}`
          : `₹${convMin.toLocaleString('en-IN')} - ₹${convMax.toLocaleString('en-IN')}`;
      }
    } else {
      if (convMax >= 1000000) {
        const minM = (convMin / 1000000).toFixed(1);
        const maxM = (convMax / 1000000).toFixed(1);
        targetStr = convMin === convMax ? `${targetSym}${maxM}M` : `${targetSym}${minM}M - ${targetSym}${maxM}M`;
      } else if (convMax >= 1000) {
        targetStr = convMin === convMax
          ? `${targetSym}${Math.round(convMax / 1000)}k`
          : `${targetSym}${Math.round(convMin / 1000)}k - ${targetSym}${Math.round(convMax / 1000)}k`;
      } else {
        targetStr = convMin === convMax ? `${targetSym}${convMax}` : `${targetSym}${convMin} - ${targetSym}${convMax}`;
      }
    }

    if (isConverted) {
      if (from === 'INR') {
        const origMinL = (minNum / 100000).toFixed(minNum % 100000 === 0 ? 0 : 1);
        const origMaxL = (maxNum / 100000).toFixed(maxNum % 100000 === 0 ? 0 : 1);
        originalStr = minNum === maxNum ? `₹${origMaxL}L` : `₹${origMinL}L - ₹${origMaxL}L`;
      } else if (maxNum >= 1000000) {
        const origMinM = (minNum / 1000000).toFixed(1);
        const origMaxM = (maxNum / 1000000).toFixed(1);
        originalStr = minNum === maxNum ? `${origSym}${origMaxM}M` : `${origSym}${origMinM}M - ${origSym}${origMaxM}M`;
      } else {
        originalStr = minNum === maxNum
          ? `${origSym}${Math.round(maxNum / 1000)}k`
          : `${origSym}${Math.round(minNum / 1000)}k - ${origSym}${Math.round(maxNum / 1000)}k`;
      }
    }
  }

  return {
    formatted: targetStr,
    original: originalStr,
    isConverted,
    fromCurrency: from,
    targetCurrency: isNative ? 'native' : target,
    period: period || 'yearly',
    convertedMin: convMin,
    convertedMax: convMax
  };
};
