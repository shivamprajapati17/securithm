"use client";

import { Navbar } from "@/components/navbar";
import { ScanInput } from "@/components/scan-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Shield,
  Zap,
  GitBranch,
  Bell,
  FileText,
  BarChart3,
  CheckCircle2,
  Github,
  BookOpen,
  Terminal,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  Lock,
  ExternalLink,
} from "lucide-react";

const stats = [
  { label: "Contracts Analyzed", value: "10,000+" },
  { label: "Bugs Caught Pre-Deploy", value: "500+" },
  { label: "Developer Signups", value: "2,000+" },
  { label: "Chains Supported", value: "6" },
];

const features = [
  {
    icon: Zap,
    title: "Instant Analysis",
    description:
      "AI-powered static, symbolic, and reasoning analysis returns results in under 30 seconds for contracts under 1,000 lines.",
  },
  {
    icon: GitBranch,
    title: "CI/CD Integration",
    description:
      "GitHub Action runs on every push and PR. Inline comments, severity gating, and SARIF reports in your Security tab.",
  },
  {
    icon: Bell,
    title: "Continuous Monitoring",
    description:
      "Watch deployed contracts for anomalous on-chain activity — large outflows, unknown callers, TVL drops — in real time.",
  },
  {
    icon: FileText,
    title: "Fix Suggestions",
    description:
      "AI-generated secure code replacements with plain-English explanations. Apply all fixes with one click.",
  },
  {
    icon: BarChart3,
    title: "Risk Score API",
    description:
      "Public risk scoring for any contract address. Used by exchanges for listing diligence and funds for portfolio risk.",
  },
  {
    icon: Shield,
    title: "Remediation Workflow",
    description:
      "Assign findings, set SLA deadlines, track resolution. Export a Security Posture Report as PDF for auditors.",
  },
];

const chains = [
  { name: "Ethereum", color: "bg-blue-500" },
  { name: "Base", color: "bg-blue-600" },
  { name: "Arbitrum", color: "bg-blue-400" },
  { name: "Polygon", color: "bg-purple-500" },
  { name: "BSC", color: "bg-yellow-500" },
  { name: "Solana", color: "bg-gradient-to-r from-purple-500 to-green-500" },
];

const personas = [
  {
    icon: Terminal,
    title: "Solo Developer",
    description:
      "Free tier, instant feedback, plain-English fix guidance.",
    badge: "Free",
  },
  {
    icon: Users,
    title: "Protocol Team",
    description:
      "CI/CD gating, team seats, continuous monitoring, audit trail.",
    badge: "Pro",
  },
  {
    icon: Building2,
    title: "Institution",
    description:
      "Risk Score API, portfolio dashboard, SOC 2 compliance, SLA.",
    badge: "Enterprise",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/50 mb-6">
              <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                🚀 Now in Public Beta
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance mb-6">
              Ship secure contracts.{" "}
              <span className="text-brand-600 dark:text-brand-400">
                Before the hackers find the bugs.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto text-balance">
              Instant AI-powered smart contract security analysis. Paste your
              code, a deployed address, or connect your repo — get severity-tagged
              findings, fix suggestions, and a Risk Score in seconds.
            </p>
          </div>

          {/* Scan Input */}
          <div className="max-w-3xl mx-auto mb-8">
            <ScanInput variant="hero" />
          </div>

          {/* No signup badge */}
          <div className="text-center">
            <Badge variant="secondary" className="gap-1.5">
              <Lock className="h-3 w-3" />
              No signup required for basic scan
            </Badge>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50">
                  {stat.value}
                </div>
                <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Chains */}
      <section className="py-12 border-b border-surface-200 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-surface-500 dark:text-surface-400 mb-6">
            Supported Chains at Launch
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {chains.map((chain) => (
              <div
                key={chain.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
              >
                <div className={`h-2.5 w-2.5 rounded-full ${chain.color}`} />
                <span className="text-sm font-medium">{chain.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="text-brand-600 dark:text-brand-400">
                ship with confidence
              </span>
            </h2>
            <p className="text-surface-600 dark:text-surface-400">
              From instant pre-deploy checks to continuous post-deploy
              monitoring — AuditAI covers the full security lifecycle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:shadow-md hover:border-brand-500/50 transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-20 bg-surface-50 dark:bg-surface-900/50 border-y border-surface-200 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for every{" "}
              <span className="text-brand-600 dark:text-brand-400">
                security need
              </span>
            </h2>
            <p className="text-surface-600 dark:text-surface-400">
              From solo developers shipping their first token to institutions
              evaluating counterparty risk.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <div
                key={persona.title}
                className="p-6 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300">
                    <persona.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{persona.title}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {persona.badge}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {persona.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Integration Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 mb-6">
              <Github className="h-6 w-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Seamless GitHub integration
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-xl mx-auto">
              Install the AuditAI GitHub Action. It automatically scans every PR
              and push, posts inline comments, and fails CI above your configured
              severity threshold.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gap-2">
                <Github className="h-4 w-4" />
                Install GitHub App
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Read the Docs
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-600 dark:bg-brand-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start securing your contracts
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-xl mx-auto">
            No credit card required. Free tier includes 50 scans/month and basic
            monitoring.
          </p>
          <Button
            size="xl"
            variant="secondary"
            className="bg-white text-brand-700 hover:bg-brand-50"
          >
            Scan Your First Contract
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 dark:border-surface-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-sm">AuditAI</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-surface-500">
              <a href="#" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                SOC 2
              </a>
              <a href="#" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                Status
              </a>
              <span>© 2026 AuditAI. All rights reserved.</span>
            </div>
          </div>
          <p className="text-center text-xs text-surface-400 mt-6 max-w-2xl mx-auto">
            AI analysis provides preliminary findings and is not a substitute for a
            full manual audit. Always engage a professional security firm for
            production deployments.
          </p>
        </div>
      </footer>
    </div>
  );
}
