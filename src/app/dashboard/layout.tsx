"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
        <div className="border border-[var(--color-term-border)] p-4 text-center">
          <p className="text-xs text-[var(--color-term-fg)] font-mono">AUTHENTICATING...</p>
          <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-2 animate-blink">▌</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
        <div className="border border-[var(--color-term-border)] p-4 text-center">
          <p className="text-xs text-[var(--color-term-muted)] font-mono">REDIRECTING TO LOGIN...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[var(--color-term-bg)]">
        <Sidebar />
        <div className="md:pl-56 pl-0">
          <main className="p-6 pt-14 md:pt-6">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
