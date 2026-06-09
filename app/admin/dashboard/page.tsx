import { ProtectedRoute } from "@/components/protected-route";
import { LogoutButton } from "@/components/logout-button";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-slate-600">
                Baseline dashboard internal mengikuti pola shadcn/ui: summary
                card, table area, skeleton, dan empty state.
              </p>
            </div>
            <LogoutButton />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Booking Hari Ini",
              "Service Aktif",
              "Invoice Belum Lunas",
              "Stok Menipis",
            ].map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{item}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">0</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">Aktivitas Bengkel</h2>
            <p className="mt-2 text-sm text-slate-500">
              Belum ada data operasional. Data akan muncul setelah modul booking
              dan service order tersedia.
            </p>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
