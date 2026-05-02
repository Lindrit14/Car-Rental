import { apiFetch } from "./client";
import type { CurrencyConvertResponse, CurrencyMetadataResponse } from "../types";

export function convertCurrency(amount: number, from: string, to: string): Promise<CurrencyConvertResponse> {
  const params = new URLSearchParams({ amount: String(amount), from, to });
  return apiFetch<CurrencyConvertResponse>(`/api/currency/convert?${params}`);
}

export function getCurrencies(): Promise<string[]> {
  return apiFetch<string[]>("/api/currency/currencies");
}

export function getCurrencyMetadata(): Promise<CurrencyMetadataResponse> {
  return apiFetch<CurrencyMetadataResponse>("/api/currency/metadata");
}
