"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileText, Receipt, WalletCards } from "lucide-react";
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
  AdminInvoice,
  createInvoice,
  createPayment,
  formatDate,
  formatRupiah,
  generateInvoicePdf,
  listInvoices,
  PaymentMethod,
} from "@/lib/admin-invoices";
import {
  AdminServiceOrder,
  listServiceOrders,
} from "@/lib/admin-service-orders";
import { cn } from "@/lib/utils";

const emptyPayment = {
  invoiceId: "",
  amount: "",
  method: "CASH" as PaymentMethod,
  referenceNumber: "",
  note: "",
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [completedOrders, setCompletedOrders] = useState<AdminServiceOrder[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [payment, setPayment] = useState(emptyPayment);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) || invoices[0],
    [invoices, selectedInvoiceId]
  );

  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const paidAmount = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
    const unpaidAmount = Math.max(totalAmount - paidAmount, 0);
    return {
      totalInvoices: invoices.length,
      paidAmount,
      unpaidAmount,
      unpaidCount: invoices.filter((invoice) => invoice.status !== "PAID").length,
    };
  }, [invoices]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      listInvoices({ search, status }),
      listServiceOrders({ status: "COMPLETED" }),
    ])
      .then(([invoiceResult, orderResult]) => {
        if (!isMounted) return;
        setInvoices(invoiceResult.data);
        setCompletedOrders(orderResult.data);
        if (!selectedInvoiceId && invoiceResult.data[0]) {
          setSelectedInvoiceId(invoiceResult.data[0].id);
          setPayment((current) => ({
            ...current,
            invoiceId: invoiceResult.data[0].id,
            amount: String(
              invoiceResult.data[0].totalAmount - invoiceResult.data[0].paidAmount
            ),
          }));
        }
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
  }, [search, selectedInvoiceId, status]);

  async function refreshInvoices(nextSelectedId = selectedInvoiceId) {
    const result = await listInvoices({ search, status });
    setInvoices(result.data);
    if (nextSelectedId) setSelectedInvoiceId(nextSelectedId);
  }

  async function submitInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceOrderId) return;

    setError("");
    setIsSubmitting(true);
    try {
      const invoice = await createInvoice({ serviceOrderId, dueAt });
      setServiceOrderId("");
      setDueAt("");
      await refreshInvoices(invoice.id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payment.invoiceId) return;

    setError("");
    setIsSubmitting(true);
    try {
      await createPayment({
        invoiceId: payment.invoiceId,
        amount: Number(payment.amount),
        method: payment.method,
        referenceNumber: payment.referenceNumber,
        note: payment.note,
      });
      setPayment(emptyPayment);
      await refreshInvoices(payment.invoiceId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGeneratePdf(id: string) {
    setError("");
    try {
      const invoice = await generateInvoicePdf(id);
      await refreshInvoices(invoice.id);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Request gagal");
    }
  }

  function selectInvoice(invoice: AdminInvoice) {
    const remaining = Math.max(invoice.totalAmount - invoice.paidAmount, 0);
    setSelectedInvoiceId(invoice.id);
    setPayment((current) => ({
      ...current,
      invoiceId: invoice.id,
      amount: String(remaining),
    }));
  }

  return (
    <AdminShell
      title="Invoices & Payments"
      description="Generate invoice from completed service orders and record customer payments."
    >
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Invoices" value={summary.totalInvoices} icon="invoice" />
        <SummaryCard title="Paid" value={formatRupiah(summary.paidAmount)} icon="paid" />
        <SummaryCard
          title="Outstanding"
          value={formatRupiah(summary.unpaidAmount)}
          icon="unpaid"
          danger={summary.unpaidAmount > 0}
        />
        <SummaryCard
          title="Need Action"
          value={summary.unpaidCount}
          icon="unpaid"
          danger={summary.unpaidCount > 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Invoice List</CardTitle>
            <CardDescription>
              Filter invoice by customer, number, service order, or payment status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <Field label="Search" value={search} onChange={setSearch} required={false} />
              <SelectField
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "", label: "All status" },
                  { value: "UNPAID", label: "Unpaid" },
                  { value: "PARTIAL", label: "Partial" },
                  { value: "PAID", label: "Paid" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </div>
            <InvoiceTable
              invoices={invoices}
              isLoading={isLoading}
              selectedId={selectedInvoice?.id || ""}
              onGeneratePdf={handleGeneratePdf}
              onSelect={selectInvoice}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Invoice</CardTitle>
              <CardDescription>Only completed service orders can become invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitInvoice}>
                <SelectField
                  label="Service Order"
                  value={serviceOrderId}
                  onChange={setServiceOrderId}
                  options={[
                    { value: "", label: "Pilih service order" },
                    ...completedOrders.map((order) => ({
                      value: order.id,
                      label: `${order.code} - ${order.customer?.name || order.serviceName}`,
                    })),
                  ]}
                />
                <Field
                  label="Due Date"
                  type="date"
                  required={false}
                  value={dueAt}
                  onChange={setDueAt}
                />
                <Button className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create Invoice"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record Payment</CardTitle>
              <CardDescription>Confirmed payments update invoice status automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitPayment}>
                <SelectField
                  label="Invoice"
                  value={payment.invoiceId}
                  onChange={(invoiceId) =>
                    setPayment({ ...payment, invoiceId })
                  }
                  options={[
                    { value: "", label: "Pilih invoice" },
                    ...invoices.map((invoice) => ({
                      value: invoice.id,
                      label: `${invoice.invoiceNumber} - ${invoice.customer?.name || "-"}`,
                    })),
                  ]}
                />
                <Field
                  label="Amount"
                  type="number"
                  value={payment.amount}
                  onChange={(amount) => setPayment({ ...payment, amount })}
                />
                <SelectField
                  label="Method"
                  value={payment.method}
                  onChange={(method) =>
                    setPayment({ ...payment, method: method as PaymentMethod })
                  }
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "BANK_TRANSFER", label: "Bank Transfer" },
                    { value: "QRIS_MANUAL", label: "QRIS Manual" },
                  ]}
                />
                <Field
                  label="Reference"
                  required={false}
                  value={payment.referenceNumber}
                  onChange={(referenceNumber) =>
                    setPayment({ ...payment, referenceNumber })
                  }
                />
                <Field
                  label="Note"
                  required={false}
                  value={payment.note}
                  onChange={(note) => setPayment({ ...payment, note })}
                />
                <Button className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Payment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Detail</CardTitle>
          <CardDescription>Items and payment history for selected invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceDetail invoice={selectedInvoice} />
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
  icon: "invoice" | "paid" | "unpaid";
  danger?: boolean;
}) {
  const Icon = icon === "paid" ? WalletCards : icon === "unpaid" ? Receipt : FileText;
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

function InvoiceTable({
  invoices,
  isLoading,
  selectedId,
  onSelect,
  onGeneratePdf,
}: {
  invoices: AdminInvoice[];
  isLoading: boolean;
  selectedId: string;
  onSelect: (invoice: AdminInvoice) => void;
  onGeneratePdf: (id: string) => void;
}) {
  if (isLoading) return <EmptyPanel text="Memuat invoice..." />;
  if (invoices.length === 0) return <EmptyPanel text="Belum ada invoice." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow
            key={invoice.id}
            className={cn(selectedId === invoice.id && "bg-muted/50")}
          >
            <TableCell>
              <button
                type="button"
                className="text-left font-medium text-primary"
                onClick={() => onSelect(invoice)}
              >
                {invoice.invoiceNumber}
              </button>
              <div className="text-xs text-muted-foreground">
                {invoice.serviceOrder?.code || "-"}
              </div>
            </TableCell>
            <TableCell>{invoice.customer?.name || "-"}</TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell>{formatRupiah(invoice.totalAmount)}</TableCell>
            <TableCell>{formatRupiah(invoice.paidAmount)}</TableCell>
            <TableCell>{formatDate(invoice.dueAt)}</TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onGeneratePdf(invoice.id)}
              >
                PDF
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function InvoiceDetail({ invoice }: { invoice?: AdminInvoice }) {
  if (!invoice) return <EmptyPanel text="Pilih invoice untuk melihat detail." />;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold">Items</h3>
        <div className="mt-3 overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.items || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.type}</div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatRupiah(item.price)}</TableCell>
                  <TableCell>{formatRupiah(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold">Payments</h3>
        <div className="mt-3 overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.payments || []).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">{payment.paymentNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(payment.paidAt)}
                    </div>
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{formatRupiah(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "CONFIRMED" ? "secondary" : "outline"}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: AdminInvoice["status"] }) {
  if (status === "PAID") return <Badge className="bg-emerald-600">PAID</Badge>;
  if (status === "PARTIAL") return <Badge className="bg-amber-600">PARTIAL</Badge>;
  if (status === "UNPAID") return <Badge variant="destructive">UNPAID</Badge>;
  return <Badge variant="outline">{status}</Badge>;
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
