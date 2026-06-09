"use client";

import { FormEvent, useEffect, useState } from "react";
import { CustomerShell, EmptyState } from "@/components/customer-shell";
import {
  createCustomerVehicle,
  CustomerVehicle,
  deleteCustomerVehicle,
  fetchCustomerVehicles,
  updateCustomerVehicle,
  VehiclePayload,
} from "@/lib/customer";

const emptyForm: VehiclePayload = {
  plateNumber: "",
  brand: "",
  model: "",
  vehicleType: "MOTOR",
  color: "",
  notes: "",
};

export default function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [form, setForm] = useState<VehiclePayload>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVehicles() {
    setError("");
    setIsLoading(true);
    try {
      setVehicles(await fetchCustomerVehicles());
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    fetchCustomerVehicles()
      .then((data) => {
        if (isMounted) setVehicles(data);
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

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function editVehicle(vehicle: CustomerVehicle) {
    setEditingId(vehicle.id);
    setForm({
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      vehicleType: vehicle.vehicleType,
      year: vehicle.year || undefined,
      color: vehicle.color || "",
      notes: vehicle.notes || "",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : undefined,
      };
      if (editingId) {
        await updateCustomerVehicle(editingId, payload);
      } else {
        await createCustomerVehicle(payload);
      }
      resetForm();
      await loadVehicles();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Request gagal"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      await deleteCustomerVehicle(id);
      await loadVehicles();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Request gagal"
      );
    }
  }

  return (
    <CustomerShell
      title="Kendaraan Saya"
      description="Kelola kendaraan yang akan digunakan untuk booking dan riwayat service."
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            {editingId ? "Edit Kendaraan" : "Tambah Kendaraan"}
          </h2>
          <div className="mt-4 space-y-4">
            <Field
              label="Nomor Polisi"
              value={form.plateNumber}
              onChange={(value) => setForm({ ...form, plateNumber: value })}
            />
            <Field
              label="Brand"
              value={form.brand}
              onChange={(value) => setForm({ ...form, brand: value })}
            />
            <Field
              label="Model"
              value={form.model}
              onChange={(value) => setForm({ ...form, model: value })}
            />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Tipe Kendaraan
              </span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={form.vehicleType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    vehicleType: event.target.value as "MOTOR" | "CAR",
                  })
                }
              >
                <option value="MOTOR">Motor</option>
                <option value="CAR">Mobil</option>
              </select>
            </label>
            <Field
              label="Tahun"
              type="number"
              value={form.year ? String(form.year) : ""}
              onChange={(value) =>
                setForm({ ...form, year: value ? Number(value) : undefined })
              }
              required={false}
            />
            <Field
              label="Warna"
              value={form.color || ""}
              onChange={(value) => setForm({ ...form, color: value })}
              required={false}
            />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Catatan</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={form.notes || ""}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {isSubmitting ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
            ) : null}
          </div>
        </form>

        <section className="space-y-4">
          {isLoading ? (
            <EmptyState
              title="Memuat kendaraan"
              description="Data kendaraan customer sedang diambil."
            />
          ) : null}
          {!isLoading && vehicles.length === 0 ? (
            <EmptyState
              title="Belum ada kendaraan"
              description="Tambahkan kendaraan pertama untuk mulai booking service."
            />
          ) : null}
          {vehicles.map((vehicle) => (
            <article
              key={vehicle.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                    {vehicle.plateNumber}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {vehicle.vehicleType === "MOTOR" ? "Motor" : "Mobil"}
                    {vehicle.year ? ` · ${vehicle.year}` : ""}
                    {vehicle.color ? ` · ${vehicle.color}` : ""}
                  </p>
                  {vehicle.notes ? (
                    <p className="mt-3 text-sm text-slate-600">{vehicle.notes}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editVehicle(vehicle)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(vehicle.id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
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
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
