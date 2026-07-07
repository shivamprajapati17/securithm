"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { ScanInput } from "@/components/scan-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeInSection, ScaleInSection, StaggerGrid } from "@/components/scroll-animations";
import AsciiCta from "@/components/ascii-cta";
import InstallCommand from "@/components/install-command";

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
  { label: "CONTRACTS ANALYZED", value: "10,000+" },
  { label: "BUGS CAUGHT", value: "500+" },
  { label: "DEV SIGNUPS", value: "2,000+" },
  { label: "CHAINS SUPPORTED", value: "6" },
];

const features = [
  {
    icon: Zap,
    title: "INSTANT ANALYSIS",
    description:
      "AI-powered static, symbolic, and reasoning analysis returns results in under 30 seconds for contracts under 1,000 lines.",
  },
  {
    icon: GitBranch,
    title: "CI/CD INTEGRATION",
    description:
      "GitHub Action runs on every push and PR. Inline comments, severity gating, and SARIF reports in your Security tab.",
  },
  {
    icon: Bell,
    title: "CONTINUOUS MONITOR",
    description:
      "Watch deployed contracts for anomalous on-chain activity including large outflows, unknown callers, and TVL drops in real time.",
  },
  {
    icon: FileText,
    title: "FIX SUGGESTIONS",
    description:
      "AI-generated secure code replacements with plain-English explanations. Apply all fixes with one click.",
  },
  {
    icon: BarChart3,
    title: "RISK SCORE API",
    description:
      "Public risk scoring for any contract address. Used by exchanges for listing diligence and funds for portfolio risk.",
  },
  {
    icon: Shield,
    title: "REMEDIATION FLOW",
    description:
      "Assign findings, set SLA deadlines, track resolution. Export a Security Posture Report as PDF for auditors.",
  },
];

const chains = [
  { name: "Ethereum" },
  { name: "Base" },
  { name: "Arbitrum" },
  { name: "Polygon" },
  { name: "BSC" },
  { name: "Solana" },
];

const personas = [
  {
    icon: Terminal,
    title: "SOLO DEV",
    description:
      "Free tier, instant feedback, plain-English fix guidance.",
    badge: "FREE",
  },
  {
    icon: Users,
    title: "PROTOCOL TEAM",
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
                STATUS: PUBLIC BETA [OK]
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
              AI-powered smart contract security analysis. Paste your code,
              a deployed address, or connect your repo. Get severity-tagged
              findings, fix suggestions, and a risk score in seconds.
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
      <FadeInSection>
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
      </FadeInSection>

      {/* ── CHAINS ── */}
      <FadeInSection delay={0.1}>
        <section className="py-8 border-b border-[var(--color-term-border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[10px] font-mono text-[var(--color-term-muted)] mb-4 uppercase tracking-wider">
              SUPPORTED CHAINS
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
      </FadeInSection>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
                FEATURES
              </h2>
              <p className="text-xs text-[var(--color-term-muted)]">
                From instant pre-deploy checks to continuous post-deploy
                monitoring. Securithm covers the full security lifecycle.
              </p>
            </div>
          </FadeInSection>

          <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerAmount={0.08}>
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
          </StaggerGrid>
        </div>
      </section>

      {/* ── INSTALL COMMAND ── */}
      <ScaleInSection>
        <section className="py-16 border-y border-[var(--color-term-border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
                QUICK INSTALL
              </h2>
              <p className="text-xs text-[var(--color-term-muted)]">
                Install Securithm in your project with a single command.
                The CLI scans your contracts and integrates with your CI/CD pipeline.
              </p>
            </div>
            <InstallCommand />
          </div>
        </section>
      </ScaleInSection>

      {/* ── PERSONAS ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
                TARGET USERS
              </h2>
              <p className="text-xs text-[var(--color-term-muted)]">
                From solo developers shipping their first token to institutions
                evaluating counterparty risk.
              </p>
            </div>
          </FadeInSection>

          <StaggerGrid className="grid md:grid-cols-3 gap-4" staggerAmount={0.1}>
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
          </StaggerGrid>
        </div>
      </section>

      {/* ── GITHUB INTEGRATION ── */}
      <FadeInSection>
        <section className="py-16 border-t border-[var(--color-term-border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center border border-[var(--color-term-border)] mb-4">
                <Github className="h-5 w-5 text-[var(--color-term-fg)]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
                GITHUB INTEGRATION
              </h2>
              <p className="text-xs text-[var(--color-term-muted)] mb-6 max-w-xl mx-auto">
                Install the Securithm GitHub Action. It automatically scans every PR
                and push, posts inline comments, and fails CI above your configured
                severity threshold.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://github.com/marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                  INSTALL APP
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="/docs"
                  className="inline-flex items-center gap-2 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:border-[var(--color-term-fg)] px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  READ DOCS
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── CTA ── */}
      <AsciiCta />

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
              <a href="/terms" className="hover:text-[var(--color-term-fg)]">TERMS</a>
              <a href="/privacy" className="hover:text-[var(--color-term-fg)]">PRIVACY</a>
              <a href="/soc2" className="hover:text-[var(--color-term-fg)]">SOC 2</a>
              <a href="/status" className="hover:text-[var(--color-term-fg)]">STATUS</a>
              <a href="/docs" className="hover:text-[var(--color-term-fg)]">DOCS</a>
              <span className="text-[var(--color-term-muted)]">&copy; 2026 SECURITHM</span>
            </div>
          </div>
          <p className="text-center text-[9px] text-[var(--color-term-muted)] mt-4 max-w-2xl mx-auto font-mono">
            DISCLAIMER: AI analysis provides preliminary findings and is not a
            substitute for a full manual audit. Always engage a professional
            security firm for production deployments.
          </p>
        </div>
      </footer>
    </div>
  );
}
