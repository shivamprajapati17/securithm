"use client";

import { Navbar } from "@/components/navbar";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM PRIVACY POLICY
            </span>
            <span className="ml-auto text-[9px] text-[var(--color-term-muted)] font-mono">
              v1.0 — Last updated: July 2026
            </span>
          </div>
          <div className="p-6 space-y-6 text-xs font-mono text-[var(--color-term-fg)]">
            <p className="text-[var(--color-term-muted)]">
              {`# PRIVACY POLICY — SECURITHM`}
            </p>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                1. DATA WE COLLECT
              </h2>
              <div className="space-y-2 text-[var(--color-term-muted)] leading-relaxed">
                <p>We collect the following categories of data:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-term-fg)]">&gt;</span>
                    Account information: email address, display name, and authentication credentials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-term-fg)]">&gt;</span>
                    Smart contract source code you submit for analysis
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-term-fg)]">&gt;</span>
                    Usage data: scan history, feature interactions, and performance metrics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-term-fg)]">&gt;</span>
                    GitHub repository metadata when you connect via OAuth
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                2. HOW WE USE DATA
              </h2>
              <ul className="space-y-1.5 text-[var(--color-term-muted)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Provide and improve the smart contract analysis Service
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Train and improve our AI analysis models (anonymized contract code only)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Communicate with you about service updates, security alerts, and billing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Comply with legal obligations and enforce our Terms
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                3. DATA SHARING
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                We do not sell your personal data. We may share anonymized contract code with
                third-party AI providers solely for analysis processing. We may disclose data if
                required by law or to protect our rights.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                4. DATA RETENTION
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                We retain your account data for as long as your account is active. Scan results
                are retained for 2 years. Anonymized contract code used for model training is
                retained indefinitely. You may request deletion at any time by contacting
                privacy@securithm.io.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                5. SECURITY
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                We implement industry-standard security measures including encryption at rest and
                in transit, access controls, and regular security audits. Our SOC 2 Type II
                certification validates our security controls. See /soc2 for details.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                6. YOUR RIGHTS
              </h2>
              <ul className="space-y-1.5 text-[var(--color-term-muted)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Right to access, correct, or delete your personal data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Right to data portability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Right to withdraw consent at any time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-term-fg)]">&gt;</span>
                  Right to lodge a complaint with a supervisory authority
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
                7. CONTACT
              </h2>
              <p className="text-[var(--color-term-muted)] leading-relaxed">
                Data Controller: Securithm Inc. Contact privacy@securithm.io for any privacy-related inquiries.
              </p>
            </section>

            <div className="border-t border-[var(--color-term-border)] pt-4 mt-6">
              <p className="text-[9px] text-[var(--color-term-muted)] font-mono">
                END OF PRIVACY POLICY — Securithm Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
