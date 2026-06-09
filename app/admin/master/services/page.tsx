"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminShell,
  AdminStatusBadge,
} from "@/components/admin-shell";
import {
  AdminServiceCatalog,
  Category,
  createServiceCatalog,
  createServiceCategory,
  deleteServiceCatalog,
  formatRupiah,
  listServiceCatalogs,
  listServiceCategories,
  updateServiceCatalog,
} from "@/lib/admin-master";

const emptyService = {
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  vehicleType: "MOTOR",
  price: "",
  estimatedDurationMinutes: "30",
  isActive: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminServiceCatalog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyService);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadData(value = search) {
    setError("");
    setIsLoading(true);
    try {
      const [serviceResult, categoryResult] = await Promise.all([
        listServiceCatalogs(value),
        listServiceCategories(),
      ]);
      setServices(serviceResult.data);
      setCategories(categoryResult.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    Promise.all([listServiceCatalogs(), listServiceCategories()])
      .then(([serviceResult, categoryResult]) => {
        if (!isMounted) return;
        setServices(serviceResult.data);
        setCategories(categoryResult.data);
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

  function resetForm() {
    setEditingId("");
    setForm(emptyService);
  }

  function editService(service: AdminServiceCatalog) {
    setEditingId(service.id);
    setForm({
      categoryId: service.categoryId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      vehicleType: service.vehicleType === "MOBIL" ? "CAR" : service.vehicleType,
      price: String(service.price),
      estimatedDurationMinutes: String(service.estimatedDurationMinutes),
      isActive: service.isActive,
    });
  }

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      price: Number(form.price),
      estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
    };

    try {
      if (editingId) {
        await updateServiceCatalog(editingId, payload);
      } else {
        await createServiceCatalog(payload);
      }
      resetForm();
      await loadData();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Request gagal"
      );
    }
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName) return;
    await createServiceCategory({ name: categoryName, isActive: true });
    setCategoryName("");
    await loadData();
  }

  async function removeService(id: string) {
    if (!window.confirm("Nonaktifkan service ini?")) return;
    await deleteServiceCatalog(id);
    await loadData();
  }

  return (
    <AdminShell
      title="Master Service"
      description="Kelola kategori dan katalog service yang tampil ke public catalog."
    >
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <form
            onSubmit={submitCategory}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              Kategori Service
            </h2>
            <div className="mt-4 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
                placeholder="Nama kategori"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
              <button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
                Add
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </form>

          <form
            onSubmit={submitService}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              {editingId ? "Edit Service" : "Tambah Service"}
            </h2>
            <div className="mt-4 space-y-4">
              <Select
                label="Kategori"
                value={form.categoryId}
                onChange={(categoryId) => setForm({ ...form, categoryId })}
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />
              <Field label="Nama" value={form.name} onChange={(name) => setForm({ ...form, name })} />
              <Field label="Slug" value={form.slug} required={false} onChange={(slug) => setForm({ ...form, slug })} />
              <Field label="Deskripsi" value={form.description} onChange={(description) => setForm({ ...form, description })} />
              <Select
                label="Tipe Kendaraan"
                value={form.vehicleType}
                onChange={(vehicleType) => setForm({ ...form, vehicleType })}
                options={[
                  { value: "MOTOR", label: "Motor" },
                  { value: "CAR", label: "Mobil" },
                ]}
              />
              <Field label="Harga" type="number" value={form.price} onChange={(price) => setForm({ ...form, price })} />
              <Field
                label="Durasi Menit"
                type="number"
                value={form.estimatedDurationMinutes}
                onChange={(estimatedDurationMinutes) =>
                  setForm({ ...form, estimatedDurationMinutes })
                }
              />
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                />
                Active
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
        </div>

        <section className="space-y-4">
          <Search value={search} onChange={setSearch} onSearch={() => loadData(search)} />
          {isLoading ? <AdminEmptyState text="Memuat service..." /> : null}
          {!isLoading && services.length === 0 ? (
            <AdminEmptyState text="Belum ada service catalog." />
          ) : null}
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {service.name}
                    </h3>
                    <AdminStatusBadge isActive={service.isActive} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {service.category?.name || "-"} · {service.vehicleType} ·{" "}
                    {service.estimatedDurationMinutes} menit
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {formatRupiah(service.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editService(service)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Edit
                  </button>
                  <button type="button" onClick={() => removeService(service.id)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
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

function Search({ value, onChange, onSearch }: { value: string; onChange: (value: string) => void; onSearch: () => void }) {
  return (
    <div className="flex gap-2">
      <input className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2" placeholder="Cari service" value={value} onChange={(event) => onChange(event.target.value)} />
      <button type="button" onClick={onSearch} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Cari</button>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={value} required onChange={(event) => onChange(event.target.value)}>
        <option value="">Pilih</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Field({ label, value, onChange, type = "text", required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
