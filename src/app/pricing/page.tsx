"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Check,
  Terminal,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

function PricingContent() {
  const searchParams = useSearchParams();
  const isLimitReached = searchParams.get("paywall") === "limit_reached";
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const [freeScansUsed, setFreeScansUsed] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const used = parseInt(localStorage.getItem("securithm_free_scans_used") || "0", 10);
      setFreeScansUsed(used);
    }
  }, []);

  const handlePurchase = (planName: string) => {
    setPurchasing(true);
    setTimeout(() => {
      setPurchasing(false);
      setPurchaseSuccess(planName);
      if (typeof window !== "undefined") {
        // Reset or boost scan limits upon upgrade
        localStorage.setItem("securithm_free_scans_used", "0");
      }
    }, 1200);
  };

  const plans = [
    {
      name: "Developer Free",
      tagline: "For learning & testing individual contracts",
      price: "$0",
      period: "forever",
      badge: "Current Tier",
      badgeVariant: "secondary" as const,
      features: [
        "2 Free Smart Contract Scans",
        "Deterministic vulnerability detection",
        "High / Critical finding flags",
        "Community Discord support",
        "Public knowledge base access",
      ],
      cta: freeScansUsed >= 2 ? "Limit Reached (2/2 Used)" : `Active (${freeScansUsed}/2 Used)`,
      disabled: true,
      popular: false,
    },
    {
      name: "Securithm Pro",
      tagline: "For professional Web3 developers and auditors",
      price: billingCycle === "monthly" ? "$49" : "$39",
      period: "/ month",
      badge: "Most Popular",
      badgeVariant: "default" as const,
      features: [
        "Unlimited smart contract scans",
        "Deep symbolic execution & AST analysis",
        "Automated patch & fix code generation",
        "Exportable PDF & Markdown audit reports",
        "GitHub Actions & CI/CD pipeline gating",
        "Standard API access (500 req/hour)",
      ],
      cta: "Upgrade to Pro",
      disabled: false,
      popular: true,
    },
    {
      name: "API & Enterprise",
      tagline: "For protocols, launchpads, and high-frequency audits",
      price: billingCycle === "monthly" ? "$249" : "$199",
      period: "/ month",
      badge: "High Throughput",
      badgeVariant: "outline" as const,
      features: [
        "Everything in Pro tier",
        "Dedicated API key with 10,000 req/hour",
        "Real-time 24/7 on-chain monitoring & alarms",
        "Proof of Solvency & reserve attestation suite",
        "Custom webhook payloads & PagerDuty alerts",
        "Multi-user RBAC & team workspaces",
        "99.9% uptime SLA & priority engineer support",
      ],
      cta: "Get Enterprise API Key",
      disabled: false,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)] text-[var(--color-term-text)] flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        {isLimitReached && (
          <div className="mb-8 p-4 border border-[var(--color-term-warning)] bg-[var(--color-term-warning)]/10 text-[var(--color-term-warning)] flex items-start gap-3 rounded-none">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <div className="font-mono text-sm font-semibold tracking-wider">
                FREE SCAN LIMIT REACHED (2/2 SCANS USED)
              </div>
              <p className="text-xs text-[var(--color-term-text-muted)] mt-1 font-mono">
                You have reached your 2 free contract scans. Purchase an API plan or Pro subscription below to continue auditing smart contracts without restrictions.
              </p>
            </div>
          </div>
        )}

        {purchaseSuccess && (
          <div className="mb-8 p-4 border border-[var(--color-term-success)] bg-[var(--color-term-success)]/10 text-[var(--color-term-success)] flex items-center justify-between rounded-none">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 shrink-0" />
              <div className="font-mono text-sm">
                Successfully unlocked <strong>{purchaseSuccess}</strong>! Your scan limits have been refreshed.
              </div>
            </div>
            <Link href="/dashboard/scans">
              <Button size="sm" className="bg-[var(--color-term-success)] text-black font-mono text-xs">
                Start Scanning →
              </Button>
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--color-term-border)] bg-[var(--color-term-dim)] text-[11px] font-mono text-[var(--color-term-accent)] mb-4">
            <Zap className="w-3.5 h-3.5" />
            SECURITHM PRICING & API ACCESS
          </div>
          <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight mb-4">
            Instant Security for Every Smart Contract
          </h1>
          <p className="text-sm font-mono text-[var(--color-term-text-muted)]">
            Scan unlimited contracts, automate CI/CD protection, and integrate enterprise-grade security APIs directly into your dApp.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-6 inline-flex items-center p-1 border border-[var(--color-term-border)] bg-[var(--color-term-dim)]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1 text-xs font-mono transition-colors ${
                billingCycle === "monthly"
                  ? "bg-[var(--color-term-accent)] text-black font-semibold"
                  : "text-[var(--color-term-text-muted)] hover:text-white"
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1 text-xs font-mono transition-colors ${
                billingCycle === "yearly"
                  ? "bg-[var(--color-term-accent)] text-black font-semibold"
                  : "text-[var(--color-term-text-muted)] hover:text-white"
              }`}
            >
              YEARLY (SAVE 20%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border flex flex-col justify-between ${
                plan.popular
                  ? "border-[var(--color-term-accent)] bg-[var(--color-term-accent)]/5 shadow-[0_0_20px_rgba(0,255,136,0.1)]"
                  : "border-[var(--color-term-border)] bg-[var(--color-term-dim)]/50"
              }`}
            >
              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-[var(--color-term-text-muted)] tracking-wider">
                      {plan.name.toUpperCase()}
                    </span>
                    {plan.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 border ${
                          plan.popular
                            ? "border-[var(--color-term-accent)] text-[var(--color-term-accent)] bg-[var(--color-term-accent)]/10"
                            : "border-[var(--color-term-border)] text-[var(--color-term-text-muted)]"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl md:text-4xl font-mono font-bold">{plan.price}</span>
                    <span className="text-xs font-mono text-[var(--color-term-text-muted)]">{plan.period}</span>
                  </div>
                  <CardDescription className="text-xs font-mono text-[var(--color-term-text-muted)] mt-2">
                    {plan.tagline}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="border-t border-[var(--color-term-border)] pt-4 space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-mono">
                        <Check className="w-3.5 h-3.5 text-[var(--color-term-accent)] mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-4 border-t border-[var(--color-term-border)]">
                <Button
                  onClick={() => handlePurchase(plan.name)}
                  disabled={plan.disabled || purchasing}
                  className={`w-full font-mono text-xs tracking-wider uppercase h-10 ${
                    plan.popular
                      ? "bg-[var(--color-term-accent)] text-black hover:bg-[var(--color-term-accent)]/90"
                      : "bg-[var(--color-term-dim)] border border-[var(--color-term-border)] text-[var(--color-term-text)] hover:bg-[var(--color-term-border)]"
                  }`}
                >
                  {purchasing ? "PROCESSING..." : plan.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* API Developer Section */}
        <div className="border border-[var(--color-term-border)] bg-[var(--color-term-dim)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-term-accent)] font-mono text-xs mb-2">
                <Terminal className="w-4 h-4" />
                NPM PACKAGE & SDK ACCESS
              </div>
              <h3 className="text-lg font-mono font-bold">
                Integrate Securithm in 3 lines of code
              </h3>
              <p className="text-xs font-mono text-[var(--color-term-text-muted)] mt-1 max-w-xl">
                Open-source TypeScript/JavaScript SDK for automated pipeline audits, risk scores, and on-chain monitoring.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/docs">
                <Button variant="outline" className="border-[var(--color-term-border)] font-mono text-xs">
                  Read API Docs
                </Button>
              </Link>
              <Link href="/dashboard/api-console">
                <Button className="bg-[var(--color-term-accent)] text-black font-mono text-xs">
                  Generate API Key →
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--color-term-border)] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-[var(--color-term-bg)] border border-[var(--color-term-border)] font-mono text-xs">
              <div className="text-[var(--color-term-text-muted)] mb-1">// Install open-source SDK</div>
              <div className="text-[var(--color-term-accent)]">npm install securithm</div>
            </div>
            <div className="p-3 bg-[var(--color-term-bg)] border border-[var(--color-term-border)] font-mono text-xs">
              <div className="text-[var(--color-term-text-muted)] mb-1">// CLI instant audit</div>
              <div className="text-[var(--color-term-accent)]">npx securithm scan ./contracts/Vault.sol</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center font-mono text-sm">Loading pricing...</div>}>
      <PricingContent />
    </Suspense>
  );
}
