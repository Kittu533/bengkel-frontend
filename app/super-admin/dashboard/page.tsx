"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, Users, Wrench } from "lucide-react";
import { SuperAdminShell, SaasStatusBadge } from "@/components/super-admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatRupiah,
  listPlans,
  listTenants,
  SubscriptionPlan,
  Tenant,
} from "@/lib/super-admin";

export default function SuperAdminDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([listTenants(), listPlans()])
      .then(([tenantResult, planResult]) => {
        if (!isMounted) return;
        setTenants(tenantResult.data);
        setPlans(planResult);
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

  const summary = useMemo(
    () => ({
      activeTenants: tenants.filter((tenant) => tenant.status === "ACTIVE").length,
      totalBranches: tenants.reduce(
        (sum, tenant) => sum + (tenant._count?.branches || tenant.branches.length),
        0
      ),
      totalUsers: tenants.reduce((sum, tenant) => sum + (tenant._count?.users || 0), 0),
      activePlans: plans.filter((plan) => plan.isActive).length,
      monthlyPotential: tenants.reduce((sum, tenant) => {
        const subscription = tenant.subscriptions[0];
        return sum + (subscription?.plan?.priceMonthly || 0);
      }, 0),
    }),
    [tenants, plans]
  );

  return (
    <SuperAdminShell
      title="SaaS Control Center"
      description="Monitor tenant, branch, subscription, usage, dan billing status."
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active Tenants" value={summary.activeTenants} icon={Building2} loading={isLoading} />
        <MetricCard title="Branches" value={summary.totalBranches} icon={Wrench} loading={isLoading} />
        <MetricCard title="Users" value={summary.totalUsers} icon={Users} loading={isLoading} />
        <MetricCard title="Active Plans" value={summary.activePlans} icon={CreditCard} loading={isLoading} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatRupiah(summary.monthlyPotential)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Estimasi MRR dari subscription aktif yang tercatat.
            </p>
            <Button asChild className="mt-5">
              <Link href="/super-admin/tenants">Manage Tenants</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Belum ada tenant.
              </div>
            ) : (
              <div className="space-y-3">
                {tenants.slice(0, 5).map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <p className="font-semibold">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.subscriptions[0]?.plan?.name || "No plan"} -{" "}
                        {tenant._count?.branches || tenant.branches.length} branch
                      </p>
                    </div>
                    <SaasStatusBadge status={tenant.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminShell>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon: typeof Building2;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-20 rounded bg-muted" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
