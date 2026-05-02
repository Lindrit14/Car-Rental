import { apiFetch } from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types";

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/user/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/user/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
