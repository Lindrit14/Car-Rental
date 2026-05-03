interface MapEmbedProps {
  placeId?: string;
  lat?: number;
  lng?: number;
  query: string;
  zoom?: number;
  className?: string;
}

const EMBED_BASE = "https://www.google.com/maps/embed/v1/place";

function buildQuery({ placeId, lat, lng, query }: MapEmbedProps): string {
  if (placeId) return `place_id:${placeId}`;
  if (typeof lat === "number" && typeof lng === "number") {
    return `${lat},${lng}`;
  }
  return query;
}

export default function MapEmbed(props: MapEmbedProps) {
  const { query, zoom = 14, className = "" } = props;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY ?? "";

  if (!apiKey) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-500 text-sm rounded-lg ${className}`}
        role="img"
        aria-label="Map unavailable"
      >
        Map unavailable
      </div>
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: buildQuery(props),
    zoom: String(zoom),
  });

  return (
    <iframe
      title={query}
      src={`${EMBED_BASE}?${params.toString()}`}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      className={`w-full h-full border-0 ${className}`}
    />
  );
}
