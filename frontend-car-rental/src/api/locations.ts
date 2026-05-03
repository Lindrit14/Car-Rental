import { apiFetch } from "./client";

export type LocationType = "airport" | "capital" | "bus_terminal";

export interface Location {
  id: string;
  displayName: string;
  type: LocationType;
  city: string;
  country: string;
  iata?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  enriched: boolean;
}

let cache: Promise<Location[]> | null = null;

export function getLocations(): Promise<Location[]> {
  if (!cache) {
    cache = apiFetch<Location[]>("/api/locations").catch((err) => {
      cache = null;
      throw err;
    });
  }
  return cache;
}

export function isCanonicalLocation(value: string, items: Location[]): boolean {
  return items.some((l) => l.displayName === value);
}
