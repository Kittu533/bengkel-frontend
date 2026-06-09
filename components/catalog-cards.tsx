import { formatRupiah, ServiceCatalog, Sparepart } from "@/lib/public-catalog";

function VehicleBadge({ vehicleType }: { vehicleType: string }) {
  return (
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      {vehicleType === "MOTOR" ? "Motor" : "Mobil"}
    </span>
  );
}

export function PriceBadge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
      {children}
    </span>
  );
}

export function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  const isLowStock = stock <= minStock;
  return (
    <span
      className={
        isLowStock
          ? "rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700"
          : "rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
      }
    >
      Stok {stock}
    </span>
  );
}

export function ServiceCard({ service }: { service: ServiceCatalog }) {
  return (
    <article className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {service.category?.name || "Service"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {service.name}
          </h2>
        </div>
        <VehicleBadge vehicleType={service.vehicleType} />
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {service.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <PriceBadge>{formatRupiah(service.price)}</PriceBadge>
        <span className="text-sm text-slate-500">
          {service.estimatedDurationMinutes} menit
        </span>
      </div>
    </article>
  );
}

export function SparepartCard({ sparepart }: { sparepart: Sparepart }) {
  return (
    <article className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {sparepart.brand} - {sparepart.category?.name || "Sparepart"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {sparepart.name}
          </h2>
        </div>
        <VehicleBadge vehicleType={sparepart.vehicleType} />
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {sparepart.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <PriceBadge>{formatRupiah(sparepart.sellPrice)}</PriceBadge>
        <StockBadge stock={sparepart.stock} minStock={sparepart.minStock} />
      </div>
    </article>
  );
}
