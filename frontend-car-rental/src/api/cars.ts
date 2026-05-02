import { apiFetch } from "./client";
import type { Car, CarType, CreateCarRequest, PriceResponse, UpdateCarRequest } from "../types";

export function getCars(): Promise<Car[]> {
  return apiFetch<Car[]>("/api/car");
}

export function getCarById(carId: string): Promise<Car> {
  return apiFetch<Car>(`/api/car/${carId}`);
}

export function getCarsByType(carType: CarType, location?: string): Promise<Car[]> {
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  const query = params.toString();
  return apiFetch<Car[]>(`/api/car/type/${carType}${query ? `?${query}` : ""}`);
}

export function getCarPrice(carId: string, startDate: string, endDate: string, currency?: string): Promise<PriceResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  if (currency) params.set("currency", currency);
  return apiFetch<PriceResponse>(`/api/car/${carId}/price?${params}`);
}

export function createCar(data: CreateCarRequest): Promise<Car> {
  return apiFetch<Car>("/api/car", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCar(carId: string, data: UpdateCarRequest): Promise<Car> {
  return apiFetch<Car>(`/api/car/${carId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCar(carId: string): Promise<void> {
  return apiFetch<void>(`/api/car/${carId}`, {
    method: "DELETE",
  });
}
