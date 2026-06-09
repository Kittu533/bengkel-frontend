import { CatalogFilters } from "@/components/catalog-filters";
import { ServiceCard } from "@/components/catalog-cards";
import { PublicShell } from "@/components/public-layout";
import { fetchServiceCatalogs } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    vehicleType?: string;
    page?: string;
  }>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const result = await fetchServiceCatalogs(params);

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Katalog Service
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Pilih layanan bengkel sesuai kendaraan.
          </h1>
          <p className="mt-4 text-slate-600">
            Lihat estimasi harga, durasi pengerjaan, dan jenis kendaraan sebelum
            booking service.
          </p>
        </section>

        <div className="mt-8">
          <CatalogFilters
            searchPlaceholder="Cari service..."
            secondFilterName="categoryId"
            secondFilterLabel="Semua kategori"
            secondFilterOptions={[
              { label: "Service Motor", value: "cat-service-motor" },
              { label: "Service Mobil", value: "cat-service-mobil" },
            ]}
            defaultSearch={params.search}
            defaultVehicleType={params.vehicleType}
            defaultSecondFilter={params.categoryId}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.data.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {result.data.length === 0 ? (
          <div className="mt-6 rounded-md border border-slate-200 bg-white p-6 text-center text-slate-600">
            Service tidak ditemukan.
          </div>
        ) : null}
      </main>
    </PublicShell>
  );
}
