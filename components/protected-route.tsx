"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, getCurrentUser, getSession, hasRole, Role } from "@/lib/auth";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"checking" | "allowed">("checking");
  const allowedRoleKey = useMemo(
    () => allowedRoles.slice().sort().join("|"),
    [allowedRoles]
  );
  const isAllowed = user
    ? hasRole(user, allowedRoleKey.split("|").filter(Boolean) as Role[])
    : false;

  useEffect(() => {
    let isMounted = true;

    const session = getSession();
    const requiredRoles = allowedRoleKey.split("|").filter(Boolean) as Role[];

    if (!session) {
      router.replace("/login");
      return;
    }

    getCurrentUser()
      .then(({ user }) => {
        if (!isMounted) return;
        if (!hasRole(user, requiredRoles)) {
          router.replace("/403");
          return;
        }
        setUser(user);
        setStatus("allowed");
      })
      .catch(() => {
        if (!isMounted) return;
        router.replace("/login");
      });

    return () => {
      isMounted = false;
    };
  }, [allowedRoleKey, router]);

  if (!user || !isAllowed || status !== "allowed") {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-4 h-24 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  return children;
}
