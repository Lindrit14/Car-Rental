// --- Car ---
export type CarType = "ECONOMY" | "COMPACT" | "SUV" | "VAN" | "ELECTRIC" | "LUXURY";

export interface CreateCarRequest {
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  dailyRate: number;
  carType: CarType;
  location: string;
}

export interface UpdateCarRequest {
  brand?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  carType?: string;
  dailyRate?: number;
  location?: string;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  dailyRate: number;
  carType: CarType;
  location: string;
}

// --- Auth ---
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// --- Booking ---
export type BookingStatus = "RESERVED" | "ACTIVE" | "RETURNED" | "CANCELLED";

export interface CreateBookingRequest {
  type: CarType;
  startDate: string;
  endDate: string;
  location: string;
}

export interface Booking {
  id: string;
  userId: string;
  carId: string | null;
  type: CarType;
  location: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalPrice: number | null;
  status: BookingStatus;
}

// --- Price ---
export interface PriceResponse {
  carId: string;
  price: number;
  dailyRate: number;
  days: number;
  currency: string;
  startDate: string;
  endDate: string;
}

// --- Currency ---
export interface CurrencyConvertResponse {
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  stale: boolean;
}

export interface CurrencyMetadataResponse {
  source: string;
  lastRefresh: string;
  rateDate: string;
  stale: boolean;
}
