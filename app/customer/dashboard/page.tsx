import { ProtectedRoute } from "@/components/protected-route";
import { LogoutButton } from "@/components/logout-button";

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                Customer Dashboard
              </h1>
              <p className="mt-2 text-slate-600">
                Area customer untuk kendaraan, booking, tracking service, dan
                riwayat service.
              </p>
            </div>
            <LogoutButton />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {["Kendaraan", "Booking Aktif", "Riwayat Service"].map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{item}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">0</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
