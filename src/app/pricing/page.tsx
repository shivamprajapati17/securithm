"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Copy,
  KeyRound,
} from "lucide-react";
import {
  createPaymentOrder,
  verifyPayment,
  generateApiKey,
  getPaymentPlan,
} from "@/lib/api";

export const dynamic = "force-dynamic";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Phase = "idle" | "working" | "checkout" | "done";

function PricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLimitReached = searchParams.get("paywall") === "limit_reached";
  const fromCli = searchParams.get("cli") === "1";
  const presetPlan = searchParams.get("plan");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [phase, setPhase] = useState<Phase>("idle");
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [scansUsed, setScansUsed] = useState<number | null>(null);
  const [scanLimit, setScanLimit] = useState<number | null>(null);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("securithm_token"));
    const planId = localStorage.getItem("securithm_plan_id");
    if (planId) setActivePlanId(planId);
    if (localStorage.getItem("securithm_token")) {
      getPaymentPlan()
        .then((plan) => {
          setScansUsed(plan.scan_count);
          setScanLimit(plan.scan_limit);
          if (plan.plan_id) setActivePlanId(plan.plan_id);
        })
        .catch(() => undefined);
    }
  }, []);

  const copyKey = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  /** Create the order and either auto-activate (₹0) or open Razorpay Checkout. */
  const purchase = useCallback(
    async (planId: "pro" | "enterprise" | "free") => {
      setError(null);
      if (!localStorage.getItem("securithm_token")) {
        router.push(`/login?redirect=${encodeURIComponent(`/pricing?plan=${planId}`)}`);
        return;
      }
      setPhase("working");
      try {
        const order = await createPaymentOrder({ plan_id: planId, billing_cycle: billingCycle });
        if (order.already_active) {
          setActivePlanId(order.plan_id);
        } else if (order.payment_required && order.checkout) {
          const loaded = await loadRazorpayScript();
          if (!loaded || !order.key_id) {
            throw new Error("Payment gateway unavailable — try again shortly.");
          }
          setPhase("checkout");
          await new Promise<void>((resolve, reject) => {
            const rzp = new window.Razorpay!({
              key: order.key_id,
              order_id: order.order_id,
              name: "Securithm",
              description: `${planId.toUpperCase()} plan (${billingCycle})`,
              theme: { color: "#00ff88" },
              handler: (response: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
              }) => {
                verifyPayment({
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                })
                  .then(() => resolve())
                  .catch(reject);
              },
              modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
            });
            rzp.open();
          });
          setActivePlanId(planId);
        } else {
          // amount === 0: the server activated the plan immediately.
          setActivePlanId(order.plan_id);
        }
        // Free path (₹0 launch pricing): the server activated the plan; the
        // verify endpoint generates the API key.
        if (!apiKey) {
          const verified = await verifyPayment({
            order_id: order.order_id,
            payment_id: "free_activation",
            signature: "free",
            plan_id: planId,
          });
          setApiKey(verified.api_key?.full_key ?? null);
        } else {
          const key = await generateApiKey({ name: `${planId} plan key` });
          setApiKey(key.full_key);
        }
        setPhase("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Purchase failed.");
        setPhase("idle");
      }
    },
    [billingCycle, router]
  );

  // Auto-start a preset plan flow (?plan=pro after login redirect).
  // Deps intentionally narrow: re-running on every `purchase` identity change
  // would re-trigger checkout after each phase transition.
  useEffect(() => {
    if (presetPlan && (presetPlan === "pro" || presetPlan === "enterprise") && loggedIn && phase === "idle" && !apiKey) {
      void purchase(presetPlan);
    }
  }, [presetPlan, loggedIn]);

  const plans: Array<{
    id: "free" | "pro" | "enterprise";
    name: string;
    tagline: string;
    price: string;
    period: string;
    badge: string;
    popular: boolean;
    features: string[];
    cta: string;
  }> = [
    {
      id: "free",
      name: "Developer Free",
      tagline: "For learning & testing individual contracts",
      price: "$0",
      period: "forever",
      badge: scansUsed != null && scanLimit != null && scansUsed >= scanLimit ? "Limit Reached" : "Current Tier",
      popular: false,
      features: [
        "5 Free Smart Contract Scans",
        "11 trained security agents",
        "Auto-fix patches & fixed contracts",
        "CLI access (npx securithm)",
        "Community support",
      ],
      cta: activePlanId === "free" ? "Generate API Key" : "Generate API Key",
    },
    {
      id: "pro",
      name: "Securithm Pro",
      tagline: "For professional Web3 developers and auditors",
      price: billingCycle === "monthly" ? "$49" : "$39",
      period: "/ month",
      badge: "Most Popular",
      popular: true,
      features: [
        "Unlimited smart contract scans",
        "Deep symbolic execution & AST analysis",
        "Automated patch & fix code generation",
        "Exportable PDF & Markdown audit reports",
        "GitHub Actions & CI/CD pipeline gating",
        "Standard API access (500 req/hour)",
      ],
      cta: activePlanId === "pro" ? "Manage Plan" : "Upgrade to Pro",
    },
    {
      id: "enterprise",
      name: "API & Enterprise",
      tagline: "For protocols, launchpads, and high-frequency audits",
      price: billingCycle === "monthly" ? "$249" : "$199",
      period: "/ month",
      badge: "High Throughput",
      popular: false,
      features: [
        "Everything in Pro tier",
        "Dedicated API key with 10,000 req/hour",
        "Real-time 24/7 on-chain monitoring & alarms",
        "Proof of Solvency & reserve attestation suite",
        "Custom webhook payloads & PagerDuty alerts",
        "Multi-user RBAC & team workspaces",
        "99.9% uptime SLA & priority engineer support",
      ],
      cta: activePlanId === "enterprise" ? "Manage Plan" : "Get Enterprise API Key",
    },
  ];

  const busy = phase === "working" || phase === "checkout";

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)] text-[var(--color-term-text)] flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        {fromCli && !apiKey && (
          <div className="mb-8 p-4 border border-[var(--color-term-accent)] bg-[var(--color-term-accent)]/10 text-[var(--color-term-accent)] flex items-start gap-3 rounded-none">
            <Terminal className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <div className="font-mono text-sm font-semibold tracking-wider">
                CLI SETUP: GENERATE AN API KEY
              </div>
              <p className="text-xs text-[var(--color-term-text-muted)] mt-1 font-mono">
                Your CLI has used its 5 free scans. Pick a plan below, then generate an API key and
                run <span className="text-[var(--color-term-accent)]">securithm login</span> to paste
                it. After that, unlimited scans from the terminal.
              </p>
            </div>
          </div>
        )}

        {isLimitReached && (
          <div className="mb-8 p-4 border border-[var(--color-term-warning)] bg-[var(--color-term-warning)]/10 text-[var(--color-term-warning)] flex items-start gap-3 rounded-none">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <div className="font-mono text-sm font-semibold tracking-wider">
                FREE SCAN LIMIT REACHED (5/5 SCANS USED)
              </div>
              <p className="text-xs text-[var(--color-term-text-muted)] mt-1 font-mono">
                You have used all 5 free contract scans. Pick a plan below — the API key you generate
                unlocks unlimited scans on the website and the CLI.
              </p>
            </div>
          </div>
        )}

        {phase === "done" && apiKey && (
          <div className="mb-8 p-4 border border-[var(--color-term-success)] bg-[var(--color-term-success)]/10 text-[var(--color-term-success)] rounded-none">
            <div className="flex items-center gap-2 font-mono text-sm">
              <Sparkles className="w-5 h-5 shrink-0" />
              Plan active{activePlanId ? ` (${activePlanId.toUpperCase()})` : ""}. Your API key is ready:
            </div>
            <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-2">
              <code className="flex-1 px-3 py-2 bg-[var(--color-term-bg)] border border-[var(--color-term-border)] font-mono text-xs text-[var(--color-term-text)] break-all select-all">
                {apiKey}
              </code>
              <Button
                onClick={copyKey}
                size="sm"
                className="bg-[var(--color-term-success)] text-black font-mono text-xs h-auto"
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="mt-3 font-mono text-xs text-[var(--color-term-text-muted)] space-y-1">
              <div>
                <span className="text-[var(--color-term-accent)]">CLI:</span> run{" "}
                <code className="text-[var(--color-term-success)]">securithm login</code> and paste
                this key — unlimited scans from the terminal.
              </div>
              <div className="flex gap-3 pt-1">
                <Link href="/dashboard/scans" className="text-[var(--color-term-success)] hover:underline">
                  Start scanning →
                </Link>
                <Link href="/dashboard/api-console" className="text-[var(--color-term-success)] hover:underline">
                  Manage keys →
                </Link>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 border border-[var(--color-term-warning)] bg-[var(--color-term-warning)]/10 text-[var(--color-term-warning)] font-mono text-xs rounded-none">
            {error}{" "}
            {!loggedIn && (
              <Link href="/register" className="underline">
                Create an account →
              </Link>
            )}
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
            5 free scans, then pick a plan. Your API key unlocks unlimited scans on the website and
            the CLI.
            {scanLimit != null && scansUsed != null && (
              <span className="block mt-1 text-[var(--color-term-accent)]">
                {Math.min(scansUsed, scanLimit)}/{scanLimit} free scans used
              </span>
            )}
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
              key={plan.id}
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
                  onClick={() => purchase(plan.id)}
                  disabled={busy}
                  className={`w-full font-mono text-xs tracking-wider uppercase h-10 ${
                    plan.popular
                      ? "bg-[var(--color-term-accent)] text-black hover:bg-[var(--color-term-accent)]/90"
                      : "bg-[var(--color-term-dim)] border border-[var(--color-term-border)] text-[var(--color-term-text)] hover:bg-[var(--color-term-border)]"
                  }`}
                >
                  {busy ? "PROCESSING..." : (
                    <span className="flex items-center justify-center gap-1.5">
                      {plan.cta}
                      <KeyRound className="w-3.5 h-3.5" />
                    </span>
                  )}
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
