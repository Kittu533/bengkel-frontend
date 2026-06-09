"use client";

import { getSession } from "@/lib/auth";
import { AdminSparepart, Category, Paginated, PaginationMeta } from "@/lib/admin-master";

export type StockMovement = {
  id: string;
  sparepartId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  beforeStock: number;
  afterStock: number;
  note: string | null;
  referenceType: "SERVICE_ORDER" | "PURCHASE" | "MANUAL_ADJUSTMENT" | null;
  referenceId: string | null;
  createdById: string | null;
  createdAt: string;
  sparepart?: AdminSparepart;
  createdBy?: { id: string; name: string; email: string } | null;
};

export type InventoryFilters = {
  search?: string;
  categoryId?: string;
  brand?: string;
  sparepartId?: string;
  type?: string;
};

export type StockAdjustmentPayload = {
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  note?: string;
  referenceType?: "PURCHASE" | "MANUAL_ADJUSTMENT";
  referenceId?: string;
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

async function adminRequest<T>(
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

export function listInventorySpareparts(filters: InventoryFilters = {}) {
  return adminRequest<Paginated<AdminSparepart>>(
    `/spareparts${queryString({
      search: filters.search,
      categoryId: filters.categoryId,
      brand: filters.brand,
      limit: 50,
    })}`
  );
}

export function listInventoryCategories() {
  return adminRequest<Paginated<Category>>("/sparepart-categories?limit=50");
}

export function listLowStockSpareparts(filters: InventoryFilters = {}) {
  return adminRequest<Paginated<AdminSparepart>>(
    `/spareparts/low-stock${queryString({
      search: filters.search,
      categoryId: filters.categoryId,
      brand: filters.brand,
      limit: 50,
    })}`
  );
}

export function listStockMovements(filters: InventoryFilters = {}) {
  return adminRequest<Paginated<StockMovement>>(
    `/stock-movements${queryString({
      search: filters.search,
      sparepartId: filters.sparepartId,
      type: filters.type,
      limit: 50,
    })}`
  );
}

export function adjustSparepartStock(
  sparepartId: string,
  payload: StockAdjustmentPayload
) {
  return adminRequest<AdminSparepart>(`/spareparts/${sparepartId}/stock-adjustment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
