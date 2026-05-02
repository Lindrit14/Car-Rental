import { useEffect, useState, type FormEvent } from "react";
import Modal from "./Modal";
import { createBooking } from "../api/bookings";
import type { Booking, CarType } from "../types";
import { useCurrency } from "../context/CurrencyContext";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingParams: { type: CarType; location: string; dailyRate: number } | null;
  onSuccess: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

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

export default function BookingModal({
  isOpen,
  onClose,
  bookingParams,
  onSuccess,
  initialStartDate,
  initialEndDate,
}: BookingModalProps) {
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setConfirmed(null);
      setCopied(false);
      return;
    }

    setStartDate(initialStartDate ?? "");
    setEndDate(initialEndDate ?? "");
    setError(null);
    setConfirmed(null);
    setCopied(false);
  }, [isOpen, initialStartDate, initialEndDate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bookingParams) return;

    setError(null);
    setSubmitting(true);

    try {
      const booking = await createBooking({
        type: bookingParams.type,
        startDate,
        endDate,
        location: bookingParams.location,
      });
      setConfirmed(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyId() {
    if (!confirmed) return;
    try {
      await navigator.clipboard.writeText(confirmed.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; ignore silently.
    }
  }

  function handleDone() {
    onSuccess();
    onClose();
  }

  if (!bookingParams) return null;

  if (confirmed) {
    const totalPrice = confirmed.totalPrice ?? confirmed.dailyRate * calcDays(confirmed.startDate, confirmed.endDate);
    return (
      <Modal isOpen={isOpen} onClose={handleDone}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold">Reservation confirmed</h2>
              <p className="text-sm text-gray-500">Bring this reference to the agency on pickup day.</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
            <p className="text-xs uppercase tracking-wide text-amber-800 font-semibold mb-1">
              Booking reference
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono break-all text-gray-900">
                {confirmed.id}
              </code>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-xs font-medium px-2 py-1 rounded border border-amber-300 hover:bg-amber-100 text-amber-800 whitespace-nowrap"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium">{confirmed.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span className="font-medium">{confirmed.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pickup</span>
              <span className="font-medium">{confirmed.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Return</span>
              <span className="font-medium">{confirmed.endDate}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="text-gray-500">Estimated total</span>
              <span className="font-semibold">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            A specific car will be assigned by the team when you arrive at the agency. You can also
            find this reference any time under "My Bookings".
          </p>

          <button
            type="button"
            onClick={handleDone}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  const days = startDate && endDate ? calcDays(startDate, endDate) : null;
  const estimatedTotal = days ? days * bookingParams.dailyRate : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-1">Book {bookingParams.type}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {bookingParams.location} · {formatPrice(bookingParams.dailyRate)}/day indicative rate
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <input
              type="date"
              required
              min={startDate ? addDays(startDate, 1) : addDays(today(), 1)}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {estimatedTotal !== null && (
            <div className="bg-gray-50 rounded p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {days} day{days === 1 ? "" : "s"} x {formatPrice(bookingParams.dailyRate)}
                </span>
                <span className="font-semibold">{formatPrice(estimatedTotal)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Estimated total at the indicative daily rate</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {submitting ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </Modal>
  );
}
