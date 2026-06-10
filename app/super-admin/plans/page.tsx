"use client";

import { FormEvent, useEffect, useState } from "react";
import { SuperAdminShell, SaasStatusBadge } from "@/components/super-admin-shell";
import { Button } from "@/components/ui/button";
import {
  createPlan,
  deactivatePlan,
  formatRupiah,
  listPlans,
  SubscriptionPlan,
} from "@/lib/super-admin";

const emptyForm = {
  name: "",
  code: "",
  priceMonthly: "",
  maxBranches: "",
  maxUsers: "",
  features: "",
};

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadPlans() {
    setError("");
    setIsLoading(true);
    try {
      setPlans(await listPlans());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await createPlan({
        name: form.name,
        code: form.code || undefined,
        priceMonthly: Number(form.priceMonthly) || 0,
        maxBranches: form.maxBranches ? Number(form.maxBranches) : undefined,
        maxUsers: form.maxUsers ? Number(form.maxUsers) : undefined,
        features: form.features || undefined,
      });
      setForm(emptyForm);
      await loadPlans();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runDeactivate(id: string) {
    setError("");
    try {
      await deactivatePlan(id);
      await loadPlans();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Request gagal");
    }
  }

  return (
    <SuperAdminShell
      title="Subscription Plans"
      description="Kelola paket langganan, limit cabang, limit user, dan fitur SaaS."
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submitPlan} className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Create Plan</h2>
          <div className="mt-4 space-y-3">
            <Field label="Plan Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field label="Code" required={false} value={form.code} onChange={(code) => setForm({ ...form, code })} />
            <Field label="Monthly Price" type="number" value={form.priceMonthly} onChange={(priceMonthly) => setForm({ ...form, priceMonthly })} />
            <Field label="Max Branches" type="number" required={false} value={form.maxBranches} onChange={(maxBranches) => setForm({ ...form, maxBranches })} />
            <Field label="Max Users" type="number" required={false} value={form.maxUsers} onChange={(maxUsers) => setForm({ ...form, maxUsers })} />
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-muted-foreground">Features</span>
              <textarea
                className="min-h-24 rounded-md border px-3 py-2"
                value={form.features}
                onChange={(event) => setForm({ ...form, features: event.target.value })}
              />
            </label>
          </div>
          <Button className="mt-5 w-full" disabled={isSubmitting || !form.name}>
            {isSubmitting ? "Creating..." : "Create Plan"}
          </Button>
        </form>

        <section className="space-y-3">
          {isLoading ? (
            <Empty text="Loading plans..." />
          ) : plans.length === 0 ? (
            <Empty text="Belum ada plan." />
          ) : (
            plans.map((plan) => (
              <article key={plan.id} className="rounded-xl border bg-background p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold">{plan.name}</h2>
                      <SaasStatusBadge status={plan.isActive ? "ACTIVE" : "INACTIVE"} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.code}</p>
                    <p className="mt-3 text-2xl font-bold">
                      {formatRupiah(plan.priceMonthly)}
                      <span className="text-sm font-medium text-muted-foreground"> / bulan</span>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.maxBranches || "-"} branches - {plan.maxUsers || "-"} users -{" "}
                      {plan._count?.subscriptions || 0} subscriptions
                    </p>
                    {plan.features ? (
                      <p className="mt-3 text-sm">{plan.features}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!plan.isActive}
                    onClick={() => runDeactivate(plan.id)}
                  >
                    Deactivate
                  </Button>
                </div>
              </article>
            ))
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
