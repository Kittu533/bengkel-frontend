"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminEmptyState, AdminShell } from "@/components/admin-shell";
import {
  AdminCustomer,
  AdminServiceCatalog,
  AdminSparepart,
  AdminVehicle,
  listCustomers,
  listServiceCatalogs,
  listSpareparts,
  listVehicles,
} from "@/lib/admin-master";
import {
  addServiceItem,
  addServiceOrderNote,
  addServiceOrderPhoto,
  addSparepartItem,
  AdminServiceOrder,
  assignMechanic,
  completeServiceOrder,
  createServiceOrder,
  formatDate,
  formatRupiah,
  listServiceOrders,
  ServiceOrderStatus,
  updateServiceOrderStatus,
} from "@/lib/admin-service-orders";

const statuses: ServiceOrderStatus[] = [
  "WAITING",
  "CHECKED_IN",
  "DIAGNOSIS",
  "WAITING_APPROVAL",
  "IN_PROGRESS",
  "WAITING_SPAREPART",
  "QUALITY_CHECK",
  "READY_TO_PICKUP",
  "COMPLETED",
  "CANCELLED",
];

const emptyForm = {
  customerId: "",
  vehicleId: "",
  serviceCatalogId: "",
  customerComplaint: "",
  initialDiagnosis: "",
  mileageIn: "",
  estimatedFinishedAt: "",
};

