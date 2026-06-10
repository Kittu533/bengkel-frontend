"use client";

import { getSession } from "@/lib/auth";

export type SubscriptionPlan = {
  id: string;
  name: string;
  code: string;
  priceMonthly: number;
  maxBranches: number | null;
  maxUsers: number | null;
  features: string | null;
  isActive: boolean;
  _count?: { subscriptions: number };
};

export type TenantSubscription = {
  id: string;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
  startedAt: string;
  endsAt: string | null;
  plan: SubscriptionPlan;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  billingEmail: string | null;
  phone: string | null;
  address: string | null;
  branches: { id: string; name: string; code: string; status: string }[];
  subscriptions: TenantSubscription[];
  _count?: {
    branches: number;
    users: number;
    customers: number;
    serviceOrders: number;
    invoices: number;
  };
};

export type AuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: Paginated<T>["meta"];
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

async function superAdminRequest<T>(
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

export function listTenants(params: { search?: string; status?: string } = {}) {
  return superAdminRequest<Paginated<Tenant>>(
    `/super-admin/tenants${queryString(params)}`
  );
}

export function createTenant(payload: Record<string, unknown>) {
  return superAdminRequest<Tenant>("/super-admin/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTenant(id: string, payload: Record<string, unknown>) {
  return superAdminRequest<Tenant>(`/super-admin/tenants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateTenant(id: string) {
  return superAdminRequest<Tenant>(`/super-admin/tenants/${id}`, {
    method: "DELETE",
  });
}

export function listPlans() {
  return superAdminRequest<SubscriptionPlan[]>("/super-admin/plans");
}

export function createPlan(payload: Record<string, unknown>) {
  return superAdminRequest<SubscriptionPlan>("/super-admin/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePlan(id: string, payload: Record<string, unknown>) {
  return superAdminRequest<SubscriptionPlan>(`/super-admin/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivatePlan(id: string) {
  return superAdminRequest<SubscriptionPlan>(`/super-admin/plans/${id}`, {
    method: "DELETE",
  });
}

export function listAuditLogs(
  params: {
    search?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  return superAdminRequest<Paginated<AuditLog>>(
    `/super-admin/audit-logs${queryString(params)}`
  );
}

export async function exportAuditLogsCsv(
  params: {
    search?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  } = {}
) {
  const session = getSession();
  const response = await fetch(
    `${API_URL}/super-admin/audit-logs/export.csv${queryString(params)}`,
    {
      headers: {
        ...(session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Export audit log gagal");
  }

  return response.blob();
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
