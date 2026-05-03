import { logger } from "./logger.js";
import type { Seed } from "./seeds.js";

export interface Enrichment {
  placeId: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

interface PlacesSearchResponse {
  places?: Array<{
    id?: string;
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
  }>;
}

export async function enrichOne(
  seed: Seed,
  apiKey: string,
  signal: AbortSignal,
): Promise<Enrichment | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.formattedAddress,places.location",
    },
    body: JSON.stringify({
      textQuery: seed.geocodeQuery,
      regionCode: "AT",
      maxResultCount: 1,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.warn(
      { seedId: seed.id, status: res.status, body: body.slice(0, 200) },
      "places searchText non-OK",
    );
    return null;
  }

  const json = (await res.json()) as PlacesSearchResponse;
  const p = json.places?.[0];
  if (!p?.id) {
    logger.warn({ seedId: seed.id }, "places searchText returned no match");
    return null;
  }

  return {
    placeId: p.id,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    formattedAddress: p.formattedAddress,
  };
}

export async function enrichAll(
  seeds: Seed[],
  apiKey: string,
): Promise<Map<string, Enrichment>> {
  const out = new Map<string, Enrichment>();

  const tasks = seeds.map(async (seed) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await enrichOne(seed, apiKey, ctrl.signal);
      if (r) out.set(seed.id, r);
    } catch (err) {
      logger.warn({ seedId: seed.id, err: String(err) }, "enrichment failed");
    } finally {
      clearTimeout(timer);
    }
  });

  await Promise.allSettled(tasks);
  return out;
}
