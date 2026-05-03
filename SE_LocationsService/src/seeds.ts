import type { LocationType } from "./types.js";

export interface Seed {
  id: string;
  displayName: string;
  type: LocationType;
  city: string;
  country: "AT";
  iata?: string;
  geocodeQuery: string;
}

export const SEEDS: Seed[] = [
  // ===== Airports — all six Austrian commercial passenger airports =====
  {
    id: "vie-airport",
    displayName: "Vienna International Airport (VIE)",
    type: "airport",
    city: "Schwechat",
    country: "AT",
    iata: "VIE",
    geocodeQuery: "Vienna International Airport, Austria",
  },
  {
    id: "szg-airport",
    displayName: "Salzburg Airport (SZG)",
    type: "airport",
    city: "Salzburg",
    country: "AT",
    iata: "SZG",
    geocodeQuery: "Salzburg Airport W. A. Mozart, Austria",
  },
  {
    id: "inn-airport",
    displayName: "Innsbruck Airport (INN)",
    type: "airport",
    city: "Innsbruck",
    country: "AT",
    iata: "INN",
    geocodeQuery: "Innsbruck Airport, Austria",
  },
  {
    id: "grz-airport",
    displayName: "Graz Airport (GRZ)",
    type: "airport",
    city: "Feldkirchen bei Graz",
    country: "AT",
    iata: "GRZ",
    geocodeQuery: "Graz Airport, Austria",
  },
  {
    id: "lnz-airport",
    displayName: "Linz Airport (LNZ)",
    type: "airport",
    city: "Hörsching",
    country: "AT",
    iata: "LNZ",
    geocodeQuery: "Linz Airport Blue Danube, Austria",
  },
  {
    id: "klu-airport",
    displayName: "Klagenfurt Airport (KLU)",
    type: "airport",
    city: "Klagenfurt",
    country: "AT",
    iata: "KLU",
    geocodeQuery: "Klagenfurt Airport, Austria",
  },

  // ===== Capitals — the nine Bundesland capitals (Vienna listed once) =====
  {
    id: "vienna",
    displayName: "Vienna",
    type: "capital",
    city: "Vienna",
    country: "AT",
    geocodeQuery: "Vienna, Austria",
  },
  {
    id: "st-poelten",
    displayName: "St. Pölten",
    type: "capital",
    city: "St. Pölten",
    country: "AT",
    geocodeQuery: "St. Pölten, Austria",
  },
  {
    id: "linz",
    displayName: "Linz",
    type: "capital",
    city: "Linz",
    country: "AT",
    geocodeQuery: "Linz, Austria",
  },
  {
    id: "salzburg",
    displayName: "Salzburg",
    type: "capital",
    city: "Salzburg",
    country: "AT",
    geocodeQuery: "Salzburg, Austria",
  },
  {
    id: "innsbruck",
    displayName: "Innsbruck",
    type: "capital",
    city: "Innsbruck",
    country: "AT",
    geocodeQuery: "Innsbruck, Austria",
  },
  {
    id: "bregenz",
    displayName: "Bregenz",
    type: "capital",
    city: "Bregenz",
    country: "AT",
    geocodeQuery: "Bregenz, Austria",
  },
  {
    id: "graz",
    displayName: "Graz",
    type: "capital",
    city: "Graz",
    country: "AT",
    geocodeQuery: "Graz, Austria",
  },
  {
    id: "klagenfurt",
    displayName: "Klagenfurt am Wörthersee",
    type: "capital",
    city: "Klagenfurt",
    country: "AT",
    geocodeQuery: "Klagenfurt am Wörthersee, Austria",
  },
  {
    id: "eisenstadt",
    displayName: "Eisenstadt",
    type: "capital",
    city: "Eisenstadt",
    country: "AT",
    geocodeQuery: "Eisenstadt, Austria",
  },

  // ===== Bus terminals — VIB Erdberg + main Hbf busterminal per state capital =====
  {
    id: "vib-erdberg",
    displayName: "Vienna International Busterminal (VIB Erdberg)",
    type: "bus_terminal",
    city: "Vienna",
    country: "AT",
    geocodeQuery: "Vienna International Busterminal Erdberg, Vienna, Austria",
  },
  {
    id: "wien-hbf-bus",
    displayName: "Wien Hauptbahnhof Busterminal",
    type: "bus_terminal",
    city: "Vienna",
    country: "AT",
    geocodeQuery: "Wien Hauptbahnhof, Vienna, Austria",
  },
  {
    id: "salzburg-hbf-bus",
    displayName: "Salzburg Hauptbahnhof Busterminal",
    type: "bus_terminal",
    city: "Salzburg",
    country: "AT",
    geocodeQuery: "Salzburg Hauptbahnhof, Salzburg, Austria",
  },
  {
    id: "linz-hbf-bus",
    displayName: "Linz Hauptbahnhof Busterminal",
    type: "bus_terminal",
    city: "Linz",
    country: "AT",
    geocodeQuery: "Linz Hauptbahnhof, Linz, Austria",
  },
  {
    id: "graz-hbf-bus",
    displayName: "Graz Hauptbahnhof Busterminal",
    type: "bus_terminal",
    city: "Graz",
    country: "AT",
    geocodeQuery: "Graz Hauptbahnhof, Graz, Austria",
  },
  {
    id: "innsbruck-hbf-bus",
    displayName: "Innsbruck Hauptbahnhof Busterminal",
    type: "bus_terminal",
    city: "Innsbruck",
    country: "AT",
    geocodeQuery: "Innsbruck Hauptbahnhof, Innsbruck, Austria",
  },
  {
    id: "klagenfurt-hbf-bus",
    displayName: "Klagenfurt Hauptbahnhof Busterminal",
    type: "bus_terminal",
    city: "Klagenfurt",
    country: "AT",
    geocodeQuery: "Klagenfurt Hauptbahnhof, Klagenfurt, Austria",
  },
  {
    id: "st-poelten-hbf-bus",
    displayName: "St. Pölten Hauptbahnhof Busterminal",
    type: "bus_terminal",
    city: "St. Pölten",
    country: "AT",
    geocodeQuery: "St. Pölten Hauptbahnhof, Austria",
  },
  {
    id: "eisenstadt-domplatz-bus",
    displayName: "Eisenstadt Domplatz Busterminal",
    type: "bus_terminal",
    city: "Eisenstadt",
    country: "AT",
    geocodeQuery: "Eisenstadt Domplatz, Austria",
  },
];
