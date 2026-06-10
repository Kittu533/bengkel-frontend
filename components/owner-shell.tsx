"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { BarChart3, Wrench } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";

export function OwnerShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
      <main className="min-h-screen bg-muted/40 text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/owner/dashboard" className="flex items-center gap-2 font-bold text-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline-block">BengkelPro Owner</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Reports
              </Badge>
              <LogoutButton />
            </div>
          </div>
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
