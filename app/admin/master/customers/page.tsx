"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminShell,
  AdminStatusBadge,
} from "@/components/admin-shell";
import {
  AdminCustomer,
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "@/lib/admin-master";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  status: "ACTIVE",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadCustomers(value = search) {
    setError("");
    setIsLoading(true);
    try {
      const result = await listCustomers(value);
      setCustomers(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    listCustomers()
      .then((result) => {
        if (isMounted) setCustomers(result.data);
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

  function editCustomer(customer: AdminCustomer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      password: "",
      status: customer.user?.status || "ACTIVE",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      ...(editingId && !form.password ? { password: undefined } : {}),
    };

    try {
      if (editingId) {
        await updateCustomer(editingId, payload);
      } else {
        await createCustomer(payload);
      }
      resetForm();
      await loadCustomers();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Request gagal"
      );
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Nonaktifkan customer ini?")) return;
    await deleteCustomer(id);
    await loadCustomers();
  }

  return (
    <AdminShell
      title="Master Customer"
      description="Kelola data customer bengkel, status akun, dan kontak utama."
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={submit}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            {editingId ? "Edit Customer" : "Tambah Customer"}
          </h2>
          <div className="mt-4 space-y-4">
            <Field label="Nama" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <Field label="Nomor HP" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
            <Field
              label={editingId ? "Password Baru" : "Password"}
              type="password"
              value={form.password}
              required={!editingId}
              onChange={(password) => setForm({ ...form, password })}
            />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
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
          <SearchBar
            value={search}
            onChange={setSearch}
            onSearch={() => loadCustomers(search)}
          />
          {isLoading ? <AdminEmptyState text="Memuat customer..." /> : null}
          {!isLoading && customers.length === 0 ? (
            <AdminEmptyState text="Belum ada customer." />
          ) : null}
          {customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {customer.name}
                    </h3>
                    <AdminStatusBadge isActive={customer.user?.status === "ACTIVE"} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {customer.email} · {customer.phone}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Kendaraan aktif: {customer.vehicles?.length || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editCustomer(customer)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(customer.id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                  >
                    Nonaktifkan
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

function SearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
        placeholder="Cari nama, email, atau nomor HP"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        onClick={onSearch}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
      >
        Cari
      </button>
    </div>
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
