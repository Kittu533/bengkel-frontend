import { SparepartCard } from "@/components/catalog-cards";
import { CatalogFilters } from "@/components/catalog-filters";
import { PublicShell } from "@/components/public-layout";
import { fetchSpareparts } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";

type SparepartsPageProps = {
  searchParams: Promise<{
    search?: string;
    brand?: string;
    vehicleType?: string;
    page?: string;
  }>;
};

export default async function SparepartsPage({
  searchParams,
}: SparepartsPageProps) {
  const params = await searchParams;
  const result = await fetchSpareparts(params);

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Katalog Sparepart
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Cek sparepart aktif yang tersedia.
          </h1>
          <p className="mt-4 text-slate-600">
            Lihat harga jual, stok, brand, dan kategori sparepart tanpa login.
          </p>
        </section>

        <div className="mt-8">
          <CatalogFilters
            searchPlaceholder="Cari sparepart..."
            secondFilterName="brand"
            secondFilterLabel="Semua brand"
            secondFilterOptions={[
              { label: "GS", value: "GS" },
              { label: "Sakura", value: "Sakura" },
            ]}
            defaultSearch={params.search}
            defaultVehicleType={params.vehicleType}
            defaultSecondFilter={params.brand}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.data.map((sparepart) => (
            <SparepartCard key={sparepart.id} sparepart={sparepart} />
          ))}
        </div>

        {result.data.length === 0 ? (
          <div className="mt-6 rounded-md border border-slate-200 bg-white p-6 text-center text-slate-600">
            Sparepart tidak ditemukan.
          </div>
        ) : null}
      </main>
    </PublicShell>
  );
}
