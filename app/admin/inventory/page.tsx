"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Package, RotateCw } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adjustSparepartStock,
  formatDateTime,
  listInventoryCategories,
  listInventorySpareparts,
  listLowStockSpareparts,
  listStockMovements,
} from "@/lib/admin-inventory";
import type {
  InventoryFilters,
  StockAdjustmentPayload,
  StockMovement,
} from "@/lib/admin-inventory";
import { AdminSparepart, Category, formatRupiah } from "@/lib/admin-master";
import { cn } from "@/lib/utils";

const emptyAdjustment = {
  sparepartId: "",
  type: "IN" as StockAdjustmentPayload["type"],
  quantity: "1",
  referenceType: "MANUAL_ADJUSTMENT" as StockAdjustmentPayload["referenceType"],
  referenceId: "",
  note: "",
};

export default function AdminInventoryPage() {
  const [spareparts, setSpareparts] = useState<AdminSparepart[]>([]);
  const [lowStock, setLowStock] = useState<AdminSparepart[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: "",
    categoryId: "",
    brand: "",
  });
  const [adjustment, setAdjustment] = useState(emptyAdjustment);
  const [selectedSparepartId, setSelectedSparepartId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    const totalStock = spareparts.reduce((sum, item) => sum + item.stock, 0);
    const stockValue = spareparts.reduce(
      (sum, item) => sum + item.stock * item.costPrice,
      0
    );
    return {
      totalItems: spareparts.length,
      totalStock,
      stockValue,
      lowStockCount: lowStock.length,
    };
  }, [lowStock.length, spareparts]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      listInventorySpareparts(filters),
      listLowStockSpareparts(filters),
      listStockMovements({ sparepartId: selectedSparepartId }),
      listInventoryCategories(),
    ])
      .then(([sparepartResult, lowStockResult, movementResult, categoryResult]) => {
        if (!isMounted) return;
        setSpareparts(sparepartResult.data);
        setLowStock(lowStockResult.data);
        setMovements(movementResult.data);
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
  }, [filters, selectedSparepartId]);

  async function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adjustment.sparepartId) {
      setError("Pilih sparepart dulu");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await adjustSparepartStock(adjustment.sparepartId, {
        type: adjustment.type,
        quantity: Number(adjustment.quantity),
        referenceType: adjustment.referenceType,
        referenceId: adjustment.referenceId,
        note: adjustment.note,
      });
      setAdjustment(emptyAdjustment);
      const [sparepartResult, lowStockResult, movementResult] = await Promise.all([
        listInventorySpareparts(filters),
        listLowStockSpareparts(filters),
        listStockMovements({ sparepartId: selectedSparepartId }),
      ]);
      setSpareparts(sparepartResult.data);
      setLowStock(lowStockResult.data);
      setMovements(movementResult.data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  function useSparepartForAdjustment(sparepart: AdminSparepart) {
    setAdjustment((current) => ({ ...current, sparepartId: sparepart.id }));
    setSelectedSparepartId(sparepart.id);
  }

  return (
    <AdminShell
      title="Sparepart Inventory"
      description="Monitor stock, low-stock risk, manual adjustment, and stock movement history."
    >
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total SKU" value={summary.totalItems} icon="items" />
        <SummaryCard title="Total Stock" value={summary.totalStock} icon="stock" />
        <SummaryCard
          title="Stock Value"
          value={formatRupiah(summary.stockValue)}
          icon="value"
        />
        <SummaryCard
          title="Low Stock"
          value={summary.lowStockCount}
          icon="risk"
          danger={summary.lowStockCount > 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inventory List</CardTitle>
            <CardDescription>
              Filter by category, brand, or keyword before making an adjustment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InventoryFilters
              categories={categories}
              filters={filters}
              onChange={setFilters}
            />
            <InventoryTable
              isLoading={isLoading}
              spareparts={spareparts}
              onAdjust={useSparepartForAdjustment}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Adjustment</CardTitle>
              <CardDescription>
                Record stock in, stock out, or manual correction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitAdjustment}>
                <SelectField
                  label="Sparepart"
                  value={adjustment.sparepartId}
                  onChange={(sparepartId) =>
                    setAdjustment({ ...adjustment, sparepartId })
                  }
                  options={[
                    { value: "", label: "Pilih sparepart" },
                    ...spareparts.map((item) => ({
                      value: item.id,
                      label: `${item.name} (${item.sku})`,
                    })),
                  ]}
                />
                <SelectField
                  label="Movement"
                  value={adjustment.type}
                  onChange={(type) =>
                    setAdjustment({
                      ...adjustment,
                      type: type as StockAdjustmentPayload["type"],
                    })
                  }
                  options={[
                    { value: "IN", label: "Stock In" },
                    { value: "OUT", label: "Stock Out" },
                    { value: "ADJUSTMENT", label: "Adjustment" },
                  ]}
                />
                <Field
                  label="Quantity"
                  type="number"
                  value={adjustment.quantity}
                  onChange={(quantity) => setAdjustment({ ...adjustment, quantity })}
                />
                <SelectField
                  label="Reference"
                  value={adjustment.referenceType || ""}
                  onChange={(referenceType) =>
                    setAdjustment({
                      ...adjustment,
                      referenceType:
                        referenceType as StockAdjustmentPayload["referenceType"],
                    })
                  }
                  options={[
                    { value: "MANUAL_ADJUSTMENT", label: "Manual Adjustment" },
                    { value: "PURCHASE", label: "Purchase" },
                  ]}
                />
                <Field
                  label="Reference ID"
                  required={false}
                  value={adjustment.referenceId}
                  onChange={(referenceId) =>
                    setAdjustment({ ...adjustment, referenceId })
                  }
                />
                <TextArea
                  label="Note"
                  value={adjustment.note}
                  onChange={(note) => setAdjustment({ ...adjustment, note })}
                />
                <Button className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Adjustment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>Items at or below minimum stock.</CardDescription>
            </CardHeader>
            <CardContent>
              <LowStockList items={lowStock} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>
                Latest stock movement records across inventory.
              </CardDescription>
            </div>
            <SelectField
              compact
              label="Filter sparepart"
              value={selectedSparepartId}
              onChange={setSelectedSparepartId}
              options={[
                { value: "", label: "All spareparts" },
                ...spareparts.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          <MovementTable isLoading={isLoading} movements={movements} />
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  danger = false,
}: {
  title: string;
  value: string | number;
  icon: "items" | "stock" | "value" | "risk";
  danger?: boolean;
}) {
  const Icon =
    icon === "risk"
      ? AlertTriangle
      : icon === "stock"
        ? RotateCw
        : icon === "value"
          ? ArrowUp
          : Package;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", danger && "text-destructive")} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", danger && "text-destructive")}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryFilters({
  categories,
  filters,
  onChange,
}: {
  categories: Category[];
  filters: InventoryFilters;
  onChange: (filters: InventoryFilters) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
      <Field
        label="Search"
        required={false}
        value={filters.search || ""}
        onChange={(search) => onChange({ ...filters, search })}
      />
      <SelectField
        label="Category"
        value={filters.categoryId || ""}
        onChange={(categoryId) => onChange({ ...filters, categoryId })}
        options={[
          { value: "", label: "All categories" },
          ...categories.map((category) => ({
            value: category.id,
            label: category.name,
          })),
        ]}
      />
      <Field
        label="Brand"
        required={false}
        value={filters.brand || ""}
        onChange={(brand) => onChange({ ...filters, brand })}
      />
    </div>
  );
}

function InventoryTable({
  spareparts,
  isLoading,
  onAdjust,
}: {
  spareparts: AdminSparepart[];
  isLoading: boolean;
  onAdjust: (sparepart: AdminSparepart) => void;
}) {
  if (isLoading) return <EmptyPanel text="Memuat inventory..." />;
  if (spareparts.length === 0) return <EmptyPanel text="Belum ada sparepart." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sparepart</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Value</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spareparts.map((item) => {
          const lowStock = item.stock <= item.minStock;
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.sku} · {item.brand}
                </div>
              </TableCell>
              <TableCell>{item.category?.name || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={lowStock ? "destructive" : "secondary"}>
                    {item.stock}/{item.minStock}
                  </Badge>
                  {lowStock ? (
                    <span className="text-xs text-destructive">Low</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{formatRupiah(item.stock * item.costPrice)}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onAdjust(item)}
                >
                  Adjust
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function LowStockList({
  items,
  isLoading,
}: {
  items: AdminSparepart[];
  isLoading: boolean;
}) {
  if (isLoading) return <EmptyPanel text="Memuat low stock..." />;
  if (items.length === 0) return <EmptyPanel text="Tidak ada low stock." />;

  return (
    <div className="grid gap-3">
      {items.slice(0, 5).map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.sku} · {item.brand}
              </p>
            </div>
            <Badge variant="destructive">
              {item.stock}/{item.minStock}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function MovementTable({
  movements,
  isLoading,
}: {
  movements: StockMovement[];
  isLoading: boolean;
}) {
  if (isLoading) return <EmptyPanel text="Memuat movement..." />;
  if (movements.length === 0) return <EmptyPanel text="Belum ada stock movement." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Sparepart</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Created By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
            <TableCell>
              <div className="font-medium">
                {movement.sparepart?.name || movement.sparepartId}
              </div>
              <div className="text-xs text-muted-foreground">
                {movement.sparepart?.sku || "-"}
              </div>
            </TableCell>
            <TableCell>
              <MovementBadge type={movement.type} />
            </TableCell>
            <TableCell className="font-medium">
              {movement.type === "OUT" ? (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <ArrowDown className="h-3 w-3" />
                  {movement.quantity}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <ArrowUp className="h-3 w-3" />
                  {movement.quantity}
                </span>
              )}
            </TableCell>
            <TableCell>
              {movement.beforeStock} → {movement.afterStock}
            </TableCell>
            <TableCell>
              <div className="text-sm">{movement.referenceType || "-"}</div>
              <div className="text-xs text-muted-foreground">
                {movement.referenceId || movement.note || "-"}
              </div>
            </TableCell>
            <TableCell>{movement.createdBy?.name || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MovementBadge({ type }: { type: StockMovement["type"] }) {
  if (type === "OUT") return <Badge variant="destructive">OUT</Badge>;
  if (type === "IN") return <Badge className="bg-emerald-600">IN</Badge>;
  return <Badge variant="secondary">ADJUST</Badge>;
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
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label className={cn("block", compact && "min-w-[220px]")}>
      <span className={cn("text-sm font-medium text-foreground", compact && "sr-only")}>
        {label}
      </span>
      <select
        className={cn(
          "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
          !compact && "mt-1"
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {text}
    </div>
  );
}
