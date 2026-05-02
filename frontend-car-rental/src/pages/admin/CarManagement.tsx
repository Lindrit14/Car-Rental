import { useEffect, useState, type FormEvent } from "react";
import { getCars, createCar, updateCar, deleteCar } from "../../api/cars";
import type { Car, CreateCarRequest, CarType } from "../../types";
import CityAutocomplete from "../../components/CityAutocomplete";

const CAR_TYPES: CarType[] = ["ECONOMY", "COMPACT", "SUV", "VAN", "ELECTRIC", "LUXURY"];

const emptyForm: CreateCarRequest = {
  brand: "",
  model: "",
  licensePlate: "",
  year: 2024,
  dailyRate: 0,
  carType: "ECONOMY",
  location: "",
};

export default function CarManagement() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCarRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function loadCars() {
    setLoading(true);
    getCars()
      .then((data) => {
        const valid = data.filter((c) => c.brand);
        setCars(valid);
        if (data.length > 0 && valid.length === 0) {
          setError("No cars could be fetched from the backend.");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCars();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(car: Car) {
    setEditingId(car.id);
    setForm({
      brand: car.brand,
      model: car.model,
      licensePlate: car.licensePlate,
      year: car.year,
      dailyRate: car.dailyRate,
      carType: car.carType,
      location: car.location,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingId !== null) {
        await updateCar(editingId, form);
      } else {
        await createCar(form);
      }
      cancelForm();
      loadCars();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(carId: string) {
    if (!confirm("Are you sure you want to delete this car?")) return;
    setError(null);
    try {
      await deleteCar(carId);
      loadCars();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function updateField(field: keyof CreateCarRequest, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return <p className="text-gray-500">Loading cars...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Cars</h1>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
          >
            Add Car
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingId !== null ? "Edit Car" : "Add New Car"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  required
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  required
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  required
                  value={form.licensePlate}
                  onChange={(e) => updateField("licensePlate", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  required
                  min={1950}
                  max={2026}
                  value={form.year}
                  onChange={(e) => updateField("year", Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={form.dailyRate}
                  onChange={(e) => updateField("dailyRate", Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Type
                </label>
                <select
                  required
                  value={form.carType}
                  onChange={(e) => updateField("carType", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CAR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <CityAutocomplete
                  value={form.location}
                  onChange={(val) => updateField("location", val)}
                  placeholder="Enter a city"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {submitting
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Car"
                    : "Create Car"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {cars.length === 0 ? (
        <p className="text-gray-500">No cars found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Brand</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Model</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Year</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">License</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Rate</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car, index) => (
                <tr
                  key={car.id ?? index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{car.brand}</td>
                  <td className="px-4 py-3">{car.model}</td>
                  <td className="px-4 py-3">{car.year}</td>
                  <td className="px-4 py-3">{car.carType}</td>
                  <td className="px-4 py-3">{car.licensePlate}</td>
                  <td className="px-4 py-3">{car.location}</td>
                  <td className="px-4 py-3">${(car.dailyRate ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditForm(car)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(car.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
