import Link from "next/link";
import { ReactNode } from "react";

export function PublicNavbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-950">
          BengkelPro
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link className="hover:text-blue-700" href="/services">
            Services
          </Link>
          <Link className="hover:text-blue-700" href="/spareparts">
            Spareparts
          </Link>
          <Link className="hover:text-blue-700" href="/login">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-500">
        BengkelPro - katalog service dan sparepart bengkel otomotif.
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicNavbar />
      {children}
      <PublicFooter />
    </div>
  );
}
