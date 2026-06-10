"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, Database, Search, ShieldCheck } from "lucide-react";
import { SuperAdminShell } from "@/components/super-admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditLog, listAuditLogs } from "@/lib/super-admin";

const actionOptions = [
  "tenant.create",
  "tenant.update",
  "tenant.deactivate",
  "subscription_plan.create",
  "subscription_plan.update",
  "subscription_plan.deactivate",
  "invoice.create",
  "invoice.update",
  "invoice.generate_pdf",
  "payment.create",
  "payment.update",
];

const entityOptions = ["Tenant", "SubscriptionPlan", "Invoice", "Payment"];

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadLogs(nextPage = page) {
    setError("");
    setIsLoading(true);
    try {
      const result = await listAuditLogs({
        search,
        action,
        entityType,
        page: nextPage,
        limit: 20,
      });
      setLogs(result.data);
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    listAuditLogs({ page: 1, limit: 20 })
      .then((result) => {
        if (!isMounted) return;
        setLogs(result.data);
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
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

  const summary = useMemo(() => {
    const uniqueActors = new Set(logs.map((log) => log.actor?.email || "system"));
    const financialEvents = logs.filter((log) =>
      ["Invoice", "Payment"].includes(log.entityType)
    ).length;

    return {
      visibleLogs: logs.length,
      uniqueActors: uniqueActors.size,
      financialEvents,
    };
  }, [logs]);

  function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadLogs(1);
  }

  return (
    <SuperAdminShell
      title="Audit Logs"
      description="Pantau aktivitas penting super admin, invoice, payment, tenant, dan subscription plan."
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Logs"
          value={total}
          helper={`${summary.visibleLogs} rows visible`}
          icon={Activity}
        />
        <MetricCard
          title="Actors Visible"
          value={summary.uniqueActors}
          helper="Based on current page"
          icon={ShieldCheck}
        />
        <MetricCard
          title="Financial Events"
          value={summary.financialEvents}
          helper="Invoice and payment events"
          icon={Database}
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Filter Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitFilter} className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
                placeholder="Search action, entity, actor, or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={action}
              onChange={(event) => setAction(event.target.value)}
            >
              <option value="">All actions</option>
              {actionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            >
              <option value="">All entities</option>
              {entityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Apply"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Latest Activity</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1 || isLoading}
              onClick={() => loadLogs(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages || isLoading}
              onClick={() => loadLogs(page + 1)}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Empty text="Loading audit logs..." />
          ) : logs.length === 0 ? (
            <Empty text="Belum ada audit log." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="min-w-36 text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-44">
                      <p className="font-medium">{log.actor?.name || "System"}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.actor?.email || "-"}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-44">
                      <p className="font-medium">{log.entityType}</p>
                      <p className="text-xs text-muted-foreground">
                        {shorten(log.entityId || "-")}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-40 text-xs text-muted-foreground">
                      <p>{log.ipAddress || "-"}</p>
                      <p>{shorten(log.requestId || "-")}</p>
                    </TableCell>
                    <TableCell className="max-w-72">
                      <code className="block truncate rounded bg-muted px-2 py-1 text-xs">
                        {metadataPreview(log.metadata)}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </SuperAdminShell>
  );
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: number;
  helper: string;
  icon: typeof Activity;
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
        <div className="text-3xl font-bold">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function shorten(value: string) {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function metadataPreview(metadata: Record<string, unknown> | null) {
  if (!metadata) return "-";
  return JSON.stringify(metadata);
}
