import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        <Link
          to="/admin/cars"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manage Cars</h2>
          <p className="text-sm text-gray-500 mt-2">
            Add, edit, and remove cars from the fleet.
          </p>
        </Link>
        <Link
          to="/admin/bookings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manage Bookings</h2>
          <p className="text-sm text-gray-500 mt-2">
            Look up, assign cars to, and manage customer bookings.
          </p>
        </Link>
        <Link
          to="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manage Users</h2>
          <p className="text-sm text-gray-500 mt-2">
            Promote an existing user to administrator.
          </p>
        </Link>
      </div>
    </div>
  );
}

