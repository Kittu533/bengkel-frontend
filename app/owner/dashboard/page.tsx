"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  CalendarCheck,
  CreditCard,
  Package,
  Receipt,
  Users,
} from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  fetchLowStockReport,
  fetchMechanicPerformance,
  fetchOwnerSummary,
  fetchRevenueReport,
  fetchServiceReport,
  fetchSparepartReport,
  fetchUnpaidInvoices,
  formatMinutes,
  formatRupiah,
  LowStockSparepart,
  MechanicPerformance,
  OwnerInvoice,
  OwnerSummary,
  RevenueReportPoint,
  ServiceReport,
  SparepartReport,
} from "@/lib/owner-reports";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  totalUnpaid: {
    label: "Unpaid",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const emptySummary: OwnerSummary = {
  todayRevenue: 0,
  monthlyRevenue: 0,
  todayServices: 0,
  activeCustomers: 0,
  unpaidInvoices: 0,
  lowStockItems: 0,
};

function defaultStartDate() {
  const value = new Date();
  value.setDate(1);
  return value.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function OwnerDashboardPage() {
  const [summary, setSummary] = useState<OwnerSummary>(emptySummary);
  const [revenue, setRevenue] = useState<RevenueReportPoint[]>([]);
  const [services, setServices] = useState<ServiceReport[]>([]);
  const [spareparts, setSpareparts] = useState<SparepartReport[]>([]);
  const [mechanics, setMechanics] = useState<MechanicPerformance[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoice[]>([]);
  const [lowStock, setLowStock] = useState<LowStockSparepart[]>([]);
  const [filters, setFilters] = useState({
    startDate: defaultStartDate(),
    endDate: defaultEndDate(),
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const totals = useMemo(
    () =>
      revenue.reduce(
        (result, item) => ({
          paid: result.paid + item.totalPaid,
          unpaid: result.unpaid + item.totalUnpaid,
          invoice: result.invoice + item.totalInvoice,
        }),
        { paid: 0, unpaid: 0, invoice: 0 }
      ),
    [revenue]
  );

  async function loadReports(nextFilters = filters) {
    setError("");
    setIsLoading(true);
    try {
      const [
        nextSummary,
        nextRevenue,
        nextServices,
        nextSpareparts,
        nextMechanics,
        nextInvoices,
        nextLowStock,
      ] = await Promise.all([
        fetchOwnerSummary(),
        fetchRevenueReport(nextFilters),
        fetchServiceReport(nextFilters),
        fetchSparepartReport(nextFilters),
        fetchMechanicPerformance(nextFilters),
        fetchUnpaidInvoices(),
        fetchLowStockReport(),
      ]);
      setSummary(nextSummary);
      setRevenue(nextRevenue);
      setServices(nextServices);
      setSpareparts(nextSpareparts);
      setMechanics(nextMechanics);
      setInvoices(nextInvoices);
      setLowStock(nextLowStock);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadReports(filters);
  }

  return (
    <OwnerShell
      title="Owner Dashboard"
      description="Ringkasan revenue, service, sparepart, mekanik, invoice, dan stok bengkel."
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={submitFilters}
        className="mb-6 grid gap-3 rounded-xl border bg-background p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]"
      >
        <Field
          label="Start Date"
          value={filters.startDate}
          onChange={(startDate) => setFilters({ ...filters, startDate })}
        />
        <Field
          label="End Date"
          value={filters.endDate}
          onChange={(endDate) => setFilters({ ...filters, endDate })}
        />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:self-end">
          Apply Filter
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue Hari Ini"
          value={formatRupiah(summary.todayRevenue)}
          icon={CreditCard}
          isLoading={isLoading}
        />
        <MetricCard
          title="Revenue Bulan Ini"
          value={formatRupiah(summary.monthlyRevenue)}
          icon={Receipt}
          isLoading={isLoading}
        />
        <MetricCard
          title="Service Hari Ini"
          value={summary.todayServices}
          icon={CalendarCheck}
          isLoading={isLoading}
        />
        <MetricCard
          title="Customer Aktif"
          value={summary.activeCustomers}
          icon={Users}
          isLoading={isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Paid"
          value={formatRupiah(totals.paid)}
          icon={CreditCard}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Unpaid"
          value={formatRupiah(totals.unpaid)}
          icon={AlertTriangle}
          isLoading={isLoading}
        />
        <MetricCard
          title="Invoice Belum Lunas"
          value={summary.unpaidInvoices}
          icon={Receipt}
          isLoading={isLoading}
        />
        <MetricCard
          title="Stok Menipis"
          value={summary.lowStockItems}
          icon={Package}
          isLoading={isLoading}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Report</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <AreaChart data={revenue} margin={{ left: 0, right: 16 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#revenueFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <ReportTable
          title="Mechanic Performance"
          emptyText="Belum ada performa mekanik."
          rows={mechanics.map((item) => [
            item.mechanicName,
            `${item.completedServiceOrder}/${item.totalServiceOrder}`,
            formatMinutes(item.averageCompletionTime),
          ])}
          headers={["Mechanic", "Done/Total", "Avg Time"]}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ReportTable
          title="Top Services"
          emptyText="Belum ada service terjual."
          rows={services.map((item) => [
            item.serviceName,
            String(item.totalUsed),
            formatRupiah(item.totalRevenue),
          ])}
          headers={["Service", "Used", "Revenue"]}
        />
        <ReportTable
          title="Top Spareparts"
          emptyText="Belum ada sparepart terjual."
          rows={spareparts.map((item) => [
            item.sparepartName,
            String(item.quantitySold),
            formatRupiah(item.totalRevenue),
          ])}
          headers={["Sparepart", "Qty", "Revenue"]}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ReportTable
          title="Unpaid Invoices"
          emptyText="Tidak ada invoice belum lunas."
          rows={invoices.map((item) => [
            item.invoiceNumber,
            item.customer?.name || "-",
            formatRupiah(Math.max(item.totalAmount - item.paidAmount, 0)),
          ])}
          headers={["Invoice", "Customer", "Outstanding"]}
        />
        <ReportTable
          title="Low Stock Alert"
          emptyText="Tidak ada stok menipis."
          rows={lowStock.map((item) => [
            item.name,
            item.brand,
            `${item.stock}/${item.minStock}`,
          ])}
          headers={["Sparepart", "Brand", "Stock"]}
        />
      </div>
    </OwnerShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        type="date"
        className="rounded-md border px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: typeof CreditCard;
  isLoading: boolean;
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
        {isLoading ? (
          <div className="h-8 w-24 rounded bg-muted" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportTable({
  title,
  headers,
  rows,
  emptyText,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  {headers.map((header) => (
                    <th key={header} className="pb-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.join("-")} className="border-b last:border-0">
                    {row.map((cell, index) => (
                      <td
                        key={`${cell}-${index}`}
                        className="py-3 pr-3 align-top font-medium"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatCompact(value: number) {
  if (value >= 1000000) return `${Math.round(value / 1000000)}jt`;
  if (value >= 1000) return `${Math.round(value / 1000)}rb`;
  return String(value);
}
