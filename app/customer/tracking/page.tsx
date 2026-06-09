"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CustomerShell, EmptyState, StatusBadge } from "@/components/customer-shell";
import {
  CustomerTrackingDetail,
  fetchActiveServiceOrders,
  fetchCustomerServiceTracking,
  formatDate,
  formatRupiah,
} from "@/lib/customer";

export default function CustomerTrackingPage() {
  const [orders, setOrders] = useState<CustomerTrackingDetail[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchActiveServiceOrders()
      .then((activeOrders) =>
        Promise.all(
          activeOrders.map((order) => fetchCustomerServiceTracking(order.id))
        )
      )
      .then((trackingDetails) => {
        if (isMounted) setOrders(trackingDetails);
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
              <TimelineItem
                title="Check-in"
                description={order.customerComplaint || "Keluhan diterima admin."}
                date={order.checkInAt || order.startedAt}
              />
              <TimelineItem
                title={order.currentStep}
                description={
                  order.initialDiagnosis || "Progress service sedang berjalan."
                }
                date={order.startedAt}
              />
              {order.notes.map((note) => (
                <TimelineItem
                  key={note.id}
                  title="Catatan progress"
                  description={note.note}
                  date={note.createdAt}
                />
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <CostCard label="Jasa" value={order.totalServicePrice} />
              <CostCard label="Sparepart" value={order.totalSparepartPrice} />
              <CostCard label="Total" value={order.grandTotal} strong />
            </div>
            {order.photos.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {order.photos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="overflow-hidden rounded-md border border-slate-200"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || "Foto progress service"}
                      width={320}
                      height={180}
                      unoptimized
                      className="h-36 w-full object-cover"
                    />
                    {photo.caption ? (
                      <figcaption className="p-3 text-xs text-slate-600">
                        {photo.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </CustomerShell>
  );
}

function TimelineItem({
  title,
  description,
  date,
}: {
  title: string;
  description: string;
  date: string | null;
}) {
  return (
    <div className="relative pb-5 pl-4 before:absolute before:left-[-5px] before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-blue-600">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <p className="mt-1 text-xs text-slate-500">{formatDate(date)}</p>
    </div>
  );
}

function CostCard({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-sm ${strong ? "font-bold text-slate-950" : "font-semibold text-slate-700"}`}
      >
        {formatRupiah(value)}
      </p>
    </div>
  );
}
