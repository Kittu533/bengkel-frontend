"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboardPath,
  login,
  registerCustomer,
  saveSession,
} from "@/lib/auth";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const session =
        mode === "register"
          ? await registerCustomer({
              name: String(formData.get("name") || ""),
              email: String(formData.get("email") || ""),
              phone: String(formData.get("phone") || ""),
              password: String(formData.get("password") || ""),
              confirmPassword: String(formData.get("confirmPassword") || ""),
            })
          : await login({
              email: String(formData.get("email") || ""),
              password: String(formData.get("password") || ""),
            });

      saveSession(session);
      router.push(getDashboardPath(session.user));
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Request gagal"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" ? (
        <>
          <Field label="Nama" name="name" autoComplete="name" />
          <Field label="Nomor HP" name="phone" autoComplete="tel" />
        </>
      ) : null}

      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />
      {mode === "register" ? (
        <Field
          label="Konfirmasi Password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
        />
      ) : null}

      {mode === "login" ? (
        <p className="text-sm text-slate-500">Forgot password akan disiapkan setelah MVP auth dasar stabil.</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting
          ? "Memproses..."
          : mode === "login"
            ? "Login"
            : "Register"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
      />
    </label>
  );
}
