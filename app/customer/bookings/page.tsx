"use client";

import { useEffect, useState } from "react";
import { CustomerShell, EmptyState, StatusBadge } from "@/components/customer-shell";
import { CustomerBooking, fetchCustomerBookings, formatDate } from "@/lib/customer";

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomerBookings()
      .then(setBookings)
      .catch((fetchError) =>
        setError(fetchError instanceof Error ? fetchError.message : "Request gagal")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <CustomerShell
      title="Booking Saya"
      description="Pantau jadwal booking service yang sudah dibuat dari akun customer."
    >
      {error ? <EmptyState title="Booking gagal dimuat" description={error} /> : null}
      {isLoading ? (
        <EmptyState title="Memuat booking" description="Data booking sedang diambil." />
      ) : null}
      {!isLoading && bookings.length === 0 ? (
        <EmptyState
          title="Belum ada booking"
          description="Booking service akan muncul di sini setelah modul booking aktif."
        />
      ) : null}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <article
            key={booking.id}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">{booking.code}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {booking.serviceName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Jadwal: {formatDate(booking.scheduleAt)}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
          </article>
        ))}
      </div>
    </CustomerShell>
  );
}
