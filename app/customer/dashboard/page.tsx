"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerShell, EmptyState } from "@/components/customer-shell";
import {
  CustomerDashboardSummary,
  fetchCustomerDashboard,
} from "@/lib/customer";

const cards = [
  {
    key: "totalVehicles",
    label: "Kendaraan",
    href: "/customer/vehicles",
  },
  {
    key: "activeBookings",
    label: "Booking Aktif",
    href: "/customer/bookings",
  },
  {
    key: "activeServiceOrders",
    label: "Service Aktif",
    href: "/customer/tracking",
  },
  {
    key: "serviceHistory",
    label: "Riwayat Service",
    href: "/customer/history",
  },
  {
    key: "unpaidInvoices",
    label: "Invoice Belum Lunas",
    href: "/customer/invoices",
  },
] as const;

export default function CustomerDashboardPage() {
  const [summary, setSummary] = useState<CustomerDashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomerDashboard()
      .then(setSummary)
      .catch((fetchError) =>
        setError(fetchError instanceof Error ? fetchError.message : "Request gagal")
      );
  }, []);

  return (
    <CustomerShell
      title="Customer Dashboard"
      description="Ringkasan kendaraan, booking, tracking service, riwayat, dan invoice."
    >
      {error ? (
        <EmptyState title="Dashboard gagal dimuat" description={error} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {summary ? summary[card.key] : "-"}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Progress Feature 02
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          CRUD kendaraan sudah aktif. Booking, tracking, riwayat service, dan
          invoice sudah punya halaman dan endpoint customer-safe sebagai dasar
          untuk modul booking dan service order berikutnya.
        </p>
      </div>
    </CustomerShell>
  );
}
