"use client";

import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Sidebar />
      <div className="md:pl-56 pl-0">
        <main className="p-6 pt-14 md:pt-6">{children}</main>
      </div>
    </div>
  );
}
