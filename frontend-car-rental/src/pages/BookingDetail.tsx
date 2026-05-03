import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../api/bookings";
import { getCarById } from "../api/cars";
import { getLocations, type Location } from "../api/locations";
import { useCurrency } from "../context/CurrencyContext";
import MapEmbed from "../components/MapEmbed";
import type { Booking, BookingStatus, Car } from "../types";

const statusStyles: Record<BookingStatus, string> = {
  RESERVED: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  RETURNED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function dayCount(start: string, end: string): number {
  const ms =
    new Date(`${end}T00:00:00`).getTime() -
    new Date(`${start}T00:00:00`).getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { formatPrice } = useCurrency();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [car, setCar] = useState<Car | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getMyBookings(), getLocations()])
      .then(([myBookings, locs]) => {
        if (cancelled) return;
        const b = myBookings.find((x) => x.id === bookingId) ?? null;
        if (!b) {
          setError("Booking not found or you do not have access.");
          return;
        }
        setBooking(b);
        const match = locs.find((l) => l.displayName === b.location) ?? null;
        setLocation(match);
        if (b.carId) {
          return getCarById(b.carId).then((c) => {
            if (!cancelled) setCar(c);
          });
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message ?? "Failed to load booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function handleCopy() {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; ignore
    }
  }

  async function handleCancel() {
    if (!booking) return;
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    try {
      const updated = await cancelBooking(booking.id);
      setBooking(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading booking...</p>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Link to="/bookings" className="text-sm text-blue-600 hover:underline">
          ← Back to my bookings
        </Link>
        <p className="mt-6 text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {error}
        </p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Link to="/bookings" className="text-sm text-blue-600 hover:underline">
          ← Back to my bookings
        </Link>
        <p className="mt-6 text-gray-500">Booking not found.</p>
      </div>
    );
  }

  const days = dayCount(booking.startDate, booking.endDate);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link to="/bookings" className="text-sm text-blue-600 hover:underline">
        ← Back to my bookings
      </Link>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3">
        <p className="text-[10px] uppercase tracking-wide text-amber-800 font-semibold mb-1">
          Booking reference
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono break-all text-gray-900">
            {booking.id}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-medium px-2 py-0.5 rounded border border-amber-300 hover:bg-amber-100 text-amber-800 whitespace-nowrap"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900">{booking.type}</h1>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded ${
            statusStyles[booking.status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {booking.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details column */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Trip details
          </h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="font-medium">{booking.startDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Return</p>
              <p className="font-medium">{booking.endDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-medium">
                {days} day{days === 1 ? "" : "s"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Daily rate</p>
              <p className="font-medium">{formatPrice(booking.dailyRate)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-medium text-lg">
                {booking.totalPrice != null
                  ? formatPrice(booking.totalPrice)
                  : "Pending pickup"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-1">Car</p>
            {car ? (
              <div className="text-sm">
                <p className="font-medium">
                  {car.brand} {car.model} ({car.year})
                </p>
                <p className="text-gray-500">{car.licensePlate}</p>
                {(car.transmissionType || car.seats != null) && (
                  <p className="text-gray-500 mt-1">
                    {[
                      car.transmissionType,
                      car.seats != null ? `${car.seats} seats` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            ) : booking.carId ? (
              <p className="text-sm text-gray-500">Loading car…</p>
            ) : (
              <p className="text-sm text-gray-500">
                Will be assigned at pickup
              </p>
            )}
          </div>

          {booking.status === "RESERVED" && (
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </button>
            </div>
          )}
        </div>

        {/* Map column */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Pickup location
          </h2>

          <MapEmbed
            placeId={location?.placeId}
            lat={location?.lat}
            lng={location?.lng}
            query={booking.location}
            className="aspect-[4/3] rounded-lg overflow-hidden"
          />

          <div className="mt-3">
            <p className="font-medium text-gray-900">{booking.location}</p>
            {location?.formattedAddress && (
              <p className="text-sm text-gray-500">{location.formattedAddress}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
