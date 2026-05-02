import type { Car, CarType } from "../types";
import { useCurrency } from "../context/CurrencyContext";

interface CarSpecs {
  seats: number;
  transmission: "Manual" | "Automatic";
  largeLuggage: number;
  smallLuggage: number;
  categoryLabel: string;
}

const SPECS_BY_TYPE: Record<CarType, CarSpecs> = {
  ECONOMY: { seats: 5, transmission: "Manual", largeLuggage: 1, smallLuggage: 1, categoryLabel: "small vehicle" },
  COMPACT: { seats: 5, transmission: "Manual", largeLuggage: 2, smallLuggage: 1, categoryLabel: "compact vehicle" },
  SUV: { seats: 5, transmission: "Automatic", largeLuggage: 3, smallLuggage: 2, categoryLabel: "SUV" },
  VAN: { seats: 7, transmission: "Manual", largeLuggage: 4, smallLuggage: 2, categoryLabel: "van" },
  ELECTRIC: { seats: 5, transmission: "Automatic", largeLuggage: 2, smallLuggage: 1, categoryLabel: "electric vehicle" },
  LUXURY: { seats: 5, transmission: "Automatic", largeLuggage: 2, smallLuggage: 2, categoryLabel: "luxury vehicle" },
};

interface CarResultCardProps {
  car: Car;
  days: number | null;
  onBook: (car: Car) => void;
}

export default function CarResultCard({ car, days, onBook }: CarResultCardProps) {
  const specs = SPECS_BY_TYPE[car.carType];
  const total = days ? days * car.dailyRate : null;
  const { formatPrice } = useCurrency();

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="p-5 flex flex-col md:flex-row gap-5">
        <div className="flex-shrink-0 w-full md:w-48 h-32 bg-gray-50 rounded-lg flex items-center justify-center">
          <CarSilhouette />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900">
              {car.brand} {car.model}
            </h3>
            <span className="text-sm text-cyan-700">
              or similar {specs.categoryLabel}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
            <Spec icon={<SeatsIcon />} label={`${specs.seats} seats`} />
            <Spec icon={<TransmissionIcon />} label={specs.transmission} />
            <Spec
              icon={<LuggageIcon />}
              label={`${specs.largeLuggage} large ${specs.largeLuggage === 1 ? "bag" : "bags"}`}
            />
            <Spec
              icon={<LuggageIcon small />}
              label={`${specs.smallLuggage} small ${specs.smallLuggage === 1 ? "bag" : "bags"}`}
            />
            <Spec icon={<MileageIcon />} label="Unlimited mileage" />
          </div>

          <div className="mt-4 text-sm">
            <p className="text-cyan-700 font-medium">{car.location}</p>
            <p className="text-xs text-gray-500">Pickup at counter</p>
          </div>
        </div>

        <div className="flex-shrink-0 md:w-48 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5">
          <div className="text-right">
            {days !== null ? (
              <>
                <p className="text-xs text-gray-500">Price for {days} day{days === 1 ? "" : "s"}:</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPrice(total!, { maximumFractionDigits: 0 })}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500">Daily rate:</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPrice(car.dailyRate, { maximumFractionDigits: 0 })}
                </p>
              </>
            )}
            <p className="mt-1 text-xs text-green-700 font-medium">Free cancellation</p>
          </div>
          <button
            onClick={() => onBook(car)}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded text-sm transition-colors"
          >
            View offer
          </button>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function SeatsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </svg>
  );
}

function TransmissionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M12 4v16M18 4v16" />
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

function LuggageIcon({ small = false }: { small?: boolean }) {
  const h = small ? 12 : 16;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y={20 - h} width="12" height={h} rx="1.5" />
      <path d="M9 6V4h6v2" />
      <path d="M9 20v2M15 20v2" />
    </svg>
  );
}

function MileageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CarSilhouette() {
  return (
    <svg width="110" height="60" viewBox="0 0 120 60" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 42h100" />
      <path d="M18 42c-3 0-5-2-5-5v-6c0-1 1-3 3-4l8-4c2-1 5-2 8-2h32c3 0 5 1 7 2l10 8h17c3 0 5 2 5 5v1c0 3-2 5-5 5" />
      <circle cx="32" cy="44" r="8" fill="#fff" />
      <circle cx="32" cy="44" r="3" />
      <circle cx="88" cy="44" r="8" fill="#fff" />
      <circle cx="88" cy="44" r="3" />
    </svg>
  );
}
