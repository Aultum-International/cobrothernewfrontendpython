import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { currencyAPI } from '../api/services';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import {
  mergeCurrencyMeta,
  formatInrAsCurrency,
  convertInrAmount,
  getCurrencySymbol,
} from '../utils/currencyDisplay';

const STORAGE_KEY = 'cobrother_currency';
const DEFAULT_CURRENCY = 'INR';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const code = (saved || DEFAULT_CURRENCY).toUpperCase();
      return SUPPORTED_CURRENCIES.includes(code) ? code : DEFAULT_CURRENCY;
    } catch {
      return DEFAULT_CURRENCY;
    }
  });
  const [meta, setMeta] = useState(() => mergeCurrencyMeta());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    currencyAPI
      .getSupported()
      .then(({ data }) => {
        const next = {};
        (data?.currencies || []).forEach((row) => {
          if (row?.code && row.symbol != null) {
            next[row.code.toUpperCase()] = {
              symbol: row.symbol,
              rateFromInr: Number(row.rateFromInr) || undefined,
            };
          }
        });
        if (Object.keys(next).length > 0) {
          setMeta(mergeCurrencyMeta(next));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setCurrency = useCallback((code) => {
    const upper = (code || DEFAULT_CURRENCY).toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(upper)) return;
    setSelectedCurrencyState(upper);
    try {
      localStorage.setItem(STORAGE_KEY, upper);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const convertFromInr = useCallback(
    (inrAmount) => convertInrAmount(inrAmount, selectedCurrency, meta),
    [selectedCurrency, meta],
  );

  const formatPrice = useCallback(
    (inrAmount) => {
      try {
        if (inrAmount == null || inrAmount === '') return formatInrAsCurrency(0, selectedCurrency, meta);
        return formatInrAsCurrency(inrAmount, selectedCurrency, meta);
      } catch {
        try {
          return formatInrAsCurrency(inrAmount, DEFAULT_CURRENCY, mergeCurrencyMeta());
        } catch {
          return '₹0';
        }
      }
    },
    [selectedCurrency, meta],
  );

  const formatMajor = useCallback(
    (amount, code = selectedCurrency) => {
      const sym = getCurrencySymbol(code, meta);
      const amt = Number(amount);
      if (!Number.isFinite(amt)) return `${sym}0`;
      return `${sym}${amt.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [selectedCurrency, meta],
  );

  const getSymbol = useCallback(
    (code = selectedCurrency) => getCurrencySymbol(code, meta),
    [selectedCurrency, meta],
  );

  const supportedCurrencies = SUPPORTED_CURRENCIES;

  const value = useMemo(
    () => ({
      currency: selectedCurrency,
      selectedCurrency,
      setCurrency,
      setSelectedCurrency: setCurrency,
      symbol: getCurrencySymbol(selectedCurrency, meta),
      formatPrice,
      formatMajor,
      getSymbol,
      convertFromInr,
      supportedCurrencies,
      loaded,
    }),
    [selectedCurrency, setCurrency, meta, formatPrice, formatMajor, getSymbol, convertFromInr, loaded],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}

export default useCurrency;
