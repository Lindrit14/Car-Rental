import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import type { AuthResponse } from "../types";

interface LoginFormProps {
  onSuccess?: (auth: AuthResponse) => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      setAuth(res);
      onSuccess?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500 text-center">
        Don't have an account?{" "}
        {onSwitchToRegister ? (
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:underline"
          >
            Register
          </button>
        ) : (
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        )}
      </p>
    </>
  );
}
