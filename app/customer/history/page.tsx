"use client";

import { useEffect, useState } from "react";
import { CustomerShell, EmptyState } from "@/components/customer-shell";
import {
  fetchServiceHistory,
  formatDate,
  formatRupiah,
  ServiceHistory,
} from "@/lib/customer";

export default function CustomerHistoryPage() {
  const [histories, setHistories] = useState<ServiceHistory[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServiceHistory()
      .then(setHistories)
      .catch((fetchError) =>
        setError(fetchError instanceof Error ? fetchError.message : "Request gagal")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <CustomerShell
      title="Riwayat Service"
      description="Daftar service selesai yang tercatat untuk kendaraan customer."
    >
      {error ? <EmptyState title="Riwayat gagal dimuat" description={error} /> : null}
      {isLoading ? (
        <EmptyState
          title="Memuat riwayat"
          description="Data riwayat service sedang diambil."
        />
      ) : null}
      {!isLoading && histories.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat service"
          description="Riwayat akan muncul setelah service selesai dan dicatat admin."
        />
      ) : null}
      {histories.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Odometer</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {histories.map((history) => (
                <tr key={history.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(history.serviceDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {history.serviceName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {history.odometer ? `${history.odometer} km` : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatRupiah(history.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {history.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </CustomerShell>
  );
}
