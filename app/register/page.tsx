import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          BengkelPro
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Register Customer
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Buat akun customer untuk booking service dan tracking kendaraan.
        </p>

        <div className="mt-6">
          <AuthForm mode="register" />
        </div>

        <p className="mt-5 text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link className="font-semibold text-blue-700" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
