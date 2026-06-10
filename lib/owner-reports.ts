"use client";

import { getSession } from "@/lib/auth";

export type OwnerSummary = {
  todayRevenue: number;
  monthlyRevenue: number;
  todayServices: number;
  activeCustomers: number;
  unpaidInvoices: number;
  lowStockItems: number;
};

export type RevenueReportPoint = {
  date: string;
  label: string;
  totalInvoice: number;
  totalPaid: number;
  totalUnpaid: number;
  revenue: number;
};

export type ServiceReport = {
  serviceName: string;
  totalUsed: number;
  totalRevenue: number;
};

export type SparepartReport = {
  sparepartName: string;
  quantitySold: number;
  totalRevenue: number;
};

export type MechanicPerformance = {
  mechanicId: string;
  mechanicName: string;
  totalServiceOrder: number;
  completedServiceOrder: number;
  averageCompletionTime: number;
};

export type OwnerInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  issuedAt: string;
  customer?: { id: string; name: string };
};

export type LowStockSparepart = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  stock: number;
  minStock: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
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

async function ownerRequest<T>(path: string): Promise<T> {
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

export function fetchOwnerSummary() {
  return ownerRequest<OwnerSummary>("/owner/dashboard/summary");
}

export function fetchRevenueReport(params: { startDate?: string; endDate?: string }) {
  return ownerRequest<RevenueReportPoint[]>(
    `/reports/revenue${queryString(params)}`
  );
}

export function fetchServiceReport(params: { startDate?: string; endDate?: string }) {
  return ownerRequest<ServiceReport[]>(`/reports/services${queryString(params)}`);
}

export function fetchSparepartReport(params: { startDate?: string; endDate?: string }) {
  return ownerRequest<SparepartReport[]>(`/reports/spareparts${queryString(params)}`);
}

export function fetchMechanicPerformance(params: {
  startDate?: string;
  endDate?: string;
}) {
  return ownerRequest<MechanicPerformance[]>(
    `/reports/mechanics${queryString(params)}`
  );
}

export function fetchUnpaidInvoices() {
  return ownerRequest<OwnerInvoice[]>("/reports/unpaid-invoices");
}

export function fetchLowStockReport() {
  return ownerRequest<LowStockSparepart[]>("/reports/low-stock");
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMinutes(value: number) {
  if (value <= 0) return "-";
  if (value < 60) return `${value}m`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
