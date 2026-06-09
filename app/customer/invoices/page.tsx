"use client";

import { useEffect, useState } from "react";
import { CustomerShell, EmptyState, StatusBadge } from "@/components/customer-shell";
import {
  fetchCustomerInvoices,
  formatDate,
  formatRupiah,
  Invoice,
} from "@/lib/customer";

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomerInvoices()
      .then(setInvoices)
      .catch((fetchError) =>
        setError(fetchError instanceof Error ? fetchError.message : "Request gagal")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <CustomerShell
      title="Invoice Saya"
      description="Lihat invoice service dan status pembayaran dari akun customer."
    >
      {error ? <EmptyState title="Invoice gagal dimuat" description={error} /> : null}
      {isLoading ? (
        <EmptyState title="Memuat invoice" description="Data invoice sedang diambil." />
      ) : null}
      {!isLoading && invoices.length === 0 ? (
        <EmptyState
          title="Belum ada invoice"
          description="Invoice akan muncul setelah transaksi service dibuat."
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {invoices.map((invoice) => (
          <article
            key={invoice.id}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  {invoice.invoiceNumber}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatRupiah(invoice.totalAmount)}
                </p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            <dl className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>Diterbitkan</dt>
                <dd className="font-medium text-slate-950">
                  {formatDate(invoice.issuedAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Jatuh tempo</dt>
                <dd className="font-medium text-slate-950">
                  {formatDate(invoice.dueAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Dibayar</dt>
                <dd className="font-medium text-slate-950">
                  {formatDate(invoice.paidAt)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </CustomerShell>
  );
}
