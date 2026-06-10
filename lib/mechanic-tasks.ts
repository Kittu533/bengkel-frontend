"use client";

import { getSession } from "@/lib/auth";
import { CustomerVehicle } from "@/lib/customer";
import { ServiceOrderStatus } from "@/lib/admin-service-orders";

export type MechanicTaskItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type MechanicTaskNote = {
  id: string;
  note: string;
  visibility: "INTERNAL" | "CUSTOMER_VISIBLE";
  createdAt: string;
  user?: { id: string; name: string };
};

export type MechanicTaskPhoto = {
  id: string;
  url: string;
  caption: string | null;
  visibility: "INTERNAL" | "CUSTOMER_VISIBLE";
  createdAt: string;
};

export type MechanicChecklist = {
  id: string;
  title: string;
  isDone: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
};

export type MechanicTask = {
  id: string;
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
  serviceItems?: MechanicTaskItem[];
  sparepartItems?: MechanicTaskItem[];
  notes?: MechanicTaskNote[];
  photos?: MechanicTaskPhoto[];
  checklists?: MechanicChecklist[];
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

function queryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

async function mechanicRequest<T>(
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

export function listMechanicTasks(params: { search?: string; status?: string } = {}) {
  return mechanicRequest<Paginated<MechanicTask>>(
    `/mechanic/tasks${queryString(params)}`
  );
}

export function getMechanicTask(id: string) {
  return mechanicRequest<MechanicTask>(`/mechanic/tasks/${id}`);
}

export function updateMechanicTaskStatus(id: string, status: ServiceOrderStatus) {
  return mechanicRequest<MechanicTask>(`/mechanic/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function addMechanicNote(
  id: string,
  payload: { note: string; visibility: "INTERNAL" | "CUSTOMER_VISIBLE" }
) {
  return mechanicRequest<MechanicTaskNote>(`/mechanic/tasks/${id}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addMechanicPhoto(
  id: string,
  payload: { url: string; caption?: string; visibility: "INTERNAL" | "CUSTOMER_VISIBLE" }
) {
  return mechanicRequest<MechanicTaskPhoto>(`/mechanic/tasks/${id}/photos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addMechanicChecklist(
  id: string,
  payload: { title: string; isDone: boolean; note?: string }
) {
  return mechanicRequest<MechanicChecklist>(`/mechanic/tasks/${id}/checklist`, {
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
