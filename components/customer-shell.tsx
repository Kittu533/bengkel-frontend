"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { 
  LayoutDashboard, 
  Car, 
  CalendarDays, 
  Search, 
  History, 
  FileText,
  Wrench
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/vehicles", label: "Kendaraan", icon: Car },
  { href: "/customer/bookings", label: "Booking", icon: CalendarDays },
  { href: "/customer/tracking", label: "Tracking", icon: Search },
  { href: "/customer/history", label: "Riwayat", icon: History },
  { href: "/customer/invoices", label: "Invoice", icon: FileText },
];

export function CustomerShell({
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
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <main className="min-h-screen bg-muted/40 text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-16 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline-block">BengkelPro</span>
            </Link>
            <div className="flex items-center gap-2">
              <LogoutButton />
            </div>
          </div>
          <nav className="border-t">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      asChild
                      className={cn(
                        "flex-shrink-0 gap-2",
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
        
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground">
              {description}
            </p>
          </div>
          {children}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replaceAll("_", " ");
  return (
    <Badge variant="outline" className="capitalize">
      {normalized}
    </Badge>
  );
}
