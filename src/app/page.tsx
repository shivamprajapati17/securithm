"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { ScanInput } from "@/components/scan-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ThreeBackground = dynamic(
  () => import("@/components/three-background"),
  { ssr: false },
);
import {
  ArrowRight,
  Shield,
  Zap,
  GitBranch,
  Bell,
  FileText,
  BarChart3,
  Github,
  BookOpen,
  Terminal,
  Users,
  Building2,
  Lock,
  ExternalLink,
} from "lucide-react";

const stats = [
  { label: "CONTRACTS_ANALYZED", value: "10,000+" },
  { label: "BUGS_CAUGHT", value: "500+" },
  { label: "DEV_SIGNUPS", value: "2,000+" },
  { label: "CHAINS_SUPPORTED", value: "6" },
];

const features = [
  {
    icon: Zap,
    title: "INSTANT_ANALYSIS",
    description:
      "AI-powered static, symbolic, and reasoning analysis returns results in under 30 seconds for contracts under 1,000 lines.",
  },
  {
    icon: GitBranch,
    title: "CI/CD_INTEGRATION",
    description:
      "GitHub Action runs on every push and PR. Inline comments, severity gating, and SARIF reports in your Security tab.",
  },
  {
    icon: Bell,
    title: "CONTINUOUS_MONITOR",
    description:
      "Watch deployed contracts for anomalous on-chain activity — large outflows, unknown callers, TVL drops — in real time.",
  },
  {
    icon: FileText,
    title: "FIX_SUGGESTIONS",
    description:
      "AI-generated secure code replacements with plain-English explanations. Apply all fixes with one click.",
  },
  {
    icon: BarChart3,
    title: "RISK_SCORE_API",
    description:
      "Public risk scoring for any contract address. Used by exchanges for listing diligence and funds for portfolio risk.",
  },
  {
    icon: Shield,
    title: "REMEDIATION_FLOW",
    description:
      "Assign findings, set SLA deadlines, track resolution. Export a Security Posture Report as PDF for auditors.",
  },
];

const chains = [
  { name: "Ethereum", color: "text-[var(--color-term-fg)]" },
  { name: "Base", color: "text-[var(--color-term-fg)]" },
  { name: "Arbitrum", color: "text-[var(--color-term-fg)]" },
  { name: "Polygon", color: "text-[var(--color-term-fg)]" },
  { name: "BSC", color: "text-[var(--color-term-fg)]" },
  { name: "Solana", color: "text-[var(--color-term-fg)]" },
];

