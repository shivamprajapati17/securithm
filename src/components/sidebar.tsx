"use client";

import {
  LayoutDashboard,
  Shield,
  GitBranch,
  Radio,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CiStatusIndicator } from "@/components/ci-status";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Shield, label: "Scans", href: "/dashboard/scans" },
  { icon: GitBranch, label: "Repositories", href: "/dashboard/repos" },
  { icon: Radio, label: "Monitoring", href: "/dashboard/monitoring" },
  { icon: Users, label: "Team", href: "/dashboard/team" },
  { icon: BarChart3, label: "Risk API", href: "/dashboard/api-console" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-surface-200 dark:border-surface-800">
        <a
          href="/dashboard"
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center w-full"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight">AuditAI</span>
          )}
        </a>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4 text-surface-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800",
              "group relative"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-surface-900 dark:bg-surface-50 text-surface-50 dark:text-surface-900 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {item.label}
              </div>
            )}
          </a>
        ))}
      </nav>

      {/* CI Status */}
      <CiStatusIndicator collapsed={collapsed} />

      {/* User area */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-800">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-bold">
            AD
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                Solidity Dev
              </div>
              <div className="text-xs text-surface-400 truncate">
                Free Plan
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