export default function AdminServiceOrdersPage() {
  const [orders, setOrders] = useState<AdminServiceOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [services, setServices] = useState<AdminServiceCatalog[]>([]);
  const [spareparts, setSpareparts] = useState<AdminSparepart[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredVehicles = useMemo(
    () =>
      form.customerId
        ? vehicles.filter((vehicle) => vehicle.customerId === form.customerId)
        : vehicles,
    [form.customerId, vehicles]
  );

  async function loadOrders(nextSearch = search, nextStatus = status) {
    setError("");
    setIsLoading(true);
    try {
      const result = await listServiceOrders({
        search: nextSearch,
        status: nextStatus,
      });
      setOrders(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      listServiceOrders(),
      listCustomers(),
      listVehicles(),
      listServiceCatalogs(),
      listSpareparts(),
    ])
      .then(([orderResult, customerResult, vehicleResult, serviceResult, sparepartResult]) => {
        if (!isMounted) return;
        setOrders(orderResult.data);
        setCustomers(customerResult.data);
        setVehicles(vehicleResult.data);
        setServices(serviceResult.data);
        setSpareparts(sparepartResult.data);
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

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await createServiceOrder({
        ...form,
        mileageIn: form.mileageIn ? Number(form.mileageIn) : undefined,
        estimatedFinishedAt: form.estimatedFinishedAt
          ? new Date(form.estimatedFinishedAt).toISOString()
          : undefined,
      });
      setForm(emptyForm);
      await loadOrders();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
      await loadOrders();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Request gagal");
    }
  }

  function promptQuantity(label: string) {
    const value = window.prompt(label, "1");
    const quantity = Number(value);
    return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
  }

  return (
    <AdminShell
      title="Service Orders"
      description="Kelola proses pengerjaan kendaraan, item service, sparepart, notes, dan status tracking."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={submitOrder}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            Buat Service Order
          </h2>
          <div className="mt-5 space-y-4">
            <Select
              label="Customer"
              value={form.customerId}
              onChange={(customerId) =>
                setForm({ ...form, customerId, vehicleId: "" })
              }
              options={customers.map((customer) => ({
                value: customer.id,
                label: customer.name,
              }))}
            />
            <Select
              label="Kendaraan"
              value={form.vehicleId}
              onChange={(vehicleId) => setForm({ ...form, vehicleId })}
              options={filteredVehicles.map((vehicle) => ({
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
              label="Estimasi Selesai"
              type="datetime-local"
              value={form.estimatedFinishedAt}
              required={false}
              onChange={(estimatedFinishedAt) =>
                setForm({ ...form, estimatedFinishedAt })
              }
            />
            <Field
              label="Kilometer Masuk"
              type="number"
              value={form.mileageIn}
              required={false}
              onChange={(mileageIn) => setForm({ ...form, mileageIn })}
            />
            <Textarea
              label="Keluhan Customer"
              value={form.customerComplaint}
              onChange={(customerComplaint) =>
                setForm({ ...form, customerComplaint })
              }
            />
            <Textarea
              label="Diagnosis Awal"
              value={form.initialDiagnosis}
              required={false}
              onChange={(initialDiagnosis) =>
                setForm({ ...form, initialDiagnosis })
              }
            />
          </div>
          <button
            className="mt-5 w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Buat Service Order"}
          </button>
        </form>

        <section className="space-y-4">
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
              <option value="">Semua status</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadOrders(search, status)}
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
          {isLoading ? <AdminEmptyState text="Memuat service order..." /> : null}
          {!isLoading && orders.length === 0 ? (
            <AdminEmptyState text="Belum ada service order." />
          ) : null}

          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-blue-700">
                      {order.code}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">
                    {order.serviceName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {order.customer?.name || "-"} ·{" "}
                    {order.vehicle?.plateNumber || "-"} · {order.currentStep}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Estimasi: {formatDate(order.estimatedFinishedAt)} · Total:{" "}
                    <span className="font-semibold text-slate-950">
                      {formatRupiah(order.grandTotal)}
                    </span>
                  </p>
                  {order.customerComplaint ? (
                    <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                      {order.customerComplaint}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={order.status}
                    disabled={["COMPLETED", "CANCELLED"].includes(order.status)}
                    onChange={(event) =>
                      runAction(() =>
                        updateServiceOrderStatus(
                          order.id,
                          event.target.value as ServiceOrderStatus
                        )
                      )
                    }
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ActionButton
                    label="Assign"
                    disabled={["COMPLETED", "CANCELLED"].includes(order.status)}
                    onClick={() => {
                      const mechanicId = window.prompt("User ID mekanik")?.trim();
                      if (mechanicId) {
                        runAction(() => assignMechanic(order.id, mechanicId));
                      }
                    }}
                  />
                  <ActionButton
                    label="+ Service"
                    disabled={["COMPLETED", "CANCELLED"].includes(order.status)}
                    onClick={() => {
                      const serviceCatalogId = window
                        .prompt("Service catalog ID")
                        ?.trim();
                      const quantity = promptQuantity("Quantity service");
                      if (serviceCatalogId && quantity) {
                        runAction(() =>
                          addServiceItem(order.id, { serviceCatalogId, quantity })
                        );
                      }
                    }}
                  />
                  <ActionButton
                    label="+ Sparepart"
                    disabled={["COMPLETED", "CANCELLED"].includes(order.status)}
                    onClick={() => {
                      const sparepartId =
                        window.prompt("Sparepart ID")?.trim() ||
                        spareparts[0]?.id ||
                        "";
                      const quantity = promptQuantity("Quantity sparepart");
                      if (sparepartId && quantity) {
                        runAction(() =>
                          addSparepartItem(order.id, { sparepartId, quantity })
                        );
                      }
                    }}
                  />
                  <ActionButton
                    label="+ Note"
                    disabled={["COMPLETED", "CANCELLED"].includes(order.status)}
                    onClick={() => {
                      const note = window.prompt("Catatan progress")?.trim();
                      if (note) {
                        runAction(() =>
                          addServiceOrderNote(order.id, {
                            note,
                            visibility: "CUSTOMER_VISIBLE",
                          })
                        );
                      }
                    }}
                  />
                  <ActionButton
                    label="+ Photo"
                    disabled={["COMPLETED", "CANCELLED"].includes(order.status)}
                    onClick={() => {
                      const url = window.prompt("URL foto progress")?.trim();
                      if (url) {
                        runAction(() =>
                          addServiceOrderPhoto(order.id, {
                            url,
                            visibility: "CUSTOMER_VISIBLE",
                          })
                        );
                      }
                    }}
                  />
                  <ActionButton
                    label="Complete"
                    disabled={order.status !== "READY_TO_PICKUP"}
                    tone="success"
                    onClick={() => runAction(() => completeServiceOrder(order.id))}
                  />
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
  type = "text",
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        value={value}
        required={required}
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
  tone?: "default" | "success";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 ${
        tone === "success"
          ? "border-emerald-200 text-emerald-700"
          : "border-slate-300 text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
