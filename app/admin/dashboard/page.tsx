"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  ClipboardList,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  Package,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBooking,
  AdminDashboardSummary,
  AdminServiceOrder,
  fetchActiveServiceOrders,
  fetchAdminDashboardSummary,
  fetchLowStockSpareparts,
  fetchRevenueChart,
  fetchTodayBookings,
  formatDate,
  formatRupiah,
  LowStockSparepart,
  RevenuePoint,
} from "@/lib/admin-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DashboardData = {
  summary: AdminDashboardSummary;
  bookings: AdminBooking[];
  serviceOrders: AdminServiceOrder[];
  lowStock: LowStockSparepart[];
  revenue: RevenuePoint[];
};

type ChartItem = {
  label: string;
  value: number;
  fill: string;
  description: string;
};

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const operationalChartConfig = {
  value: {
    label: "Total",
  },
  bookings: {
    label: "Bookings",
    color: "var(--chart-1)",
  },
  services: {
    label: "Services",
    color: "var(--chart-2)",
  },
  invoices: {
    label: "Invoices",
    color: "var(--chart-3)",
  },
  lowStock: {
    label: "Low Stock",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const pipelineChartConfig = {
  value: {
    label: "Service Orders",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const emptySummary: AdminDashboardSummary = {
  todayBookings: 0,
  activeServiceOrders: 0,
  unpaidInvoices: 0,
  lowStockItems: 0,
  totalCustomers: 0,
  totalVehicles: 0,
  monthlyRevenue: 0,
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    summary: emptySummary,
    bookings: [],
    serviceOrders: [],
    lowStock: [],
    revenue: [],
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchAdminDashboardSummary(),
      fetchTodayBookings(),
      fetchActiveServiceOrders(),
      fetchLowStockSpareparts(),
      fetchRevenueChart(),
    ])
      .then(([summary, bookings, serviceOrders, lowStock, revenue]) => {
        if (!isMounted) return;
        setData({ summary, bookings, serviceOrders, lowStock, revenue });
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Request gagal");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const maxRevenue = useMemo(
    () => Math.max(...data.revenue.map((item) => item.revenue), 1),
    [data.revenue]
  );

  const operationalMix = useMemo<ChartItem[]>(
    () => [
      {
        label: "Bookings",
        value: data.summary.todayBookings,
        fill: "var(--color-bookings)",
        description: "Today",
      },
      {
        label: "Services",
        value: data.summary.activeServiceOrders,
        fill: "var(--color-services)",
        description: "Active",
      },
      {
        label: "Invoices",
        value: data.summary.unpaidInvoices,
        fill: "var(--color-invoices)",
        description: "Unpaid",
      },
      {
        label: "Low Stock",
        value: data.summary.lowStockItems,
        fill: "var(--color-lowStock)",
        description: "Risk",
      },
    ],
    [data.summary]
  );

  const servicePipeline = useMemo<ChartItem[]>(() => {
    const counts = data.serviceOrders.reduce<Record<string, number>>(
      (result, order) => {
        result[order.currentStep] = (result[order.currentStep] || 0) + 1;
        return result;
      },
      {}
    );

    return Object.entries(counts).map(([label, value], index) => ({
      label: label.toLowerCase().replaceAll("_", " "),
      value,
      fill: `var(--chart-${(index % 4) + 1})`,
      description: `${value} unit`,
    }));
  }, [data.serviceOrders]);

  return (
    <AdminShell
      title="Dashboard Overview"
      description="Monitor workshop performance and operational activities."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/bookings">
              Manage Bookings
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/service-orders">
              Create Service Order
            </Link>
          </Button>
        </>
      }
    >
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Bookings"
          value={data.summary.todayBookings}
          description="Appointments for today"
          icon={CalendarDays}
          isLoading={isLoading}
        />
        <MetricCard
          title="Active Services"
          value={data.summary.activeServiceOrders}
          description="Units in workshop"
          icon={ClipboardList}
          isLoading={isLoading}
        />
        <MetricCard
          title="Unpaid Invoices"
          value={data.summary.unpaidInvoices}
          description="Pending payments"
          icon={Receipt}
          isLoading={isLoading}
        />
        <MetricCard
          title="Low Stock"
          value={data.summary.lowStockItems}
          description="Items below minimum"
          icon={AlertTriangle}
          variant={data.summary.lowStockItems > 0 ? "destructive" : "default"}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Revenue movement, average, and month-over-month signal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart points={data.revenue} maxRevenue={maxRevenue} isLoading={isLoading} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Operational Mix</CardTitle>
            <CardDescription>
              Current workload balance from bookings, services, invoices, and stock risk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OperationalMixChart items={operationalMix} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-1">
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>
                Upcoming service appointments for today.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/bookings">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <BookingTable bookings={data.bookings} isLoading={isLoading} />
          </CardContent>
        </Card>
        <div className="col-span-3 grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Pipeline</CardTitle>
              <CardDescription>Active service orders grouped by current step.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ServicePipelineChart items={servicePipeline} isLoading={isLoading} />
              <ServiceOrderList serviceOrders={data.serviceOrders} isLoading={isLoading} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>
                Spareparts needing immediate restock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LowStockList items={data.lowStock} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  variant = "default",
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  isLoading: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", variant === "destructive" ? "text-destructive" : "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <div className={cn("text-2xl font-bold", variant === "destructive" ? "text-destructive" : "")}>
            {value}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function BookingTable({
  bookings,
  isLoading,
}: {
  bookings: AdminBooking[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (bookings.length === 0) {
    return <EmptyState text="No bookings for today." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Service</TableHead>
          <TableHead className="hidden md:table-cell">Schedule</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              <div className="font-medium">{booking.customer.name}</div>
              <div className="hidden text-sm text-muted-foreground md:inline">
                {booking.code}
              </div>
            </TableCell>
            <TableCell>{booking.serviceName}</TableCell>
            <TableCell className="hidden md:table-cell">
              {formatDate(booking.scheduleAt)}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="outline">
                {booking.status.toLowerCase().replaceAll("_", " ")}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ServiceOrderList({
  serviceOrders,
  isLoading,
}: {
  serviceOrders: AdminServiceOrder[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (serviceOrders.length === 0) {
    return <EmptyState text="No active service orders." />;
  }

  return (
    <div className="grid gap-4">
      {serviceOrders.map((order) => (
        <div key={order.id} className="flex items-center gap-4">
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">
              {order.customer.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.code} · {order.serviceName}
            </p>
          </div>
          <div className="ml-auto font-medium">
            <Badge variant="secondary" className="text-[10px] uppercase">
              {order.currentStep}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function LowStockList({
  items,
  isLoading,
}: {
  items: LowStockSparepart[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (items.length === 0) {
    return <EmptyState text="No low stock items." />;
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
            <Package className="h-5 w-5 text-destructive" />
          </div>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.brand} · SKU: {item.sku}
            </p>
          </div>
          <div className="ml-auto font-medium text-destructive">
            {item.stock} / {item.minStock}
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueChart({
  points,
  isLoading,
}: {
  points: RevenuePoint[];
  maxRevenue: number;
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (points.length === 0) return <EmptyState text="No revenue data available." />;

  const chartData = points.map((item) => ({
    month: item.label,
    revenue: item.revenue,
  }));
  const totalRevenue = points.reduce((total, item) => total + item.revenue, 0);
  const averageRevenue = totalRevenue / points.length;
  const bestMonth = points.reduce((best, item) =>
    item.revenue > best.revenue ? item : best
  );
  const previousRevenue = points[points.length - 2]?.revenue || 0;
  const latestRevenue = points[points.length - 1]?.revenue || 0;
  const trendPercent =
    previousRevenue === 0
      ? latestRevenue > 0
        ? 100
        : 0
      : ((latestRevenue - previousRevenue) / previousRevenue) * 100;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <ChartSummary label="Total" value={formatRupiah(totalRevenue)} />
        <ChartSummary label="Average" value={formatRupiah(averageRevenue)} />
        <ChartSummary
          label="MoM"
          value={`${trendPercent >= 0 ? "+" : ""}${trendPercent.toFixed(1)}%`}
          tone={trendPercent >= 0 ? "positive" : "negative"}
        />
      </div>
      <ChartContainer
        config={revenueChartConfig}
        className="h-[260px] w-full rounded-lg border bg-muted/20 p-4"
      >
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 0, right: 12, top: 10 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => formatShortCurrency(Number(value))}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="line"
                valueFormatter={(value) => formatRupiah(Number(value))}
              />
            }
          />
          <Area
            dataKey="revenue"
            type="natural"
            fill="var(--color-revenue)"
            fillOpacity={0.28}
            stroke="var(--color-revenue)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        Best month: <span className="font-medium text-foreground">{bestMonth.label}</span>{" "}
        at <span className="font-medium text-foreground">{formatRupiah(bestMonth.revenue)}</span>.
      </p>
    </div>
  );
}

function OperationalMixChart({
  items,
  isLoading,
}: {
  items: ChartItem[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;

  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <EmptyState text="No operational activity yet." />;

  return (
    <div className="space-y-5">
      <ChartContainer
        config={operationalChartConfig}
        className="mx-auto h-[220px] w-full max-w-[280px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="label" />}
          />
          <Pie
            data={items}
            dataKey="value"
            nameKey="label"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            strokeWidth={2}
          />
        </PieChart>
      </ChartContainer>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <span className="text-sm font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicePipelineChart({
  items,
  isLoading,
}: {
  items: ChartItem[];
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonRows />;
  if (items.length === 0) return <EmptyState text="No active pipeline data." />;

  return (
    <ChartContainer config={pipelineChartConfig} className="h-[220px] w-full">
      <BarChart
        accessibilityLayer
        data={items}
        layout="vertical"
        margin={{ left: 10, right: 20 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={94}
          tickFormatter={(value) => String(value).slice(0, 18)}
        />
        <XAxis type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="label" />}
        />
        <Bar dataKey="value" radius={5} />
      </BarChart>
    </ChartContainer>
  );
}

function ChartSummary({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold",
          tone === "positive" && "text-emerald-600",
          tone === "negative" && "text-destructive"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function formatShortCurrency(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return `${value}`;
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {text}
    </div>
  );
}
