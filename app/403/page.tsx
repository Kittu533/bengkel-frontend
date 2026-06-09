import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
          403
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Akses ditolak
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Role akun ini tidak sesuai dengan halaman yang ingin dibuka.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Kembali ke login
        </Link>
      </section>
    </main>
  );
}
