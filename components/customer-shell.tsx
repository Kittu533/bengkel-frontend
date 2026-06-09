"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { ProtectedRoute } from "@/components/protected-route";

const navItems = [
  { href: "/customer/dashboard", label: "Dashboard" },
  { href: "/customer/vehicles", label: "Kendaraan" },
  { href: "/customer/bookings", label: "Booking" },
  { href: "/customer/tracking", label: "Tracking" },
  { href: "/customer/history", label: "Riwayat" },
  { href: "/customer/invoices", label: "Invoice" },
];

export function CustomerShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700"
              >
                BengkelPro
              </Link>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                {description}
              </p>
            </div>
            <LogoutButton />
          </div>
          <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 pb-4">
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
        <section className="mx-auto max-w-6xl px-6 py-6">{children}</section>
      </main>
    </ProtectedRoute>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replaceAll("_", " ");
  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
      {normalized}
    </span>
  );
}
