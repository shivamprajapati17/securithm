"use client";

import {
  LayoutDashboard,
  Shield,
  GitBranch,
  Radio,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CiStatusIndicator } from "@/components/ci-status";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Shield, label: "Scans", href: "/dashboard/scans" },
  { icon: GitBranch, label: "Repos", href: "/dashboard/repos" },
  { icon: Radio, label: "Monitor", href: "/dashboard/monitoring" },
  { icon: Users, label: "Team", href: "/dashboard/team" },
  { icon: BarChart3, label: "Risk API", href: "/dashboard/api-console" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  // Close mobile sidebar on route change (when a link is clicked)
  const handleNavClick = () => {
    setMobileOpen(false);
  };

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo / Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-[var(--color-term-border)] shrink-0">
        <a
          href="/dashboard"
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center w-full"
          )}
          onClick={handleNavClick}
        >
          <span className="text-xs font-bold text-[var(--color-term-fg)] term-glow">
            {collapsed ? "AI" : "SECURITHM"}
          </span>
        </a>
        {/* Desktop collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] transition-colors text-xs px-1 hidden md:block",
            collapsed && "hidden"
          )}
        >
          &lt;
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-2 px-2 py-2 text-xs font-mono transition-all duration-150",
              "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)]",
              "group relative",
              collapsed && "justify-center"
            )}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="uppercase tracking-wider">{item.label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 border border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-fg)] text-xs font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {item.label}
              </div>
            )}
          </a>
        ))}
      </nav>

      {/* CI Status */}
      <CiStatusIndicator collapsed={collapsed} />

      {/* User area */}
      <div className="p-2 border-t border-[var(--color-term-border)] shrink-0">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--color-term-border)] bg-[var(--color-term-dim)] text-[var(--color-term-fg)] text-[10px] font-bold font-mono">
            {user ? (
              user.display_name?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()
            ) : (
              <LogOut className="h-3 w-3" />
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-[var(--color-term-fg)] truncate uppercase tracking-wider">
                {user ? (user.display_name || user.email.split("@")[0]) : "guest"}
              </div>
              <div className="text-[9px] font-mono text-[var(--color-term-muted)] truncate uppercase">
                {isAuthenticated ? "LOGGED IN" : "NOT SIGNED IN"}
              </div>
            </div>
          )}
          {!collapsed && isAuthenticated && (
            <button
              onClick={logout}
              className="text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] transition-colors"
              title="Logout"
            >
              <LogOut className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button - visible only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-30 md:hidden border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-1.5 text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)]"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar - overlay */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-[var(--color-term-border)] bg-[var(--color-term-bg)] flex flex-col transition-transform duration-200",
          // Desktop: always visible
          "md:flex",
          // Desktop width
          collapsed ? "md:w-14" : "md:w-56",
          // Mobile: overlay
          "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
