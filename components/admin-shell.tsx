"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { ProtectedRoute } from "@/components/protected-route";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/master/customers", label: "Customers" },
  { href: "/admin/master/vehicles", label: "Vehicles" },
  { href: "/admin/master/services", label: "Services" },
  { href: "/admin/master/spareparts", label: "Spareparts" },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin/dashboard"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700"
              >
                BengkelPro Admin
              </Link>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                {description}
              </p>
            </div>
            <LogoutButton />
          </div>
          <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-200 hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <section className="mx-auto max-w-7xl px-6 py-6">{children}</section>
      </main>
    </ProtectedRoute>
  );
}

export function AdminEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

export function AdminStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
