# SE_LocationsService

Curated REST API of allowed pickup/dropoff locations for the Car-Rental project.
Only Austrian **Airports**, **Hauptstädte** (Bundesland capitals), and **Busbahnhöfe**
(bus terminals) are exposed. The frontend's location pickers (user search and admin
create-car) consume this API instead of talking to Google Maps directly.

## Endpoints

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/api/locations` | full curated list, sorted by `(type, displayName)` |
| `GET` | `/api/locations?type=airport\|capital\|bus_terminal` | filter by type |
| `GET` | `/api/locations?grouped=true` | `{ airport: [...], capital: [...], bus_terminal: [...] }` |
| `GET` | `/api/locations?q=salz` | server-side substring filter |
| `GET` | `/api/locations/:id` | single entry by slug |
| `GET` | `/healthz` | `{ status, total, enriched }` |

Location shape:
```json
{
  "id": "vie-airport",
  "displayName": "Vienna International Airport (VIE)",
  "type": "airport",
  "city": "Schwechat",
  "country": "AT",
  "iata": "VIE",
  "placeId": "ChIJ...",
  "lat": 48.1102,
  "lng": 16.5697,
  "formattedAddress": "...",
  "enriched": true
}
```

`displayName` is the canonical string the frontend sends to the Spring backend's
`location` field. Both the user-search and admin-create flows pick from the same
list, so Spring's exact-match filter keeps working.

## How it works

The seed list (`src/seeds.ts`) is hardcoded. On startup the service calls the
**Google Places API (New)** `places:searchText` endpoint once per seed to enrich
each entry with `placeId`, `lat`/`lng`, and `formattedAddress`. Results are cached
in memory for the container's lifetime.

If `MAPS_GOOGLE_API_KEY` is empty or every Google call fails, the service still
serves the seed list — `enriched` is `false` and the spatial fields are absent.
The frontend dropdown still works with just `displayName`.

## Configuration

Environment variables (see `.env.example`):

| Var | Default | Description |
|---|---|---|
| `PORT` | `3000` | Internal port |
| `LOG_LEVEL` | `info` | `trace\|debug\|info\|warn\|error\|fatal` |
| `MAPS_GOOGLE_API_KEY` | _(empty)_ | Server-side Google Places API key |
| `ALLOWED_ORIGINS` | _(empty)_ | Comma-separated CORS allowlist |

## Local development

```bash
cp .env.example .env       # then fill MAPS_GOOGLE_API_KEY
npm install
npm run dev                # tsx watch
curl http://localhost:3000/api/locations | jq
```

## Tests

```bash
npm test
```

Tests run with no API key — verify the no-enrichment fallback shape.
