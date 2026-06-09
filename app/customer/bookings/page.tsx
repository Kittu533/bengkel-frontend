"use client";

import { FormEvent, useEffect, useState } from "react";
import { CustomerShell, EmptyState, StatusBadge } from "@/components/customer-shell";
import {
  createBooking,
  CustomerBooking,
  CustomerVehicle,
  fetchCustomerBookings,
  fetchCustomerVehicles,
  formatDate,
} from "@/lib/customer";
import {
  fetchServiceCatalogs,
  formatRupiah,
  ServiceCatalog,
} from "@/lib/public-catalog";

const emptyForm = {
  vehicleId: "",
  serviceCatalogId: "",
  bookingDate: "",
  bookingTime: "",
  complaint: "",
};

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchBookingPageData() {
    return Promise.all([
      fetchCustomerBookings(),
      fetchCustomerVehicles(),
      fetchServiceCatalogs({ limit: "100" }),
    ]);
  }

  async function loadData() {
    setError("");
    const [bookingResult, vehicleResult, serviceResult] =
      await fetchBookingPageData();
    setBookings(bookingResult);
    setVehicles(vehicleResult);
    setServices(serviceResult.data);
  }

  useEffect(() => {
    let isMounted = true;

    fetchBookingPageData()
      .then(([bookingResult, vehicleResult, serviceResult]) => {
        if (!isMounted) return;
        setBookings(bookingResult);
        setVehicles(vehicleResult);
        setServices(serviceResult.data);
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

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await createBooking(form);
      setForm(emptyForm);
      setSuccess("Booking berhasil dibuat. Admin akan mengonfirmasi jadwal.");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CustomerShell
      title="Booking Saya"
      description="Buat booking service dan pantau status konfirmasi dari admin."
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={submitBooking}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">Buat Booking</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pilih kendaraan, layanan, jadwal, dan tulis keluhan kendaraan.
          </p>
          <div className="mt-5 space-y-4">
            <Select
              label="Kendaraan"
              value={form.vehicleId}
              onChange={(vehicleId) => setForm({ ...form, vehicleId })}
              options={vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}`,
              }))}
            />
            <Select
              label="Layanan"
              value={form.serviceCatalogId}
              onChange={(serviceCatalogId) =>
                setForm({ ...form, serviceCatalogId })
              }
              options={services.map((service) => ({
                value: service.id,
                label: `${service.name} - ${formatRupiah(service.price)}`,
              }))}
            />
            <Field
              label="Tanggal"
              type="date"
              value={form.bookingDate}
              onChange={(bookingDate) => setForm({ ...form, bookingDate })}
            />
            <Field
              label="Jam"
              type="time"
              value={form.bookingTime}
              onChange={(bookingTime) => setForm({ ...form, bookingTime })}
            />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Keluhan</span>
              <textarea
                className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Contoh: mesin kasar saat langsam"
                value={form.complaint}
                required
                onChange={(event) =>
                  setForm({ ...form, complaint: event.target.value })
                }
              />
            </label>
          </div>
          {success ? (
            <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </p>
          ) : null}
          <button
            className="mt-5 w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting || vehicles.length === 0 || services.length === 0}
          >
            {isSubmitting ? "Mengirim..." : "Submit Booking"}
          </button>
          {vehicles.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Tambahkan kendaraan dulu sebelum membuat booking.
            </p>
          ) : null}
        </form>

        <section className="space-y-4">
      {error ? <EmptyState title="Booking gagal dimuat" description={error} /> : null}
      {isLoading ? (
        <EmptyState title="Memuat booking" description="Data booking sedang diambil." />
      ) : null}
      {!isLoading && bookings.length === 0 ? (
        <EmptyState
          title="Belum ada booking"
          description="Booking service akan muncul setelah kamu submit form."
        />
      ) : null}
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
                <p className="mt-1 text-sm text-slate-600">
                  Kendaraan: {booking.vehicle?.plateNumber || "-"}
                </p>
                {booking.notes ? (
                  <p className="mt-3 whitespace-pre-line rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    {booking.notes}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={booking.status} />
            </div>
          </article>
        ))}
        </section>
      </div>
    </CustomerShell>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Pilih</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
