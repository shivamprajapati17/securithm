"use client";

import { Navbar } from "@/components/navbar";
import { FadeInSection, StaggerGrid } from "@/components/scroll-animations";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Zap,
  GitBranch,
  Bell,
  FileText,
  BarChart3,
  Lock,
  Terminal,
  Users,
  Building2,
} from "lucide-react";

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

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM FEATURES
            </span>
            <span className="ml-auto text-[9px] text-[var(--color-term-muted)] font-mono">
              [ v0.1.0 ]
            </span>
          </div>
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-lg font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-2">
                FEATURES
              </h1>
              <p className="text-xs text-[var(--color-term-muted)] font-mono max-w-2xl">
                From instant pre-deploy checks to continuous post-deploy
                monitoring. Securithm covers the full security lifecycle.
              </p>
            </div>

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
        </div>

        {/* Personas */}
        <FadeInSection>
          <div className="border border-[var(--color-term-border)] mb-8">
            <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-term-fg)]" />
              <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
                TARGET USERS
              </span>
            </div>
            <div className="p-6">
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
          </div>
        </FadeInSection>

        {/* Book demo CTA */}
        <FadeInSection>
          <div className="border border-[var(--color-term-border)] p-6 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center border border-[var(--color-term-border)] mb-4">
              <Lock className="h-5 w-5 text-[var(--color-term-fg)]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-3 text-[var(--color-term-fg)] term-glow uppercase tracking-wider">
              WANT TO SEE IT IN ACTION?
            </h2>
            <p className="text-xs text-[var(--color-term-muted)] mb-6 max-w-xl mx-auto font-mono">
              Book a live demo and our team will walk you through scans,
              monitoring, and the risk score API.
            </p>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-2 border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-6 py-3 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              BOOK DEMO
            </a>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
