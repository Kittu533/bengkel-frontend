"use client";

import { getSession } from "@/lib/auth";

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

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  user: { status: string };
  vehicles?: AdminVehicle[];
};

export type AdminVehicle = {
  id: string;
  customerId: string;
  plateNumber: string;
  brand: string;
  model: string;
  vehicleType: string;
  year: number | null;
  color: string | null;
  customer?: { id: string; name: string; phone: string };
};

export type Category = {
  id: string;
  name: string;
  isActive: boolean;
};

export type AdminServiceCatalog = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  vehicleType: string;
  price: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  category?: Category;
};

export type AdminSparepart = {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  brand: string;
  description: string;
  vehicleType: string;
  stock: number;
  minStock: number;
  sellPrice: number;
  costPrice: number;
  isActive: boolean;
  category?: Category;
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

export function listCustomers(search = "") {
  return adminRequest<Paginated<AdminCustomer>>(
    `/customers${queryString({ search })}`
  );
}

export function createCustomer(payload: Record<string, unknown>) {
  return adminRequest<AdminCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomer(id: string, payload: Record<string, unknown>) {
  return adminRequest<AdminCustomer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCustomer(id: string) {
  return adminRequest<null>(`/customers/${id}`, { method: "DELETE" });
}

export function listVehicles(search = "") {
  return adminRequest<Paginated<AdminVehicle>>(
    `/vehicles${queryString({ search })}`
  );
}

export function createVehicle(payload: Record<string, unknown>) {
  return adminRequest<AdminVehicle>("/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateVehicle(id: string, payload: Record<string, unknown>) {
  return adminRequest<AdminVehicle>(`/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteVehicle(id: string) {
  return adminRequest<null>(`/vehicles/${id}`, { method: "DELETE" });
}

export function listServiceCategories(search = "") {
  return adminRequest<Paginated<Category>>(
    `/service-categories${queryString({ search })}`
  );
}

export function createServiceCategory(payload: Record<string, unknown>) {
  return adminRequest<Category>("/service-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listServiceCatalogs(search = "") {
  return adminRequest<Paginated<AdminServiceCatalog>>(
    `/service-catalogs${queryString({ search })}`
  );
}

export function createServiceCatalog(payload: Record<string, unknown>) {
  return adminRequest<AdminServiceCatalog>("/service-catalogs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServiceCatalog(id: string, payload: Record<string, unknown>) {
  return adminRequest<AdminServiceCatalog>(`/service-catalogs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteServiceCatalog(id: string) {
  return adminRequest<null>(`/service-catalogs/${id}`, { method: "DELETE" });
}

export function listSparepartCategories(search = "") {
  return adminRequest<Paginated<Category>>(
    `/sparepart-categories${queryString({ search })}`
  );
}

export function createSparepartCategory(payload: Record<string, unknown>) {
  return adminRequest<Category>("/sparepart-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listSpareparts(search = "") {
  return adminRequest<Paginated<AdminSparepart>>(
    `/spareparts${queryString({ search })}`
  );
}

export function createSparepart(payload: Record<string, unknown>) {
  return adminRequest<AdminSparepart>("/spareparts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSparepart(id: string, payload: Record<string, unknown>) {
  return adminRequest<AdminSparepart>(`/spareparts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSparepart(id: string) {
  return adminRequest<null>(`/spareparts/${id}`, { method: "DELETE" });
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
