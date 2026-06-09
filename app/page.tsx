import Link from "next/link";
import { PublicShell } from "@/components/public-layout";

export default function Home() {
  return (
    <PublicShell>
      <section className="mx-auto flex min-h-[calc(100vh-137px)] w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            BengkelPro
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Sistem operasional bengkel untuk booking, tracking, dan invoice.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Lihat katalog service dan sparepart, register sebagai customer, lalu
            gunakan dashboard untuk booking dan tracking service.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/services"
            className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            Lihat Service
          </Link>
          <Link
            href="/spareparts"
            className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Lihat Sparepart
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Register
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
