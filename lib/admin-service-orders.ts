"use client";

import { getSession } from "@/lib/auth";
import { CustomerVehicle } from "@/lib/customer";

export type ServiceOrderStatus =
  | "WAITING"
  | "CHECKED_IN"
  | "DIAGNOSIS"
  | "WAITING_APPROVAL"
  | "IN_PROGRESS"
  | "WAITING_SPAREPART"
  | "QUALITY_CHECK"
  | "READY_TO_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

export type ServiceOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type ServiceOrderNote = {
  id: string;
  note: string;
  visibility: "INTERNAL" | "CUSTOMER_VISIBLE";
  createdAt: string;
  user?: { id: string; name: string };
};

export type ServiceOrderPhoto = {
  id: string;
  url: string;
  caption: string | null;
  visibility: "INTERNAL" | "CUSTOMER_VISIBLE";
  createdAt: string;
};

export type AdminServiceOrder = {
  id: string;
  customerId: string;
  vehicleId: string | null;
  mechanicId: string | null;
  code: string;
  serviceName: string;
  status: ServiceOrderStatus;
  currentStep: string;
  checkInAt: string | null;
  startedAt: string | null;
  estimatedFinishedAt: string | null;
  finishedAt: string | null;
  mileageIn: number | null;
  customerComplaint: string | null;
  initialDiagnosis: string | null;
  totalServicePrice: number;
  totalSparepartPrice: number;
  grandTotal: number;
  customer?: { id: string; name: string; phone: string };
  mechanic?: { id: string; name: string } | null;
  vehicle?: CustomerVehicle | null;
  serviceItems?: ServiceOrderItem[];
  sparepartItems?: ServiceOrderItem[];
  notes?: ServiceOrderNote[];
  photos?: ServiceOrderPhoto[];
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

async function serviceOrderRequest<T>(
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

export function listServiceOrders(params: { search?: string; status?: string } = {}) {
  return serviceOrderRequest<Paginated<AdminServiceOrder>>(
    `/service-orders${queryString(params)}`
  );
}

export function createServiceOrder(payload: Record<string, unknown>) {
  return serviceOrderRequest<AdminServiceOrder>("/service-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServiceOrderStatus(id: string, status: ServiceOrderStatus) {
  return serviceOrderRequest<AdminServiceOrder>(`/service-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function assignMechanic(id: string, mechanicId: string) {
  return serviceOrderRequest<AdminServiceOrder>(
    `/service-orders/${id}/assign-mechanic`,
    {
      method: "PATCH",
      body: JSON.stringify({ mechanicId }),
    }
  );
}

export function addServiceItem(
  id: string,
  payload: { serviceCatalogId: string; quantity: number }
) {
  return serviceOrderRequest<AdminServiceOrder>(
    `/service-orders/${id}/service-items`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function addSparepartItem(
  id: string,
  payload: { sparepartId: string; quantity: number }
) {
  return serviceOrderRequest<AdminServiceOrder>(
    `/service-orders/${id}/sparepart-items`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function addServiceOrderNote(
  id: string,
  payload: { note: string; visibility: "INTERNAL" | "CUSTOMER_VISIBLE" }
) {
  return serviceOrderRequest<ServiceOrderNote>(`/service-orders/${id}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addServiceOrderPhoto(
  id: string,
  payload: {
    url: string;
    caption?: string;
    visibility: "INTERNAL" | "CUSTOMER_VISIBLE";
  }
) {
  return serviceOrderRequest<ServiceOrderPhoto>(`/service-orders/${id}/photos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function completeServiceOrder(id: string) {
  return serviceOrderRequest<AdminServiceOrder>(`/service-orders/${id}/complete`, {
    method: "PATCH",
  });
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
