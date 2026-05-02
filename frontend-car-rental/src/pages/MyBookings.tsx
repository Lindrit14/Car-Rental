import { useEffect, useState } from "react";
import { getMyBookings, cancelBooking } from "../api/bookings";
import { getCarById } from "../api/cars";
import type { Booking, BookingStatus, Car } from "../types";
import { useCurrency } from "../context/CurrencyContext";

const statusStyles: Record<BookingStatus, string> = {
  RESERVED: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  RETURNED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function formatCar(car: Car): string {
  return `${car.brand} ${car.model} (${car.year}) · ${car.licensePlate}`;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [carsById, setCarsById] = useState<Record<string, Car>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { formatPrice } = useCurrency();

  function load() {
    setLoading(true);
    getMyBookings()
      .then(async (data) => {
        setBookings(data);
        const carIds = Array.from(
          new Set(data.map((b) => b.carId).filter((id): id is string => Boolean(id))),
        );
        const results = await Promise.allSettled(carIds.map((id) => getCarById(id)));
        const next: Record<string, Car> = {};
        for (const result of results) {
          if (result.status === "fulfilled") next[result.value.id] = result.value;
        }
        setCarsById(next);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelBooking(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  async function handleCopyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      // Clipboard may be unavailable; ignore silently.
    }
  }

  function carDisplay(b: Booking): string {
    if (!b.carId) return "Will be assigned at pickup";
    const car = carsById[b.carId];
    return car ? formatCar(car) : "Assigned";
  }

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading bookings...</p>;
  }

  if (error) {
    return <p className="text-center mt-10 text-red-500">Error: {error}</p>;
  }

  if (bookings.length === 0) {
    return <p className="text-center mt-10 text-gray-500">No bookings yet.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Show the booking reference at the agency to pick up your car.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col"
          >
            <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
              <p className="text-[10px] uppercase tracking-wide text-amber-800 font-semibold mb-1">
                Booking reference
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono break-all text-gray-900">
                  {b.id}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyId(b.id)}
                  className="text-[11px] font-medium px-2 py-0.5 rounded border border-amber-300 hover:bg-amber-100 text-amber-800 whitespace-nowrap"
                >
                  {copiedId === b.id ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <h2 className="text-lg font-semibold">{b.type}</h2>
            <p className="text-sm text-gray-500">{b.location}</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="font-medium">Start:</span> {b.startDate}
              </p>
              <p>
                <span className="font-medium">End:</span> {b.endDate}
              </p>
              <p>
                <span className="font-medium">Daily Rate:</span> {formatPrice(b.dailyRate)}
              </p>
              <p>
                <span className="font-medium">Total:</span>{" "}
                {b.totalPrice != null ? formatPrice(b.totalPrice) : "TBD"}
              </p>
              <p>
                <span className="font-medium">Car:</span> {carDisplay(b)}
              </p>
            </div>
            <div className="mt-auto pt-3 flex items-center justify-between">
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  statusStyles[b.status] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {b.status}
              </span>
              {b.status === "RESERVED" && (
                <button
                  onClick={() => handleCancel(b.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
