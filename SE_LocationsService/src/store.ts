import { logger } from "./logger.js";
import { SEEDS, type Seed } from "./seeds.js";
import { enrichAll } from "./enrich.js";
import type { Location, LocationType } from "./types.js";

let items: Location[] = [];
let byId: Map<string, Location> = new Map();

function seedToLocation(seed: Seed): Location {
  return {
    id: seed.id,
    displayName: seed.displayName,
    type: seed.type,
    city: seed.city,
    country: seed.country,
    ...(seed.iata !== undefined ? { iata: seed.iata } : {}),
    enriched: false,
  };
}

function sortLocations(list: Location[]): Location[] {
  const order: Record<LocationType, number> = {
    airport: 0,
    capital: 1,
    bus_terminal: 2,
  };
  return [...list].sort((a, b) => {
    const t = order[a.type] - order[b.type];
    if (t !== 0) return t;
    return a.displayName.localeCompare(b.displayName);
  });
}

export const store = {
  async init({ apiKey }: { apiKey: string }): Promise<void> {
    if (!apiKey) {
      logger.warn("MAPS_GOOGLE_API_KEY not set — serving seed list without enrichment");
      const list = SEEDS.map(seedToLocation);
      items = sortLocations(list);
      byId = new Map(items.map((l) => [l.id, l]));
      return;
    }

    logger.info({ count: SEEDS.length }, "enriching seeds via Google Places");
    const enrichments = await enrichAll(SEEDS, apiKey);

    const list = SEEDS.map((seed) => {
      const base = seedToLocation(seed);
      const e = enrichments.get(seed.id);
      if (!e) return base;
      return {
        ...base,
        placeId: e.placeId,
        ...(e.lat !== undefined ? { lat: e.lat } : {}),
        ...(e.lng !== undefined ? { lng: e.lng } : {}),
        ...(e.formattedAddress !== undefined ? { formattedAddress: e.formattedAddress } : {}),
        enriched: true,
      };
    });

    items = sortLocations(list);
    byId = new Map(items.map((l) => [l.id, l]));

    const enriched = items.filter((l) => l.enriched).length;
    logger.info({ enriched, total: items.length }, "enrichment complete");
  },

  all(): Location[] {
    return items;
  },

  byId(id: string): Location | undefined {
    return byId.get(id);
  },

  stats(): { total: number; enriched: number } {
    return {
      total: items.length,
      enriched: items.filter((l) => l.enriched).length,
    };
  },
};
