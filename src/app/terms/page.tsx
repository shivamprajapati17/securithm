"use client";

import { Navbar } from "@/components/navbar";
import { Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM TERMS OF SERVICE
            </span>
            <span className="ml-auto text-[9px] text-[var(--color-term-muted)] font-mono">
              v1.0 — Last updated: July 2026
            </span>
          </div>
          <div className="p-6 space-y-6 text-xs font-mono text-[var(--color-term-fg)]">
            <p className="text-[var(--color-term-muted)]">
              {`# TERMS OF SERVICE — SECURITHM`}
            </p>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                1. ACCEPTANCE OF TERMS
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                By accessing or using the Securithm platform ("Service"), you agree to be bound
                by these Terms of Service ("Terms"). If you do not agree to these Terms, do not
                access or use the Service. These Terms constitute a binding legal agreement between
                you and Securithm Inc.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                2. SERVICE DESCRIPTION
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                Securithm provides AI-powered smart contract security analysis, including but not
                limited to: static analysis, symbolic execution, risk scoring, continuous
                monitoring, and remediation guidance. The Service analyzes smart contract source
                code and on-chain data to identify potential security vulnerabilities.
              </p>
              <div className="border border-[var(--color-term-border)] p-3 mt-2">
                <p className="text-[var(--color-term-warning)] text-[10px]">
                  IMPORTANT DISCLAIMER: AI-generated analysis provides preliminary findings only
                  and is not a substitute for a full professional manual audit. Always engage a
                  qualified security firm for production deployments.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                3. USER OBLIGATIONS
              </h2>
              <ul className="space-y-2 text-[var(--color-term-muted)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  You must be at least 18 years old to use the Service.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  You are responsible for maintaining the confidentiality of your account credentials.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  You agree not to use the Service for any unlawful purpose or in violation of any applicable laws.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  You retain all rights to the smart contract code you submit for analysis.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                4. SUBSCRIPTIONS AND PAYMENTS
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                Free tier: 50 scans per month, basic monitoring for 1 contract. Paid plans are
                billed monthly or annually. All fees are non-refundable except as required by law.
                We may change our pricing with 30 days notice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                5. LIMITATION OF LIABILITY
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                To the maximum extent permitted by law, Securithm shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages arising from
                your use of the Service. Our total liability shall not exceed the amount paid by
                you in the 12 months preceding the claim.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                6. SERVICE LEVELS
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                Enterprise plan includes a 99.9% uptime SLA. Standard and Pro plans are provided
                on a commercially reasonable effort basis. Scheduled maintenance will be announced
                via the status page at /status.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                7. TERMINATION
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                Either party may terminate these Terms at any time. Upon termination, your right
                to access the Service ceases immediately. Your data will be deleted within 30 days
                of termination unless required otherwise by law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                8. CONTACT
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                For questions about these Terms, contact legal@securithm.io
              </p>
            </section>

            <div className="border-t border-[var(--color-term-border)] pt-4 mt-6">
              <p className="text-[9px] text-[var(--color-term-muted)] font-mono">
                END OF TERMS — Securithm Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
