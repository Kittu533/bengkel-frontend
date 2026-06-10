"use client";

import { getSession } from "@/lib/auth";
import { AdminServiceOrder } from "@/lib/admin-service-orders";

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED" | "REFUNDED";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "QRIS_MANUAL" | "MIDTRANS" | "XENDIT";

export type InvoiceItem = {
  id: string;
  type: "SERVICE" | "SPAREPART";
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type Payment = {
  id: string;
  invoiceId: string;
  paymentNumber: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  referenceNumber: string | null;
  note: string | null;
};

export type AdminInvoice = {
  id: string;
  customerId: string;
  serviceOrderId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string | null;
  totalAmount: number;
  paidAmount: number;
  pdfUrl: string | null;
  paidAt: string | null;
  customer?: { id: string; name: string; phone: string; email: string };
  serviceOrder?: AdminServiceOrder | null;
  items?: InvoiceItem[];
  payments?: Payment[];
};

type PaginationMeta = {
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

function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

async function invoiceRequest<T>(
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

export function listInvoices(params: { search?: string; status?: string } = {}) {
  return invoiceRequest<Paginated<AdminInvoice>>(
    `/invoices${queryString({ ...params, limit: 50 })}`
  );
}

export function createInvoice(payload: { serviceOrderId: string; dueAt?: string }) {
  return invoiceRequest<AdminInvoice>("/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateInvoicePdf(id: string) {
  return invoiceRequest<AdminInvoice>(`/invoices/${id}/generate-pdf`, {
    method: "POST",
  });
}

export function createPayment(payload: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
  referenceNumber?: string;
  note?: string;
}) {
  return invoiceRequest<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
