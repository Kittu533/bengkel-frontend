import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          BengkelPro
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Masuk sebagai admin, mechanic, atau customer untuk mengakses workspace.
        </p>

        <div className="mt-6">
          <AuthForm mode="login" />
        </div>

        <p className="mt-5 text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link className="font-semibold text-blue-700" href="/register">
            Register customer
          </Link>
        </p>
      </section>
    </main>
  );
}
