"use client";

import { getSession } from "@/lib/auth";
import { CustomerVehicle } from "@/lib/customer";

export type AdminBooking = {
  id: string;
  customerId: string;
  vehicleId: string | null;
  code: string;
  serviceName: string;
  scheduleAt: string;
  status: string;
  notes: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  vehicle?: CustomerVehicle | null;
};

export type ServiceOrderFromBooking = {
  booking: AdminBooking;
  serviceOrder: {
    id: string;
    code: string;
    serviceName: string;
    status: string;
    currentStep: string;
  };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function queryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

async function adminBookingRequest<T>(
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
  if (body.meta) return { data: body.data, meta: body.meta } as T;
  return body.data;
}

export function listAdminBookings(params: { search?: string; status?: string } = {}) {
  return adminBookingRequest<Paginated<AdminBooking>>(
    `/bookings${queryString(params)}`
  );
}

export function acceptBooking(id: string) {
  return adminBookingRequest<AdminBooking>(`/bookings/${id}/accept`, {
    method: "PATCH",
  });
}

export function rejectBooking(id: string, reason: string) {
  return adminBookingRequest<AdminBooking>(`/bookings/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function rescheduleBooking(
  id: string,
  payload: { bookingDate: string; bookingTime: string; reason: string }
) {
  return adminBookingRequest<AdminBooking>(`/bookings/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function cancelBooking(id: string, reason: string) {
  return adminBookingRequest<AdminBooking>(`/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function convertBookingToServiceOrder(id: string) {
  return adminBookingRequest<ServiceOrderFromBooking>(
    `/bookings/${id}/convert-to-service-order`,
    { method: "POST" }
  );
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
