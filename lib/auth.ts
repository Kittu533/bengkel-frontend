"use client";

export type Role =
  | "SUPER_ADMIN"
  | "OWNER"
  | "ADMIN"
  | "MECHANIC"
  | "CASHIER"
  | "CUSTOMER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  roles: Role[];
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthSession = AuthTokens & {
  user: AuthUser;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const STORAGE_KEY = "bengkelpro.auth";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = window.localStorage.getItem(STORAGE_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getDashboardPath(user: AuthUser) {
  if (user.roles.includes("ADMIN")) return "/admin/dashboard";
  if (user.roles.includes("OWNER")) return "/owner/dashboard";
  if (user.roles.includes("MECHANIC")) return "/mechanic/tasks";
  if (user.roles.includes("CUSTOMER")) return "/customer/dashboard";
  return "/403";
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  includeAuth = false
): Promise<T> {
  const session = includeAuth ? getSession() : null;
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
  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.message || "Request gagal");
  }

  return body.data;
}

export function registerCustomer(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser() {
  return apiRequest<{ user: AuthUser }>("/auth/me", {}, true);
}

export async function logout() {
  const session = getSession();
  clearSession();

  if (!session?.refreshToken) return;

  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
}

export function hasRole(user: AuthUser, allowedRoles: Role[]) {
  return allowedRoles.some((role) => user.roles.includes(role));
}
