"use client";

import { useState, useEffect, useCallback } from "react";
import { seedSolvencyDemo, getPublicDashboard } from "@/lib/api";
import {
  Shield,
  Wallet,
  Users,
  Scale,
  ArrowRight,
  FileCheck,
  Fingerprint,
  Boxes,
  Database,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SolvencyLandingPage() {
  const [seeding, setSeeding] = useState(false);
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [hasDemo, setHasDemo] = useState(false);

  const checkDemo = useCallback(async () => {
    try {
      // Seed on demand first — the endpoint is idempotent (reuses the demo org),
      // so a fresh database gets a valid slug instead of a guaranteed 404.
      const res = await seedSolvencyDemo().catch(() => null);
      const slug: string = res?.orgSlug ?? "auditai-demo";
      await getPublicDashboard(slug);
      setHasDemo(true);
      setDemoUrl(res?.public_url ?? `/solvency/${slug}`);
    } catch {
      setHasDemo(false);
    }
  }, []);

  useEffect(() => {
    checkDemo();
  }, [checkDemo]);

  const handleSeed = async () => {
    setSeeding(true);
    setDemoError(null);
    try {
      const res = await seedSolvencyDemo();
      setDemoUrl(res.public_url);
      setHasDemo(true);
    } catch (e) {
      setDemoError(
        e instanceof Error
          ? e.message
          : "Failed to create demo — ensure the backend is running"
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <header className="border-b border-[var(--color-term-border)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center border border-[var(--color-term-border)]">
              <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-term-fg)] term-glow">
              AuditAI Solvency
            </span>
          </a>
          <nav className="flex items-center gap-4">
            <a
              href="/solvency/verify"
              className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] transition-colors"
            >
              verify inclusion
            </a>
            <a
              href="/"
              className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] transition-colors"
            >
              back to auditai
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-12">
        {/* Hero */}
        <div className="max-w-3xl">
          <div className="text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
            WEB3 SECURITY &amp; SOLVENCY INFRASTRUCTURE
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-term-fg)] term-glow mt-3 uppercase leading-tight">
            Proof of Reserves.
            <br />
            Proof of Liabilities.
            <br />
            Proof of Solvency.
          </h1>
          <p className="text-xs font-mono text-[var(--color-term-muted)] mt-4 max-w-2xl leading-relaxed">
            AuditAI verifies a defined set of reserves and liabilities under a
            published methodology and calculates the resulting coverage ratio.
            Every attestation is a verifiable evidence chain — from on-chain
            wallet balances, through a Merkle Sum Tree commitment of liabilities,
            to a signed solvency attestation anyone can check.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {hasDemo && demoUrl ? (
              <a href={demoUrl}>
                <Button size="lg">
                  view live demo dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            ) : (
              <Button size="lg" onClick={handleSeed} disabled={seeding}>
                {seeding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    seeding demo...
                  </>
                ) : (
                  <>
                    create live demo
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            <a href="/solvency/verify">
              <Button variant="outline" size="lg">
                verify your inclusion
              </Button>
            </a>
          </div>
          {demoError && (
            <div className="mt-3 text-[10px] font-mono text-[var(--color-term-error)]">
              ✗ {demoError}
            </div>
          )}
        </div>

        {/* Three proofs */}
        <section className="grid sm:grid-cols-3 gap-3">
          {[
            {
              icon: Wallet,
              title: "Proof of Reserves",
              desc: "On-chain wallet balances fetched from the blockchain, with wallet ownership verified by message signature.",
            },
            {
              icon: Users,
              title: "Proof of Liabilities",
              desc: "Customer liabilities committed via a Merkle Sum Tree. Users get private inclusion proofs without exposing balances.",
            },
            {
              icon: Scale,
              title: "Proof of Solvency",
              desc: "Verified reserve value ÷ verified liability value = coverage ratio, under configurable thresholds.",
            },
          ].map((p) => (
            <div key={p.title} className="border border-[var(--color-term-border)] p-5">
              <div className="flex h-9 w-9 items-center justify-center border border-[var(--color-term-border)] mb-3">
                <p.icon className="h-4 w-4 text-[var(--color-term-fg)]" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-term-fg)]">
                {p.title}
              </h2>
              <p className="text-[10px] font-mono text-[var(--color-term-muted)] mt-2 leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Evidence chain */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-term-fg)] mb-3">
            The verifiable evidence chain
          </h2>
          <div className="border border-[var(--color-term-border)] overflow-x-auto">
            <div className="flex items-stretch min-w-max">
              {[
                { icon: Wallet, label: "Wallet" },
                { icon: Database, label: "Balance" },
                { icon: Fingerprint, label: "Ownership proof" },
                { icon: Boxes, label: "Reserve snapshot" },
                { icon: Database, label: "Asset valuation" },
                { icon: Boxes, label: "Liability commitment" },
                { icon: Fingerprint, label: "User inclusion proof" },
                { icon: Users, label: "Liability total" },
                { icon: Scale, label: "Solvency ratio" },
                { icon: FileCheck, label: "Signed attestation" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="flex items-center px-3 py-4 border-r border-[var(--color-term-border)] last:border-r-0"
                >
                  <div className="flex items-center gap-2">
                    <s.icon className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
                    <div>
                      <div className="text-[8px] text-[var(--color-term-muted)]">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--color-term-fg)] uppercase tracking-wider whitespace-nowrap">
                        {s.label}
                      </div>
                    </div>
                  </div>
                  {i < 9 && (
                    <ArrowRight className="h-3 w-3 text-[var(--color-term-muted)] ml-3" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="border border-dashed border-[var(--color-term-muted)] px-4 py-3">
          <p className="text-[9px] font-mono text-[var(--color-term-muted)] leading-relaxed">
            ⚠ AUDITAI VERIFIES A DEFINED SET OF RESERVES AND LIABILITIES UNDER
            THE PUBLISHED METHODOLOGY AND CALCULATES THE RESULTING COVERAGE
            RATIO. THIS DOES NOT CONSTITUTE A LEGAL STATEMENT OF FINANCIAL
            SOLVENCY. PROOFS COVER CRYPTOGRAPHIC CLAIMS ONLY AND MAY NOT REFLECT
            ALL REAL-WORLD LIABILITIES OR OBLIGATIONS.
          </p>
        </div>
      </main>
    </div>
  );
}
