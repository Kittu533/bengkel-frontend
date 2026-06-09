"use client";

import { getSession } from "@/lib/auth";

export type CustomerDashboardSummary = {
  totalVehicles: number;
  activeBookings: number;
  activeServiceOrders: number;
  serviceHistory: number;
  unpaidInvoices: number;
};

export type CustomerVehicle = {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  vehicleType: "MOTOR" | "CAR";
  year: number | null;
  color: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehiclePayload = {
  plateNumber: string;
  brand: string;
  model: string;
  vehicleType: "MOTOR" | "CAR";
  year?: number;
  color?: string;
  notes?: string;
};

export type CustomerBooking = {
  id: string;
  code: string;
  serviceName: string;
  scheduleAt: string;
  status: string;
  notes: string | null;
  vehicle?: CustomerVehicle | null;
};

export type ActiveServiceOrder = {
  id: string;
  code: string;
  serviceName: string;
  status: string;
  currentStep: string;
  startedAt: string | null;
  estimatedFinishedAt: string | null;
  vehicle?: CustomerVehicle | null;
};

export type ServiceHistory = {
  id: string;
  serviceName: string;
  serviceDate: string;
  odometer: number | null;
  totalPrice: number;
  notes: string | null;
  vehicle?: CustomerVehicle | null;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedAt: string;
  dueAt: string | null;
  totalAmount: number;
  paidAt: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function customerRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = getSession();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
      ...(options.headers || {}),
    },
  });
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.message || "Request gagal");
  }

  return body.data;
}

async function customerCommand(path: string, options: RequestInit = {}) {
  const session = getSession();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
      ...(options.headers || {}),
    },
  });
  const body = (await response.json()) as ApiResponse<null>;

  if (!response.ok || !body.success) {
    throw new Error(body.message || "Request gagal");
  }
}

export function fetchCustomerDashboard() {
  return customerRequest<CustomerDashboardSummary>("/customer/dashboard");
}

export function fetchCustomerVehicles() {
  return customerRequest<CustomerVehicle[]>("/customer/vehicles");
}

export function createCustomerVehicle(payload: VehiclePayload) {
  return customerRequest<CustomerVehicle>("/customer/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomerVehicle(id: string, payload: Partial<VehiclePayload>) {
  return customerRequest<CustomerVehicle>(`/customer/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCustomerVehicle(id: string) {
  return customerCommand(`/customer/vehicles/${id}`, { method: "DELETE" });
}

export function fetchCustomerBookings() {
  return customerRequest<CustomerBooking[]>("/customer/bookings");
}

export function fetchActiveServiceOrders() {
  return customerRequest<ActiveServiceOrder[]>("/customer/service-orders/active");
}

export function fetchServiceHistory() {
  return customerRequest<ServiceHistory[]>("/customer/service-history");
}

export function fetchCustomerInvoices() {
  return customerRequest<Invoice[]>("/customer/invoices");
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
