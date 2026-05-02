import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import CurrencySelector from "./components/CurrencySelector";
import CarList from "./pages/CarList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CarManagement from "./pages/admin/CarManagement";
import BookingManagement from "./pages/admin/BookingManagement";
import UserManagement from "./pages/admin/UserManagement";
import MyBookings from "./pages/MyBookings";
import GoogleMapsProvider from "./components/GoogleMapsProvider";

function Header() {
  const { auth, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Car Rental
        </Link>
        <nav className="flex items-center gap-4">
          <CurrencySelector />
          {auth ? (
            <>
              <Link to="/bookings" className="text-sm text-blue-600 hover:underline">
                My Bookings
              </Link>
              <span className="text-sm text-gray-600">{auth.email}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function HomeRoute() {
  const { auth } = useAuth();
  if (auth?.role === "ADMIN") return <Navigate to="/admin" replace />;
  return <CarList />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <GoogleMapsProvider>
    <AuthProvider>
      <CurrencyProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="cars" element={<CarManagement />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/bookings"
                      element={
                        <ProtectedRoute>
                          <MyBookings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/" element={<HomeRoute />} />
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
      </CurrencyProvider>
    </AuthProvider>
    </GoogleMapsProvider>
  );
}

export default App;

