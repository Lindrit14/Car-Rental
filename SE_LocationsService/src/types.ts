export type LocationType = "airport" | "capital" | "bus_terminal";

export interface Location {
  id: string;
  displayName: string;
  type: LocationType;
  city: string;
  country: "AT";
  iata?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  enriched: boolean;
}
