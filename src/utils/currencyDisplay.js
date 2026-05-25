import { DEFAULT_LISTING_CURRENCY } from '../constants/currencies';

const FALLBACK_META = {
  INR: { symbol: '₹', rateFromInr: 1 },
  USD: { symbol: '$', rateFromInr: 0.0118 },
  EUR: { symbol: '€', rateFromInr: 0.0109 },
  GBP: { symbol: '£', rateFromInr: 0.0094 },
  AED: { symbol: 'د.إ', rateFromInr: 0.0433 },
  SGD: { symbol: 'S$', rateFromInr: 0.0158 },
  AUD: { symbol: 'A$', rateFromInr: 0.0181 },
  CAD: { symbol: 'C$', rateFromInr: 0.0162 },
};

export function mergeCurrencyMeta(apiMeta = {}) {
  return { ...FALLBACK_META, ...apiMeta };
}

export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function convertInrAmount(inrAmount, currencyCode, meta = FALLBACK_META) {
  const m = meta && typeof meta === 'object' ? meta : FALLBACK_META;
  const inr = safeNumber(inrAmount, 0);
  const code = (currencyCode || DEFAULT_LISTING_CURRENCY).toUpperCase();
  if (code === 'INR') return inr;
  const rate = safeNumber(m[code]?.rateFromInr ?? FALLBACK_META[code]?.rateFromInr, 1);
  if (!rate) return inr;
  return Math.round(inr * rate * 100) / 100;
}

export function formatInrAsCurrency(inrAmount, currencyCode, meta = FALLBACK_META) {
  try {
    const code = (currencyCode || DEFAULT_LISTING_CURRENCY).toUpperCase();
    const safeMeta = meta && typeof meta === 'object' ? meta : FALLBACK_META;
    const amt = convertInrAmount(inrAmount, code, safeMeta);
    const sym = safeMeta[code]?.symbol ?? FALLBACK_META[code]?.symbol ?? `${code} `;
    if (!Number.isFinite(amt)) return `${sym}0`;
    const fractionDigits = Number.isInteger(amt) ? 0 : 2;
    try {
      return `${sym}${amt.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })}`;
    } catch {
      return `${sym}${amt}`;
    }
  } catch {
    const sym = FALLBACK_META.INR.symbol;
    const n = safeNumber(inrAmount, 0);
    return `${sym}${n}`;
  }
}

export function getCurrencySymbol(code, meta = FALLBACK_META) {
  const m = meta && typeof meta === 'object' ? meta : FALLBACK_META;
  const upper = (code || DEFAULT_LISTING_CURRENCY).toUpperCase();
  return m[upper]?.symbol ?? FALLBACK_META[upper]?.symbol ?? `${upper} `;
}

/**
 * Extra fields for purchase/create-order API bodies.
 * When backend is INR-only, send {} so unknown keys do not trigger 500s.
 * Flip to true once the API accepts `currency` (and optional converted amounts).
 */
export const BACKEND_ACCEPTS_ORDER_CURRENCY = false;

/** Optional currency for create-order — UI may still use selectedCurrency for display only. */
export function buildOrderCurrencyPayload(selectedCurrency) {
  if (!BACKEND_ACCEPTS_ORDER_CURRENCY) return {};
  const code = (selectedCurrency || DEFAULT_LISTING_CURRENCY).toUpperCase();
  if (code === DEFAULT_LISTING_CURRENCY) return {};
  return { currency: code };
}
