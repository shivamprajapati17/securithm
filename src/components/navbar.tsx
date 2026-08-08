"use client";

import { Shield, Menu, X, CalendarDays } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-term-border)] bg-[var(--color-term-bg)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center border border-[var(--color-term-border)] group-hover:bg-[var(--color-term-fg)] group-hover:border-[var(--color-term-fg)] transition-colors">
              <Shield className="h-4 w-4 text-[var(--color-term-fg)] group-hover:text-[var(--color-term-bg)]" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-term-fg)] term-glow">
              Securithm
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/features"
              className="text-xs font-mono uppercase tracking-wider text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] transition-colors"
            >
              features
            </a>
            <a
              href="/docs"
              className="text-xs font-mono uppercase tracking-wider text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] transition-colors"
            >
              docs
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-3 h-8 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              book demo
            </a>
          </div>

          <button
            className="md:hidden p-2 text-[var(--color-term-fg)] border border-[var(--color-term-border)]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-4 py-4 space-y-3">
          <a href="/features" className="block text-xs font-mono uppercase tracking-wider text-[var(--color-term-muted)]">
            features
          </a>
          <a href="/docs" className="block text-xs font-mono uppercase tracking-wider text-[var(--color-term-muted)]">
            docs
          </a>
          <div className="pt-2">
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              book demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
