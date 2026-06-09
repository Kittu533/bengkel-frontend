"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminShell,
  AdminStatusBadge,
} from "@/components/admin-shell";
import {
  AdminSparepart,
  Category,
  createSparepart,
  createSparepartCategory,
  deleteSparepart,
  formatRupiah,
  listSparepartCategories,
  listSpareparts,
  updateSparepart,
} from "@/lib/admin-master";

const emptySparepart = {
  categoryId: "",
  name: "",
  sku: "",
  brand: "",
  description: "",
  vehicleType: "MOTOR",
  stock: "0",
  minStock: "0",
  sellPrice: "",
  costPrice: "",
  isActive: true,
};

export default function AdminSparepartsPage() {
  const [spareparts, setSpareparts] = useState<AdminSparepart[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptySparepart);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadData(value = search) {
    setError("");
    setIsLoading(true);
    try {
      const [sparepartResult, categoryResult] = await Promise.all([
        listSpareparts(value),
        listSparepartCategories(),
      ]);
      setSpareparts(sparepartResult.data);
      setCategories(categoryResult.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    Promise.all([listSpareparts(), listSparepartCategories()])
      .then(([sparepartResult, categoryResult]) => {
        if (!isMounted) return;
        setSpareparts(sparepartResult.data);
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
    setForm(emptySparepart);
  }

  function editSparepart(sparepart: AdminSparepart) {
    setEditingId(sparepart.id);
    setForm({
      categoryId: sparepart.categoryId,
      name: sparepart.name,
      sku: sparepart.sku,
      brand: sparepart.brand,
      description: sparepart.description,
      vehicleType: sparepart.vehicleType === "MOBIL" ? "CAR" : sparepart.vehicleType,
      stock: String(sparepart.stock),
      minStock: String(sparepart.minStock),
      sellPrice: String(sparepart.sellPrice),
      costPrice: String(sparepart.costPrice),
      isActive: sparepart.isActive,
    });
  }

  async function submitSparepart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      sellPrice: Number(form.sellPrice),
      costPrice: Number(form.costPrice),
    };

    try {
      if (editingId) {
        await updateSparepart(editingId, payload);
      } else {
        await createSparepart(payload);
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
    await createSparepartCategory({ name: categoryName, isActive: true });
    setCategoryName("");
    await loadData();
  }

  async function removeSparepart(id: string) {
    if (!window.confirm("Nonaktifkan sparepart ini?")) return;
    await deleteSparepart(id);
    await loadData();
  }

  return (
    <AdminShell
      title="Master Sparepart"
      description="Kelola sparepart, harga modal, harga jual, dan batas stok minimum."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <form
            onSubmit={submitCategory}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              Kategori Sparepart
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
            onSubmit={submitSparepart}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              {editingId ? "Edit Sparepart" : "Tambah Sparepart"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
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
              <Field label="SKU" value={form.sku} onChange={(sku) => setForm({ ...form, sku })} />
              <Field label="Brand" value={form.brand} onChange={(brand) => setForm({ ...form, brand })} />
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
              <Field label="Stok" type="number" value={form.stock} onChange={(stock) => setForm({ ...form, stock })} />
              <Field label="Min Stok" type="number" value={form.minStock} onChange={(minStock) => setForm({ ...form, minStock })} />
              <Field label="Harga Jual" type="number" value={form.sellPrice} onChange={(sellPrice) => setForm({ ...form, sellPrice })} />
              <Field label="Harga Modal" type="number" value={form.costPrice} onChange={(costPrice) => setForm({ ...form, costPrice })} />
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
          {isLoading ? <AdminEmptyState text="Memuat sparepart..." /> : null}
          {!isLoading && spareparts.length === 0 ? (
            <AdminEmptyState text="Belum ada sparepart." />
          ) : null}
          {spareparts.map((sparepart) => {
            const lowStock = sparepart.stock <= sparepart.minStock;
            return (
              <article
                key={sparepart.id}
                className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {sparepart.name}
                      </h3>
                      <AdminStatusBadge isActive={sparepart.isActive} />
                      {lowStock ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase text-red-700">
                          Low Stock
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {sparepart.sku} · {sparepart.brand} ·{" "}
                      {sparepart.category?.name || "-"} · {sparepart.vehicleType}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Stok {sparepart.stock}/{sparepart.minStock} · Jual{" "}
                      {formatRupiah(sparepart.sellPrice)} · Modal{" "}
                      {formatRupiah(sparepart.costPrice)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editSparepart(sparepart)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeSparepart(sparepart.id)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
                      Nonaktifkan
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </AdminShell>
  );
}

function Search({ value, onChange, onSearch }: { value: string; onChange: (value: string) => void; onSearch: () => void }) {
  return (
    <div className="flex gap-2">
      <input className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2" placeholder="Cari sparepart, SKU, brand" value={value} onChange={(event) => onChange(event.target.value)} />
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
