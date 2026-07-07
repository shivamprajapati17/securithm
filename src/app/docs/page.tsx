"use client";

import { Navbar } from "@/components/navbar";
import { BookOpen, Shield, Terminal, GitBranch, Zap, Bell, FileText, BarChart3, Search, ExternalLink, ChevronRight } from "lucide-react";

const docSections = [
  {
    icon: Terminal,
    title: "QUICK START",
    description: "Get started with Securithm in minutes. Scan your first contract.",
    items: [
      "Install the CLI: npm install securithm -g",
      "Scan a contract: securithm scan ./contract.sol",
      "View results in the dashboard",
      "Set up CI/CD integration",
    ],
  },
  {
    icon: Search,
    title: "SCAN TYPES",
    description: "Different ways to analyze your smart contracts.",
    items: [
      "Static Analysis: Pattern matching and vulnerability detection",
      "Symbolic Execution: Deep path analysis for complex bugs",
      "Risk Scoring: Overall risk assessment with grade A-F",
      "Continuous Monitoring: Real-time on-chain surveillance",
    ],
  },
  {
    icon: GitBranch,
    title: "CI/CD INTEGRATION",
    description: "Automate security scanning in your pipeline.",
    items: [
      "GitHub Action: Runs on every push and PR",
      "GitLab CI: Custom job template available",
      "Inline Comments: Findings posted on PR diffs",
      "Severity Gating: Block merges above threshold",
    ],
  },
  {
    icon: Zap,
    title: "API REFERENCE",
    description: "Programmatic access to all Securithm features.",
    items: [
      "POST /api/v1/scans — Submit new contract for analysis",
      "GET /api/v1/scans/{id} — Retrieve scan results",
      "GET /api/v1/risk-score/{chain}/{address} — Get risk score",
      "GET /api/v1/risk-score/{chain}/{address}/history — Historical data",
    ],
  },
  {
    icon: Bell,
    title: "MONITORING",
    description: "Watch your deployed contracts in real time.",
    items: [
      "Add contracts to monitoring dashboard",
      "Configure alert thresholds by severity",
      "Webhook delivery for critical alerts",
      "Slack, Discord, and PagerDuty integrations",
    ],
  },
  {
    icon: Shield,
    title: "SECURITY",
    description: "Trust and compliance information.",
    items: [
      "SOC 2 Type II certification (in progress)",
      "Data encryption at rest and in transit",
      "Role-based access control (RBAC)",
      "Audit logging with 1-year retention",
    ],
  },
  {
    icon: BarChart3,
    title: "RISK SCORING",
    description: "Understand how Securithm evaluates contract risk.",
    items: [
      "Grade A (0-20): Low risk, no critical findings",
      "Grade B (21-40): Moderate risk, minor issues",
      "Grade C (41-60): Elevated risk, needs attention",
      "Grade D-F (61+): High risk, immediate action required",
    ],
  },
  {
    icon: FileText,
    title: "REMEDIATION",
    description: "Fix findings and track resolution progress.",
    items: [
      "AI-generated fix suggestions with explanations",
      "One-click apply for verified fixes",
      "Assign findings to team members",
      "Export security posture reports as PDF",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM DOCUMENTATION
            </span>
            <span className="ml-auto text-[9px] text-[var(--color-term-muted)] font-mono">
              v0.1.0
            </span>
          </div>
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-lg font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-2">
                DOCUMENTATION
              </h1>
              <p className="text-xs text-[var(--color-term-muted)] font-mono max-w-2xl">
                Comprehensive documentation for the Securithm smart contract security platform.
                Browse sections below or jump directly to API endpoints.
              </p>
            </div>

            {/* Quick install */}
            <div className="border border-[var(--color-term-border)] p-3 mb-8 bg-[var(--color-term-dim)]">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-[var(--color-term-fg)]" />
                <span className="text-[11px] font-bold text-[var(--color-term-fg)] uppercase tracking-wider">QUICK INSTALL</span>
              </div>
              <div className="space-y-1 text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-term-muted)] shrink-0">$</span>
                  <span className="text-[var(--color-term-fg)]">npm install securithm -g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-term-muted)] shrink-0">$</span>
                  <span className="text-[var(--color-term-fg)]">securithm scan ./contracts/VulnerableVault.sol --chain ethereum</span>
                </div>
              </div>
            </div>

            {/* Documentation sections grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {docSections.map((section) => (
                <div key={section.title} className="border border-[var(--color-term-border)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center border border-[var(--color-term-border)]">
                      <section.icon className="h-4 w-4 text-[var(--color-term-fg)]" />
                    </div>
                    <h2 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-[10px] text-[var(--color-term-muted)] font-mono mb-3">
                    {section.description}
                  </p>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[10px] text-[var(--color-term-muted)] font-mono">
                        <ChevronRight className="h-2.5 w-2.5 text-[var(--color-term-fg)] shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer links */}
            <div className="border-t border-[var(--color-term-border)] pt-4 mt-8 flex flex-wrap gap-4">
              <a href="/soc2" className="text-[10px] text-[var(--color-term-muted)] font-mono hover:text-[var(--color-term-fg)] flex items-center gap-1">
                <Shield className="h-3 w-3" />
                SECURITY
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <a href="/status" className="text-[10px] text-[var(--color-term-muted)] font-mono hover:text-[var(--color-term-fg)] flex items-center gap-1">
                SYSTEM STATUS
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <a href="https://github.com/shivamprajapati17/securithm" className="text-[10px] text-[var(--color-term-muted)] font-mono hover:text-[var(--color-term-fg)] flex items-center gap-1">
                GITHUB REPO
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