const personas = [
  {
    icon: Terminal,
    title: "SOLO_DEV",
    description:
      "Free tier, instant feedback, plain-English fix guidance.",
    badge: "FREE",
  },
  {
    icon: Users,
    title: "PROTOCOL_TEAM",
    description:
      "CI/CD gating, team seats, continuous monitoring, audit trail.",
    badge: "PRO",
  },
  {
    icon: Building2,
    title: "INSTITUTION",
    description:
      "Risk Score API, portfolio dashboard, SOC 2 compliance, SLA.",
    badge: "ENTERPRISE",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        <ThreeBackground />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            {/* ASCII Logo */}
            <pre className="text-[var(--color-term-fg)] term-glow text-xs sm:text-sm leading-tight mb-8 bg-transparent border-none text-center overflow-x-auto">
{`  ╔═══╗╦ ╦╦  ╦╔╦╗╔═╗╔╦╗
  ║╣ ║║ ║║  ║ ║║║ ╦ ║║
  ╚═╝╚╝╚═╝╩═╝╩═╝╩ ╩═╩╝
  SMART CONTRACT SECURITY`}
            </pre>

            <div className="inline-flex items-center gap-2 px-2 py-1 border border-[var(--color-term-border)] mb-6">
              <span className="text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
                # STATUS: PUBLIC_BETA [OK]
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-6 text-[var(--color-term-fg)] term-glow">
              SHIP SECURE CONTRACTS.
              <br />
              <span className="text-[var(--color-term-secondary)] term-glow-amber">
                BEFORE THE HACKERS FIND THE BUGS.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-term-muted)] max-w-2xl mx-auto">
              AI-POWERED SMART CONTRACT SECURITY ANALYSIS. PASTE YOUR CODE,
              A DEPLOYED ADDRESS, OR CONNECT YOUR REPO — GET SEVERITY-TAGGED
              FINDINGS, FIX SUGGESTIONS, AND A RISK SCORE IN SECONDS.
            </p>
          </div>

          {/* Scan Input */}
          <div className="max-w-3xl mx-auto mb-8">
            <ScanInput variant="hero" />
          </div>

          {/* No signup badge */}
          <div className="text-center">
            <Badge variant="default">
              <Lock className="h-3 w-3 mr-1" />
              NO SIGNUP REQUIRED FOR BASIC SCAN
            </Badge>
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="border-y border-[var(--color-term-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center border border-[var(--color-term-border)] p-4">
                <div className="text-lg sm:text-xl font-bold text-[var(--color-term-fg)] term-glow">
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-[var(--color-term-muted)] mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAINS ── */}
      <section className="py-8 border-b border-[var(--color-term-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[10px] font-mono text-[var(--color-term-muted)] mb-4 uppercase tracking-wider">
            # SUPPORTED_CHAINS
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {chains.map((chain) => (
              <div
                key={chain.name}
                className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-term-border)]"
              >
                <span className="text-[11px] font-mono text-[var(--color-term-fg)] uppercase tracking-wider">{chain.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
              $ FEATURES --ALL
            </h2>
            <p className="text-xs text-[var(--color-term-muted)]">
              FROM INSTANT PRE-DEPLOY CHECKS TO CONTINUOUS POST-DEPLOY
              MONITORING — SECURITHM COVERS THE FULL SECURITY LIFECYCLE.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group border border-[var(--color-term-border)] p-4 hover:border-[var(--color-term-fg)] transition-colors animate-glitch"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center border border-[var(--color-term-border)] text-[var(--color-term-fg)]">
                    <feature.icon className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--color-term-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONAS ── */}
      <section className="py-16 border-y border-[var(--color-term-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
              $ TARGET_USERS --LIST
            </h2>
            <p className="text-xs text-[var(--color-term-muted)]">
              FROM SOLO DEVELOPERS SHIPPING THEIR FIRST TOKEN TO INSTITUTIONS
              EVALUATING COUNTERPARTY RISK.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <div
                key={persona.title}
                className="border border-[var(--color-term-border)] p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center border border-[var(--color-term-border)] text-[var(--color-term-fg)]">
                    <persona.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider">
                      {persona.title}
                    </h3>
                    <Badge variant="default" className="mt-0.5 text-[9px]">
                      [{persona.badge}]
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-term-muted)]">
                  {persona.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GITHUB INTEGRATION ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center border border-[var(--color-term-border)] mb-4">
              <Github className="h-5 w-5 text-[var(--color-term-fg)]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
              $ GITHUB_INTEGRATION --SETUP
            </h2>
            <p className="text-xs text-[var(--color-term-muted)] mb-6 max-w-xl mx-auto">
              INSTALL THE SECURITHM GITHUB ACTION. IT AUTOMATICALLY SCANS EVERY PR
              AND PUSH, POSTS INLINE COMMENTS, AND FAILS CI ABOVE YOUR CONFIGURED
              SEVERITY THRESHOLD.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="default" className="gap-2">
                <Github className="h-3.5 w-3.5" />
                [ INSTALL_APP ]
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="default" className="gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                $ READ_DOCS
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 border-t border-[var(--color-term-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="border border-[var(--color-term-fg)] p-8 bg-[var(--color-term-dim)]">
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
              $ START_SECURING --NOW
            </h2>
            <p className="text-xs text-[var(--color-term-muted)] mb-6 max-w-xl mx-auto">
              NO CREDIT CARD REQUIRED. FREE TIER INCLUDES 50 SCANS/MONTH AND
              BASIC MONITORING.
            </p>
            <Button size="lg" variant="default">
              [ SCAN_YOUR_FIRST_CONTRACT ]
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--color-term-border)] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
                SECURITHM
              </span>
              <span className="text-[9px] text-[var(--color-term-muted)] font-mono">
                v0.1.0
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
              <a href="#" className="hover:text-[var(--color-term-fg)]">$ TERMS</a>
              <a href="#" className="hover:text-[var(--color-term-fg)]">$ PRIVACY</a>
              <a href="#" className="hover:text-[var(--color-term-fg)]">$ SOC2</a>
              <a href="#" className="hover:text-[var(--color-term-fg)]">$ STATUS</a>
              <span className="text-[var(--color-term-muted)]">© 2026 SECURITHM</span>
            </div>
          </div>
          <p className="text-center text-[9px] text-[var(--color-term-dim)] mt-4 max-w-2xl mx-auto font-mono">
            # DISCLAIMER: AI ANALYSIS PROVIDES PRELIMINARY FINDINGS AND IS NOT A
            SUBSTITUTE FOR A FULL MANUAL AUDIT. ALWAYS ENGAGE A PROFESSIONAL
            SECURITY FIRM FOR PRODUCTION DEPLOYMENTS.
          </p>
        </div>
      </footer>
    </div>
  );
}
