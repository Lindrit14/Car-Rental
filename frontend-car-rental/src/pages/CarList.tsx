import { useEffect, useState, type FormEvent } from "react";
import { getCars, getCarsByType } from "../api/cars";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import BookingModal from "../components/BookingModal";
import type { Car, CarType } from "../types";
import CityAutocomplete from "../components/CityAutocomplete";
import CarResultCard from "../components/CarResultCard";
import { useCurrency } from "../context/CurrencyContext";

const CAR_TYPES: CarType[] = ["ECONOMY", "COMPACT", "SUV", "VAN", "ELECTRIC", "LUXURY"];

function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().split("T")[0];
}

function calcDays(start: string, end: string): number {
  const diff = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
}

function uniqueRates(cars: Car[]) {
  return [...new Set(cars.map((car) => car.dailyRate))].sort((a, b) => a - b);
}

function sortByRate(cars: Car[]) {
  return [...cars].sort((a, b) => a.dailyRate - b.dailyRate);
}

export default function CarList() {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [carType, setCarType] = useState<CarType>("ECONOMY");
  const [cars, setCars] = useState<Car[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bookingParams, setBookingParams] = useState<{ type: CarType; location: string; dailyRate: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { auth } = useAuth();
  const { formatPrice } = useCurrency();

  const days = startDate && endDate ? calcDays(startDate, endDate) : null;
  const rates = cars ? uniqueRates(cars) : [];
  const lowestRate = rates[0] ?? null;

  useEffect(() => {
    setLoading(true);
    getCars()
      .then((data) => setCars(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setHasSearched(true);
    setCars(null);

    getCarsByType(carType, location.trim())
      .then((data) => {
        setCars(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleClearSearch() {
    setError(null);
    setHasSearched(false);
    setLoading(true);
    setCars(null);
    getCars()
      .then((data) => setCars(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleBook(type: CarType, loc: string, dailyRate: number) {
    if (!auth) {
      setAuthModalOpen(true);
      return;
    }

    setBookingParams({ type, location: loc, dailyRate });
  }

  function handleBookingSuccess() {
    setSuccessMessage("Booking created successfully. A matching car will be assigned by our team.");
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  return (
    <div>
      <div className="relative bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-500 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Rental cars - search by type, dates, and location
          </h1>

          <form
            onSubmit={handleSearch}
            className="bg-white rounded-lg shadow-lg p-3 flex flex-col lg:flex-row items-stretch lg:items-center gap-2"
          >
            <div className="flex-[2] min-w-0">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5 px-1">
                Location
              </label>
              <CityAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Airport, city or station"
                className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-200"
                required
              />
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5 px-1">
                Car type
              </label>
              <select
                value={carType}
                onChange={(e) => setCarType(e.target.value as CarType)}
                className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-200"
              >
                {CAR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5 px-1">
                Start date
              </label>
              <input
                type="date"
                required
                min={today()}
                value={startDate}
                onChange={(e) => {
                  const nextStartDate = e.target.value;
                  setStartDate(nextStartDate);
                  if (endDate && nextStartDate && endDate <= nextStartDate) {
                    setEndDate("");
                  }
                }}
                className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-200"
              />
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5 px-1">
                End date
              </label>
              <input
                type="date"
                required
                min={startDate ? addDays(startDate, 1) : addDays(today(), 1)}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-200"
              />
            </div>

            <div className="flex-shrink-0 self-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-2.5 rounded text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {successMessage && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded">
            {successMessage}
          </div>
        )}

        {error && <p className="text-center mt-6 text-red-500">Error: {error}</p>}

        {loading && (
          <p className="text-center mt-10 text-gray-500">Loading cars...</p>
        )}

        {cars !== null && !loading && cars.length === 0 && !error && (
          <p className="text-center mt-10 text-gray-500">
            {hasSearched
              ? "No cars available for the selected type and location."
              : "No cars are currently in the fleet."}
          </p>
        )}

        {cars !== null && !loading && cars.length > 0 && lowestRate !== null && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {hasSearched ? `${carType} in ${location}` : "All available cars"}
                </h2>
                <p className="text-sm text-gray-500">
                  {cars.length} vehicle{cars.length === 1 ? "" : "s"} available · from {formatPrice(lowestRate, { maximumFractionDigits: 0 })}/day
                </p>
              </div>
              {hasSearched ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Show all cars
                </button>
              ) : (
                <p className="text-xs text-gray-500 max-w-md">
                  Browse the fleet, or use the search above to filter by type, location, and dates.
                </p>
              )}
            </div>
            <div className="space-y-4">
              {sortByRate(cars).map((car) => (
                <CarResultCard
                  key={car.id}
                  car={car}
                  days={days}
                  onBook={(c) => handleBook(c.carType, c.location, c.dailyRate)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      <BookingModal
        isOpen={bookingParams !== null}
        onClose={() => setBookingParams(null)}
        bookingParams={bookingParams}
        onSuccess={handleBookingSuccess}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </div>
  );
}

