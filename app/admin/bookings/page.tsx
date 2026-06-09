"use client";

import { useEffect, useState } from "react";
import { AdminEmptyState, AdminShell } from "@/components/admin-shell";
import {
  acceptBooking,
  AdminBooking,
  cancelBooking,
  convertBookingToServiceOrder,
  formatDate,
  listAdminBookings,
  rejectBooking,
  rescheduleBooking,
} from "@/lib/admin-bookings";

const statuses = [
  "",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "RESCHEDULED",
  "CANCELLED",
  "CONVERTED",
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  function fetchBookingData(nextSearch = search, nextStatus = status) {
    return listAdminBookings({
      search: nextSearch,
      status: nextStatus,
    });
  }

  async function loadData(nextSearch = search, nextStatus = status) {
    setError("");
    setIsLoading(true);
    try {
      const result = await fetchBookingData(nextSearch, nextStatus);
      setBookings(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    listAdminBookings()
      .then((result) => {
        if (isMounted) setBookings(result.data);
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Request gagal");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function runAction(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Request gagal");
    }
  }

  function askReason(label: string) {
    return window.prompt(label)?.trim() || "";
  }

  function askReschedule() {
    const value = window
      .prompt("Jadwal baru format YYYY-MM-DD HH:mm, contoh 2026-06-10 09:00")
      ?.trim();
    if (!value) return null;
    const [bookingDate, bookingTime] = value.split(" ");
    if (!bookingDate || !bookingTime) return null;
    const reason = askReason("Catatan reschedule");
    if (!reason) return null;
    return { bookingDate, bookingTime, reason };
  }

  return (
    <AdminShell
      title="Booking Management"
      description="Kelola booking customer dari pending sampai convert menjadi service order."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <input
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Cari kode, customer, layanan, atau plat"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item || "ALL"} value={item}>
                {item || "Semua status"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadData(search, status)}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Filter
          </button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {isLoading ? <AdminEmptyState text="Memuat booking..." /> : null}
        {!isLoading && bookings.length === 0 ? (
          <AdminEmptyState text="Belum ada booking." />
        ) : null}

        {bookings.map((booking) => (
          <article
            key={booking.id}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-blue-700">
                    {booking.code}
                  </p>
                  <StatusBadge status={booking.status} />
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {booking.serviceName}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {booking.customer?.name || "-"} ·{" "}
                  {booking.vehicle?.plateNumber || "-"} ·{" "}
                  {formatDate(booking.scheduleAt)}
                </p>
                {booking.notes ? (
                  <p className="mt-3 whitespace-pre-line rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    {booking.notes}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  label="Accept"
                  disabled={!["PENDING", "RESCHEDULED"].includes(booking.status)}
                  onClick={() => runAction(() => acceptBooking(booking.id))}
                />
                <ActionButton
                  label="Reject"
                  disabled={!["PENDING", "ACCEPTED", "RESCHEDULED"].includes(
                    booking.status
                  )}
                  tone="danger"
                  onClick={() => {
                    const reason = askReason("Alasan reject");
                    if (reason) runAction(() => rejectBooking(booking.id, reason));
                  }}
                />
                <ActionButton
                  label="Reschedule"
                  disabled={!["PENDING", "ACCEPTED", "RESCHEDULED"].includes(
                    booking.status
                  )}
                  onClick={() => {
                    const payload = askReschedule();
                    if (payload) {
                      runAction(() => rescheduleBooking(booking.id, payload));
                    }
                  }}
                />
                <ActionButton
                  label="Cancel"
                  disabled={!["PENDING", "ACCEPTED", "RESCHEDULED"].includes(
                    booking.status
                  )}
                  tone="danger"
                  onClick={() => {
                    const reason = askReason("Alasan cancel");
                    if (reason) runAction(() => cancelBooking(booking.id, reason));
                  }}
                />
                <ActionButton
                  label="Convert"
                  disabled={booking.status !== "ACCEPTED"}
                  tone="success"
                  onClick={() =>
                    runAction(() => convertBookingToServiceOrder(booking.id))
                  }
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
      {status.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}

function ActionButton({
  label,
  disabled,
  tone = "default",
  onClick,
}: {
  label: string;
  disabled: boolean;
  tone?: "default" | "danger" | "success";
  onClick: () => void;
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 text-red-700"
      : tone === "success"
        ? "border-emerald-200 text-emerald-700"
        : "border-slate-300 text-slate-700";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 ${toneClass}`}
    >
      {label}
    </button>
  );
}
