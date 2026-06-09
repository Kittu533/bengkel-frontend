"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { ProtectedRoute } from "@/components/protected-route";
import {
  AdminBooking,
  AdminDashboardSummary,
  AdminServiceOrder,
  fetchActiveServiceOrders,
  fetchAdminDashboardSummary,
  fetchLowStockSpareparts,
  fetchRevenueChart,
  fetchTodayBookings,
  formatDate,
  formatRupiah,
  LowStockSparepart,
  RevenuePoint,
} from "@/lib/admin-dashboard";

type DashboardData = {
  summary: AdminDashboardSummary;
  bookings: AdminBooking[];
  serviceOrders: AdminServiceOrder[];
  lowStock: LowStockSparepart[];
  revenue: RevenuePoint[];
};

const emptySummary: AdminDashboardSummary = {
  todayBookings: 0,
  activeServiceOrders: 0,
  unpaidInvoices: 0,
  lowStockItems: 0,
  totalCustomers: 0,
  totalVehicles: 0,
  monthlyRevenue: 0,
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    summary: emptySummary,
    bookings: [],
    serviceOrders: [],
    lowStock: [],
    revenue: [],
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchAdminDashboardSummary(),
      fetchTodayBookings(),
      fetchActiveServiceOrders(),
      fetchLowStockSpareparts(),
      fetchRevenueChart(),
    ])
      .then(([summary, bookings, serviceOrders, lowStock, revenue]) => {
        if (!isMounted) return;
        setData({ summary, bookings, serviceOrders, lowStock, revenue });
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Request gagal");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const maxRevenue = useMemo(
    () => Math.max(...data.revenue.map((item) => item.revenue), 1),
    [data.revenue]
  );

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <main className="min-h-screen bg-slate-50">
        <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
          <aside className="border-r border-slate-200 bg-white px-5 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              BengkelPro
            </p>
            <h1 className="mt-4 text-xl font-semibold text-slate-950">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Ringkasan operasional bengkel untuk booking, service, stok, dan
              revenue.
            </p>
            <nav className="mt-6 space-y-2">
              {["Overview", "Booking", "Service", "Inventory", "Revenue"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {item}
                  </a>
                )
              )}
            </nav>
          </aside>

          <section className="px-6 py-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Overview Operasional
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Data berubah mengikuti booking, service order, invoice, dan
                  stok sparepart terbaru.
                </p>
              </div>
              <LogoutButton />
            </header>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <section id="overview" className="mt-6 grid gap-4 md:grid-cols-4">
              <StatCard
                label="Booking Hari Ini"
                value={data.summary.todayBookings}
                isLoading={isLoading}
              />
              <StatCard
                label="Service Aktif"
                value={data.summary.activeServiceOrders}
                isLoading={isLoading}
              />
              <StatCard
                label="Invoice Belum Lunas"
                value={data.summary.unpaidInvoices}
                isLoading={isLoading}
              />
              <StatCard
                label="Stok Menipis"
                value={data.summary.lowStockItems}
                isLoading={isLoading}
                tone={data.summary.lowStockItems > 0 ? "danger" : "default"}
              />
            </section>

            <section className="mt-4 grid gap-4 md:grid-cols-3">
              <StatCard
                label="Total Customer"
                value={data.summary.totalCustomers}
                isLoading={isLoading}
              />
              <StatCard
                label="Total Kendaraan"
                value={data.summary.totalVehicles}
                isLoading={isLoading}
              />
              <StatCard
                label="Revenue Bulan Ini"
                value={formatRupiah(data.summary.monthlyRevenue)}
                isLoading={isLoading}
              />
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel id="booking" title="Booking Hari Ini">
                <BookingTable bookings={data.bookings} isLoading={isLoading} />
              </Panel>

              <Panel id="inventory" title="Low Stock Alert">
                <LowStockList items={data.lowStock} isLoading={isLoading} />
              </Panel>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Panel id="service" title="Service Aktif">
                <ServiceOrderList
                  serviceOrders={data.serviceOrders}
                  isLoading={isLoading}
                />
              </Panel>

              <Panel id="revenue" title="Revenue Chart">
                <div className="flex h-64 items-end gap-3">
                  {isLoading ? (
                    <SkeletonRows />
                  ) : data.revenue.length === 0 ? (
                    <EmptyState text="Belum ada data revenue." />
                  ) : (
                    data.revenue.map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <div
                          className="w-full rounded-t-md bg-blue-600"
                          style={{
                            height: `${Math.max((item.revenue / maxRevenue) * 210, 8)}px`,
                          }}
                          title={formatRupiah(item.revenue)}
                        />
                        <span className="text-xs font-medium text-slate-500">
                          {item.label}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  isLoading,
  tone = "default",
}: {
  label: string;
  value: string | number;
  isLoading: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {isLoading ? (
        <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
      ) : (
        <p
          className={`mt-3 text-2xl font-semibold ${
            tone === "danger" ? "text-red-700" : "text-slate-950"
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function Panel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BookingTable({
  bookings,
  isLoading,
}: {
  bookings: AdminBooking[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (bookings.length === 0) {
    return <EmptyState text="Belum ada booking untuk hari ini." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 font-semibold">Kode</th>
            <th className="py-2 font-semibold">Customer</th>
            <th className="py-2 font-semibold">Service</th>
            <th className="py-2 font-semibold">Jadwal</th>
            <th className="py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-slate-200">
              <td className="py-3 font-medium text-slate-950">{booking.code}</td>
              <td className="py-3 text-slate-700">{booking.customer.name}</td>
              <td className="py-3 text-slate-700">{booking.serviceName}</td>
              <td className="py-3 text-slate-700">
                {formatDate(booking.scheduleAt)}
              </td>
              <td className="py-3 text-slate-700">{booking.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceOrderList({
  serviceOrders,
  isLoading,
}: {
  serviceOrders: AdminServiceOrder[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (serviceOrders.length === 0) {
    return <EmptyState text="Tidak ada service aktif." />;
  }

  return (
    <div className="space-y-3">
      {serviceOrders.map((order) => (
        <article
          key={order.id}
          className="rounded-md border border-slate-200 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">{order.code}</p>
              <p className="mt-1 font-semibold text-slate-950">
                {order.serviceName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {order.customer.name} · {order.currentStep}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
              {order.status}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function LowStockList({
  items,
  isLoading,
}: {
  items: LowStockSparepart[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (items.length === 0) {
    return <EmptyState text="Tidak ada sparepart stok menipis." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-md border border-red-100 bg-red-50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-red-950">{item.name}</p>
              <p className="mt-1 text-sm text-red-700">
                {item.sku} · {item.brand}
              </p>
            </div>
            <p className="text-sm font-semibold text-red-800">
              {item.stock}/{item.minStock}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      <div className="h-10 rounded bg-slate-100" />
      <div className="h-10 rounded bg-slate-100" />
      <div className="h-10 rounded bg-slate-100" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}
