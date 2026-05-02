import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthResponse } from "../types";

interface AuthContextType {
  auth: AuthResponse | null;
  setAuth: (auth: AuthResponse | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthResponse | null>(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    if (token && email && role) {
      return { token, email, role };
    }
    return null;
  });

  function setAuth(auth: AuthResponse | null) {
    if (auth) {
      localStorage.setItem("token", auth.token);
      localStorage.setItem("email", auth.email);
      localStorage.setItem("role", auth.role);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
    }
    setAuthState(auth);
  }

  function logout() {
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
