import { useEffect, useMemo, useState } from "react";
import {
  getAllBookings,
  getBookingById,
  assignCar,
  returnBooking,
  cancelBooking,
} from "../../api/bookings";
import { getCarById, getCarsByType } from "../../api/cars";
import type { Booking, BookingStatus, Car } from "../../types";

const statusStyles: Record<BookingStatus, string> = {
  RESERVED: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  RETURNED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

type StatusFilter = "ALL" | BookingStatus;

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function formatCar(car: Car): string {
  return `${car.brand} ${car.model} (${car.year}) · ${car.licensePlate}`;
}

export default function BookingManagement() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [assignedCar, setAssignedCar] = useState<Car | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [pickupsTodayOnly, setPickupsTodayOnly] = useState(false);

  function loadAll() {
    setListLoading(true);
    getAllBookings()
      .then(setAllBookings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load bookings"))
      .finally(() => setListLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!booking?.carId) {
      setAssignedCar(null);
      return;
    }
    if (assignedCar?.id === booking.carId) return;
    let cancelled = false;
    getCarById(booking.carId)
      .then((car) => {
        if (!cancelled) setAssignedCar(car);
      })
      .catch(() => {
        if (!cancelled) setAssignedCar(null);
      });
    return () => {
      cancelled = true;
    };
  }, [booking?.carId, assignedCar?.id]);

  const filtered = useMemo(() => {
    const today = todayIso();
    const q = search.trim().toLowerCase();
    return allBookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (pickupsTodayOnly && b.startDate !== today) return false;
      if (!q) return true;
      return (
        b.id.toLowerCase().includes(q) ||
        b.userId.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q)
      );
    });
  }, [allBookings, search, statusFilter, pickupsTodayOnly]);

  function selectBookingFromList(b: Booking) {
    setBooking(b);
    setBookingId(b.id);
    setShowCarSelector(false);
    setCars([]);
    setAssignedCar(null);
    setError(null);
  }

  async function handleLookup() {
    if (!bookingId.trim()) return;
    setLoading(true);
    setError(null);
    setBooking(null);
    setShowCarSelector(false);
    setCars([]);
    setAssignedCar(null);

    try {
      const data = await getBookingById(bookingId.trim());
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking not found");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdate(updated: Booking) {
    setBooking(updated);
    setAllBookings((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleAssignCar(carId: string) {
    if (!booking) return;
    setError(null);

    try {
      const updated = await assignCar(booking.id, carId);
      applyUpdate(updated);
      const justAssigned = cars.find((c) => c.id === carId);
      if (justAssigned) setAssignedCar(justAssigned);
      setShowCarSelector(false);
      setCars([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign car");
    }
  }

  async function handleReturn() {
    if (!booking) return;
    setError(null);

    try {
      const updated = await returnBooking(booking.id);
      applyUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as returned");
    }
  }

  async function handleCancel() {
    if (!booking) return;
    setError(null);

    try {
      const updated = await cancelBooking(booking.id);
      applyUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  }

  async function openCarSelector() {
    if (!booking) return;
    setShowCarSelector(true);
    setCarsLoading(true);
    setError(null);

    try {
      const data = await getCarsByType(booking.type, booking.location);
      setCars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cars");
    } finally {
      setCarsLoading(false);
    }
  }

  const availableCars = booking
    ? cars.filter((car) => car.location === booking.location && car.carType === booking.type)
    : [];

  const statusCounts = useMemo(() => {
    const counts: Record<BookingStatus, number> = {
      RESERVED: 0,
      ACTIVE: 0,
      RETURNED: 0,
      CANCELLED: 0,
    };
    for (const b of allBookings) counts[b.status]++;
    return counts;
  }, [allBookings]);

  const pickupsTodayCount = useMemo(() => {
    const today = todayIso();
    return allBookings.filter((b) => b.startDate === today && b.status === "RESERVED").length;
  }, [allBookings]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Bookings</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setPickupsTodayOnly(true);
            setStatusFilter("ALL");
          }}
          className="text-left bg-white border border-amber-200 rounded-lg p-3 hover:border-amber-400"
        >
          <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
            Pickups today
          </p>
          <p className="text-2xl font-bold">{pickupsTodayCount}</p>
        </button>
        {(["RESERVED", "ACTIVE", "RETURNED", "CANCELLED"] as BookingStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(status);
              setPickupsTodayOnly(false);
            }}
            className="text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-400"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              {status}
            </p>
            <p className="text-2xl font-bold">{statusCounts[status]}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Look Up Booking</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Booking ID"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Searching..." : "Look Up"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-3">
          <h2 className="text-lg font-semibold flex-1">All Bookings</h2>
          <input
            type="text"
            placeholder="Search by ID, user, location, type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 md:max-w-sm border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All statuses</option>
            <option value="RESERVED">Reserved</option>
            <option value="ACTIVE">Active</option>
            <option value="RETURNED">Returned</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
            <input
              type="checkbox"
              checked={pickupsTodayOnly}
              onChange={(e) => setPickupsTodayOnly(e.target.checked)}
            />
            Pickups today only
          </label>
        </div>

        {listLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading bookings...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            {allBookings.length === 0 ? "No bookings yet." : "No bookings match the current filters."}
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Pickup</th>
                  <th className="px-4 py-2">Return</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const isSelected = booking?.id === b.id;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => selectBookingFromList(b)}
                      className={`border-t border-gray-100 cursor-pointer hover:bg-blue-50 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-mono text-xs">
                        {b.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2">{b.type}</td>
                      <td className="px-4 py-2">{b.location}</td>
                      <td className="px-4 py-2">{b.startDate}</td>
                      <td className="px-4 py-2">{b.endDate}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            statusStyles[b.status] ?? "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {booking && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Booking Details</h2>
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                statusStyles[booking.status] ?? "bg-gray-100 text-gray-500"
              }`}
            >
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">Booking Reference</p>
              <p className="font-mono text-sm break-all">{booking.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Car Type</p>
              <p className="font-medium">{booking.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{booking.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">{booking.startDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium">{booking.endDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Daily Rate</p>
              <p className="font-medium">${booking.dailyRate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="font-medium">
                {booking.totalPrice != null ? `$${booking.totalPrice.toFixed(2)}` : "TBD"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">Assigned Car</p>
              <p className="font-medium">
                {!booking.carId
                  ? "Not yet assigned"
                  : assignedCar
                    ? formatCar(assignedCar)
                    : "Loading car..."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            {booking.status === "RESERVED" && (
              <>
                <button
                  onClick={openCarSelector}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Assign Car
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium"
                >
                  Cancel Booking
                </button>
              </>
            )}
            {booking.status === "ACTIVE" && (
              <button
                onClick={handleReturn}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
              >
                Mark Returned
              </button>
            )}
            {(booking.status === "RETURNED" || booking.status === "CANCELLED") && (
              <span className="text-sm text-gray-400">No actions available</span>
            )}
          </div>

          {showCarSelector && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold mb-1">Select a Car to Assign</h3>
              <p className="text-xs text-gray-500 mb-3">
                Showing cars that match {booking.type} in {booking.location}.
              </p>
              {carsLoading ? (
                <p className="text-gray-500 text-sm">Loading cars...</p>
              ) : availableCars.length === 0 ? (
                <p className="text-gray-500 text-sm">No matching cars are currently available.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableCars.map((car) => (
                    <div
                      key={car.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {car.brand} {car.model} ({car.year})
                        </p>
                        <p className="text-xs text-gray-500">
                          {car.licensePlate} · ${car.dailyRate.toFixed(2)}/day
                        </p>
                      </div>
                      <button
                        onClick={() => handleAssignCar(car.id)}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowCarSelector(false)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
