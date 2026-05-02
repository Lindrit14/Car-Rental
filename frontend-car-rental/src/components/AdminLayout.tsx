import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-1 truncate">{auth?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `block px-4 py-2 rounded text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/cars"
            className={({ isActive }) =>
              `block px-4 py-2 rounded text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            Cars
          </NavLink>
          <NavLink
            to="/admin/bookings"
            className={({ isActive }) =>
              `block px-4 py-2 rounded text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            Bookings
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `block px-4 py-2 rounded text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            Users
          </NavLink>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded font-medium text-left"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

