"use client";

import { useEffect, useState } from "react";
import { CustomerShell, EmptyState, StatusBadge } from "@/components/customer-shell";
import {
  ActiveServiceOrder,
  fetchActiveServiceOrders,
  formatDate,
} from "@/lib/customer";

export default function CustomerTrackingPage() {
  const [orders, setOrders] = useState<ActiveServiceOrder[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveServiceOrders()
      .then(setOrders)
      .catch((fetchError) =>
        setError(fetchError instanceof Error ? fetchError.message : "Request gagal")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <CustomerShell
      title="Tracking Service"
      description="Lihat posisi pengerjaan service aktif milik customer."
    >
      {error ? <EmptyState title="Tracking gagal dimuat" description={error} /> : null}
      {isLoading ? (
        <EmptyState
          title="Memuat service aktif"
          description="Data tracking service sedang diambil."
        />
      ) : null}
      {!isLoading && orders.length === 0 ? (
        <EmptyState
          title="Tidak ada service aktif"
          description="Service aktif akan muncul saat kendaraan sedang dikerjakan."
        />
      ) : null}
      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">{order.code}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {order.serviceName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Step saat ini: {order.currentStep}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Estimasi selesai: {formatDate(order.estimatedFinishedAt)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-5 border-l-2 border-blue-200 pl-4">
              <p className="text-sm font-semibold text-slate-950">
                {order.currentStep}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Timeline detail akan diisi dari modul service order admin.
              </p>
            </div>
          </article>
        ))}
      </div>
    </CustomerShell>
  );
}
