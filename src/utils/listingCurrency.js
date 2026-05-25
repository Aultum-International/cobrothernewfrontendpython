import { DEFAULT_LISTING_CURRENCY } from '../constants/currencies';

export function normalizeCurrencyCode(code) {
  return (code || DEFAULT_LISTING_CURRENCY).toString().trim().toUpperCase();
}

/**
 * Resolve listing currency from item (legacy listings without field → INR).
 */
export function getListingCurrency(item, currencyField = 'currency') {
  if (!item) return DEFAULT_LISTING_CURRENCY;
  if (typeof currencyField === 'function') {
    return normalizeCurrencyCode(currencyField(item));
  }
  const val = String(currencyField).includes('.')
    ? String(currencyField).split('.').reduce((acc, key) => acc?.[key], item)
    : item[currencyField];
  return normalizeCurrencyCode(val);
}

export function filterByListingCurrency(items, selectedCurrency, currencyField = 'currency') {
  const selected = normalizeCurrencyCode(selectedCurrency);
  return (items || []).filter(
    (item) => getListingCurrency(item, currencyField) === selected,
  );
}
