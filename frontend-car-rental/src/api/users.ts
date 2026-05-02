import { apiFetch } from "./client";
import type { User } from "../types";

export function getAllUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/user");
}

export function promoteUser(userId: string): Promise<User> {
  return apiFetch<User>(`/api/user/${userId}/promote`, {
    method: "PUT",
  });
}
