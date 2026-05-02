import { apiFetch } from "./client";
import type { Booking, CreateBookingRequest } from "../types";

export function createBooking(data: CreateBookingRequest): Promise<Booking> {
  return apiFetch<Booking>("/api/booking", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyBookings(): Promise<Booking[]> {
  return apiFetch<Booking[]>("/api/booking/my");
}

export function getAllBookings(): Promise<Booking[]> {
  return apiFetch<Booking[]>("/api/booking");
}

export function getBookingById(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/api/booking/${id}`);
}

export function assignCar(bookingId: string, carId: string): Promise<Booking> {
  return apiFetch<Booking>(`/api/booking/${bookingId}/assign?carId=${carId}`, {
    method: "PUT",
  });
}

export function returnBooking(bookingId: string): Promise<Booking> {
  return apiFetch<Booking>(`/api/booking/${bookingId}/return`, {
    method: "PUT",
  });
}

export function cancelBooking(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/api/booking/${id}/cancel`, {
    method: "PUT",
  });
}
