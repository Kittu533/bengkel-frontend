"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminEmptyState, AdminShell } from "@/components/admin-shell";
import {
  AdminCustomer,
  AdminVehicle,
  createVehicle,
  deleteVehicle,
  listCustomers,
  listVehicles,
  updateVehicle,
} from "@/lib/admin-master";

const emptyForm = {
  customerId: "",
  plateNumber: "",
  brand: "",
  model: "",
  vehicleType: "MOTOR",
  year: "",
  color: "",
  notes: "",
};

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadVehicles(value = search) {
    setError("");
    setIsLoading(true);
    try {
      const result = await listVehicles(value);
      setVehicles(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    Promise.all([listVehicles(), listCustomers()])
      .then(([vehicleResult, customerResult]) => {
        if (!isMounted) return;
        setVehicles(vehicleResult.data);
        setCustomers(customerResult.data);
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Request gagal");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function resetForm() {
    setEditingId("");
    setForm(emptyForm);
  }

  function editVehicle(vehicle: AdminVehicle) {
    setEditingId(vehicle.id);
    setForm({
      customerId: vehicle.customerId,
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      vehicleType: vehicle.vehicleType === "MOBIL" ? "CAR" : vehicle.vehicleType,
      year: vehicle.year ? String(vehicle.year) : "",
      color: vehicle.color || "",
      notes: "",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      year: form.year ? Number(form.year) : undefined,
    };

    try {
      if (editingId) {
        await updateVehicle(editingId, payload);
      } else {
        await createVehicle(payload);
      }
      resetForm();
      await loadVehicles();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Request gagal"
      );
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus kendaraan ini?")) return;
    await deleteVehicle(id);
    await loadVehicles();
  }

  return (
    <AdminShell
      title="Master Kendaraan"
      description="Kelola kendaraan customer untuk booking dan service order."
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={submit}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            {editingId ? "Edit Kendaraan" : "Tambah Kendaraan"}
          </h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Customer</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.customerId}
                required
                onChange={(event) =>
                  setForm({ ...form, customerId: event.target.value })
                }
              >
                <option value="">Pilih customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Nomor Polisi" value={form.plateNumber} onChange={(plateNumber) => setForm({ ...form, plateNumber })} />
            <Field label="Brand" value={form.brand} onChange={(brand) => setForm({ ...form, brand })} />
            <Field label="Model" value={form.model} onChange={(model) => setForm({ ...form, model })} />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Tipe Kendaraan
              </span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.vehicleType}
                onChange={(event) =>
                  setForm({ ...form, vehicleType: event.target.value })
                }
              >
                <option value="MOTOR">Motor</option>
                <option value="CAR">Mobil</option>
              </select>
            </label>
            <Field label="Tahun" type="number" value={form.year} required={false} onChange={(year) => setForm({ ...form, year })} />
            <Field label="Warna" value={form.color} required={false} onChange={(color) => setForm({ ...form, color })} />
          </div>
          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          <div className="mt-5 flex gap-3">
            <button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              {editingId ? "Update" : "Simpan"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Batal
              </button>
            ) : null}
          </div>
        </form>

        <section className="space-y-4">
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Cari plat, brand, model, customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              onClick={() => loadVehicles(search)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Cari
            </button>
          </div>
          {isLoading ? <AdminEmptyState text="Memuat kendaraan..." /> : null}
          {!isLoading && vehicles.length === 0 ? (
            <AdminEmptyState text="Belum ada kendaraan." />
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
                    {vehicle.customer?.name || "-"} · {vehicle.vehicleType}
                    {vehicle.year ? ` · ${vehicle.year}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editVehicle(vehicle)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(vehicle.id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
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
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
