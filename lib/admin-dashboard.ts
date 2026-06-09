"use client";

import { getSession } from "@/lib/auth";

export type AdminDashboardSummary = {
  todayBookings: number;
  activeServiceOrders: number;
  unpaidInvoices: number;
  lowStockItems: number;
  totalCustomers: number;
  totalVehicles: number;
  monthlyRevenue: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

type Vehicle = {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  vehicleType: string;
};

export type AdminBooking = {
  id: string;
  code: string;
  serviceName: string;
  scheduleAt: string;
  status: string;
  customer: Customer;
  vehicle: Vehicle | null;
};

export type AdminServiceOrder = {
  id: string;
  code: string;
  serviceName: string;
  status: string;
  currentStep: string;
  estimatedFinishedAt: string | null;
  customer: Customer;
  vehicle: Vehicle | null;
};

export type LowStockSparepart = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  stock: number;
  minStock: number;
  category: { id: string; name: string } | null;
};

export type RevenuePoint = {
  label: string;
  revenue: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function adminRequest<T>(path: string): Promise<T> {
  const session = getSession();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
    },
  });
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.message || "Request gagal");
  }

  return body.data;
}

export function fetchAdminDashboardSummary() {
  return adminRequest<AdminDashboardSummary>("/admin/dashboard/summary");
}

export function fetchTodayBookings() {
  return adminRequest<AdminBooking[]>("/admin/dashboard/today-bookings");
}

export function fetchActiveServiceOrders() {
  return adminRequest<AdminServiceOrder[]>(
    "/admin/dashboard/active-service-orders"
  );
}

export function fetchLowStockSpareparts() {
  return adminRequest<LowStockSparepart[]>("/admin/dashboard/low-stock");
}

export function fetchRevenueChart() {
  return adminRequest<RevenuePoint[]>("/admin/dashboard/revenue-chart");
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
