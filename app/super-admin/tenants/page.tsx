"use client";

import { FormEvent, useEffect, useState } from "react";
import { SuperAdminShell, SaasStatusBadge } from "@/components/super-admin-shell";
import { Button } from "@/components/ui/button";
import {
  createTenant,
  deactivateTenant,
  formatRupiah,
  listPlans,
  listTenants,
  SubscriptionPlan,
  Tenant,
} from "@/lib/super-admin";

const emptyForm = {
  name: "",
  slug: "",
  billingEmail: "",
  phone: "",
  address: "",
  branchName: "Main Branch",
  branchCode: "MAIN",
  planId: "",
};

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadTenants(nextSearch = search, nextStatus = status) {
    setError("");
    setIsLoading(true);
    try {
      const result = await listTenants({ search: nextSearch, status: nextStatus });
      setTenants(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    Promise.all([listTenants(), listPlans()])
      .then(([tenantResult, planResult]) => {
        if (!isMounted) return;
        setTenants(tenantResult.data);
        setPlans(planResult);
        setForm((current) => ({ ...current, planId: planResult[0]?.id || "" }));
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

  async function submitTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await createTenant({
        ...form,
        slug: form.slug || undefined,
        billingEmail: form.billingEmail || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        planId: form.planId || undefined,
      });
      setForm({ ...emptyForm, planId: plans[0]?.id || "" });
      await loadTenants();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runDeactivate(id: string) {
    setError("");
    try {
      await deactivateTenant(id);
      await loadTenants();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Request gagal");
    }
  }

  return (
    <SuperAdminShell
      title="Tenant Management"
      description="Kelola tenant, branch utama, subscription plan, usage, dan billing status."
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submitTenant} className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Create Tenant</h2>
          <div className="mt-4 space-y-3">
            <Field label="Tenant Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field label="Slug" required={false} value={form.slug} onChange={(slug) => setForm({ ...form, slug })} />
            <Field label="Billing Email" type="email" required={false} value={form.billingEmail} onChange={(billingEmail) => setForm({ ...form, billingEmail })} />
            <Field label="Phone" required={false} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
            <Field label="Address" required={false} value={form.address} onChange={(address) => setForm({ ...form, address })} />
            <Field label="Branch Name" value={form.branchName} onChange={(branchName) => setForm({ ...form, branchName })} />
            <Field label="Branch Code" value={form.branchCode} onChange={(branchCode) => setForm({ ...form, branchCode })} />
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-muted-foreground">Plan</span>
              <select
                className="rounded-md border px-3 py-2"
                value={form.planId}
                onChange={(event) => setForm({ ...form, planId: event.target.value })}
              >
                <option value="">No plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {formatRupiah(plan.priceMonthly)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button className="mt-5 w-full" disabled={isSubmitting || !form.name}>
            {isSubmitting ? "Creating..." : "Create Tenant"}
          </Button>
        </form>

        <section className="space-y-4">
          <div className="grid gap-3 rounded-xl border bg-background p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Search tenant"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <Button type="button" onClick={() => loadTenants(search, status)}>
              Filter
            </Button>
          </div>

          {isLoading ? (
            <Empty text="Loading tenants..." />
          ) : tenants.length === 0 ? (
            <Empty text="Belum ada tenant." />
          ) : (
            <div className="space-y-3">
              {tenants.map((tenant) => (
                <article key={tenant.id} className="rounded-xl border bg-background p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">{tenant.name}</h2>
                        <SaasStatusBadge status={tenant.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tenant.slug} - {tenant.billingEmail || "No billing email"}
                      </p>
                      <p className="mt-3 text-sm">
                        {tenant.subscriptions[0]?.plan?.name || "No plan"} -{" "}
                        {tenant.branches.length} branch - {tenant._count?.users || 0} users
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={tenant.status === "INACTIVE"}
                      onClick={() => runDeactivate(tenant.id)}
                    >
                      Deactivate
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </SuperAdminShell>
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
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        required={required}
        type={type}
        className="rounded-md border px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
