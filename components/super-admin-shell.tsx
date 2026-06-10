"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Building2, CreditCard, LayoutDashboard, Shield, Wrench } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/super-admin/plans", label: "Plans", icon: CreditCard },
];

export function SuperAdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
      <main className="min-h-screen bg-muted/40 text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/super-admin/dashboard" className="flex items-center gap-2 font-bold text-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline-block">BengkelPro SaaS</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground sm:flex">
                <Shield className="h-3.5 w-3.5" />
                Super Admin
              </div>
              <LogoutButton />
            </div>
          </div>
          <nav className="border-t">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex gap-1 overflow-x-auto py-2">
                {navItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      key={item.href}
                      asChild
                      size="sm"
                      variant={active ? "secondary" : "ghost"}
                      className={cn("shrink-0 gap-2", active ? "font-semibold" : "text-muted-foreground")}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </nav>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export function SaasStatusBadge({ status }: { status: string }) {
  const tone =
    status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "SUSPENDED" || status === "PAST_DUE"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", tone)}>
      {status.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}
