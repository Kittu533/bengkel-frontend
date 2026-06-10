"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ClipboardList, Search, Wrench } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mechanic/tasks", label: "Task Service", icon: ClipboardList },
];

export function MechanicShell({
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
    <ProtectedRoute allowedRoles={["MECHANIC", "ADMIN"]}>
      <main className="min-h-screen bg-muted/40 text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/mechanic/tasks" className="flex items-center gap-2 font-bold text-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline-block">BengkelPro Mechanic</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Workspace</Badge>
              <LogoutButton />
            </div>
          </div>
          <nav className="border-t">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex gap-1 overflow-x-auto py-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      asChild
                      className={cn(
                        "shrink-0 gap-2",
                        isActive ? "bg-secondary font-semibold" : "text-muted-foreground"
                      )}
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

export function MechanicEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function MechanicStatusBadge({ status }: { status: string }) {
  const tone =
    status === "COMPLETED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "CANCELLED"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", tone)}>
      {status.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}
