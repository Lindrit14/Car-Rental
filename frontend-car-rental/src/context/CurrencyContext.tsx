import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { convertCurrency, getCurrencies } from "../api/currency";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  currencies: string[];
  rate: number | null;
  formatPrice: (usdAmount: number, options?: { maximumFractionDigits?: number }) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const STORAGE_KEY = "preferredCurrency";
const FALLBACK_CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY"];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "USD";
  });
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [fetchedRate, setFetchedRate] = useState<{ currency: string; rate: number } | null>(null);

  useEffect(() => {
    getCurrencies()
      .then((list) => setCurrencies(list.length > 0 ? list : FALLBACK_CURRENCIES))
      .catch(() => setCurrencies(FALLBACK_CURRENCIES));
  }, []);

  useEffect(() => {
    if (currency === "USD") {
      return;
    }
    let cancelled = false;
    convertCurrency(1, "USD", currency)
      .then((res) => {
        if (cancelled) return;
        const nextRate = res.convertedAmount > 0 ? res.convertedAmount : res.exchangeRate;
        if (nextRate && nextRate > 0) {
          setFetchedRate({ currency: res.toCurrency, rate: nextRate });
        } else {
          console.warn("Currency convert returned no usable rate", res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Currency convert failed", err);
          setFetchedRate(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const rate =
    currency === "USD"
      ? 1
      : fetchedRate?.currency === currency
        ? fetchedRate.rate
        : null;

  const setCurrency = useCallback((next: string) => {
    localStorage.setItem(STORAGE_KEY, next);
    setCurrencyState(next);
  }, []);

  const formatPrice = useCallback(
    (usdAmount: number, options?: { maximumFractionDigits?: number }) => {
      if (rate === null) return "…";
      const converted = usdAmount * rate;
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        }).format(converted);
      } catch {
        return `${currency} ${converted.toFixed(options?.maximumFractionDigits ?? 2)}`;
      }
    },
    [currency, rate]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, currencies, rate, formatPrice }),
    [currency, setCurrency, currencies, rate, formatPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
