"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { PiIcon } from "@/components/pi-icon";
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
        router.push(`/auth/login?redirect=${encodeURIComponent(`/pricing?plan=${planId}`)}`);
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
              theme: { color: "#3d065f" },
              handler: (response: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
              }) => {
                verifyPayment({
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  plan_id: planId,
                })
                  .then((v) => {
                    if (v.api_key?.full_key) setApiKey(v.api_key.full_key);
                    resolve();
                  })
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
      cta: "Generate API Key",
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
    <div className="mm-root min-h-screen text-[var(--color-ink-black)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6">
        {fromCli && !apiKey && (
          <div className="mb-8 flex items-start gap-3 rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-pure-white)] p-5">
            <PiIcon name="terminal-window" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-deep-violet)]" />
            <div>
              <div className="mm-label mm-label--violet">CLI SETUP — GENERATE AN API KEY</div>
              <p className="mt-2 text-[14px] leading-[1.55] text-[var(--color-slate)]">
                Your CLI has used its 5 free scans. Pick a plan below, then
                generate an API key and run{" "}
                <code className="rounded bg-[var(--color-cool-mist)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--color-deep-violet)]">
                  securithm login
                </code>{" "}
                to paste it. After that, unlimited scans from the terminal.
              </p>
            </div>
          </div>
        )}

        {isLimitReached && (
          <div className="mb-8 flex items-start gap-3 rounded-[12px] bg-[var(--color-apricot)] p-5">
            <PiIcon name="warning-circle" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-burnt-sienna)]" />
            <div>
              <div className="mm-label mm-label--violet">FREE SCAN LIMIT REACHED — 5/5 USED</div>
              <p className="mt-2 text-[14px] leading-[1.55] text-[var(--color-ink-black)]">
                You have used all 5 free contract scans. Pick a plan below — the
                API key you generate unlocks unlimited scans on the website and
                the CLI.
              </p>
            </div>
          </div>
        )}

        {phase === "done" && apiKey && (
          <div className="mb-8 rounded-[12px] bg-[var(--color-lime-wash)] p-5">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[var(--color-ink-black)]">
              <PiIcon name="sparkle" size={18} className="text-[var(--color-deep-violet)]" />
              Plan active{activePlanId ? ` (${activePlanId.toUpperCase()})` : ""}. Your API key is ready:
            </div>
            <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row">
              <code className="flex-1 select-all break-all rounded-[8px] border border-[var(--color-hairline)] bg-[var(--color-pure-white)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink-black)]">
                {apiKey}
              </code>
              <button
                onClick={copyKey}
                className="mm-cta !rounded-[9999px] !px-5 !py-2.5 !text-[13px]"
              >
                <PiIcon name="copy" size={14} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="mt-4 space-y-1.5 text-[13px] text-[var(--color-slate)]">
              <div>
                <span className="font-bold text-[var(--color-deep-violet)]">CLI:</span>{" "}
                run{" "}
                <code className="rounded bg-[var(--color-pure-white)] px-1.5 py-0.5 font-mono text-[12px]">
                  securithm login
                </code>{" "}
                and paste this key — unlimited scans from the terminal.
              </div>
              <div className="flex gap-4 pt-1">
                <Link href="/dashboard/scans" className="mm-link">
                  Start scanning →
                </Link>
                <Link href="/dashboard/api-console" className="mm-link">
                  Manage keys →
                </Link>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-[12px] bg-[var(--color-lilac-haze)] p-5 text-[14px] text-[var(--color-ink-black)]">
            <PiIcon name="warning-circle" size={16} className="mt-0.5 shrink-0 text-[var(--color-deep-violet)]" />
            <span>
              {error}{" "}
              {!loggedIn && (
                <Link href="/auth/register" className="mm-link">
                  Create an account →
                </Link>
              )}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mm-brackets mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] bg-[var(--color-pure-white)] px-4 py-2">
            <PiIcon name="lightning" size={14} className="text-[var(--color-deep-violet)]" />
            <span className="mm-label mm-label--violet">SECURITHM PRICING & API ACCESS</span>
          </div>
          <h1 className="mm-display text-[clamp(44px,7vw,75px)]">
            Instant security
            <br />
            <span className="mm-serif text-[0.96em]">for every contract.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[50ch] text-[16px] leading-[1.55] text-[var(--color-slate)]">
            5 free scans, then pick a plan. Your API key unlocks unlimited
            scans on the website and the CLI.
            {scanLimit != null && scansUsed != null && (
              <span className="mt-2 block font-bold text-[var(--color-deep-violet)]">
                {Math.min(scansUsed, scanLimit)}/{scanLimit} free scans used
              </span>
            )}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-7 inline-flex items-center rounded-full border border-[var(--color-ink-black)] bg-[var(--color-pure-white)] p-1">
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors ${
                  billingCycle === cycle
                    ? "bg-[var(--color-ink-black)] text-[var(--color-pure-white)]"
                    : "text-[var(--color-slate)] hover:text-[var(--color-ink-black)]"
                }`}
              >
                {cycle === "monthly" ? "MONTHLY" : "YEARLY (SAVE 20%)"}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-[12px] border p-6 transition-transform duration-200 hover:-translate-y-1 ${
                plan.popular
                  ? "border-[var(--color-ink-black)] bg-[var(--color-lime-wash)]"
                  : "border-[var(--color-hairline)] bg-[var(--color-pure-white)]"
              }`}
            >
              {plan.popular && (
                <span className="mm-burst -top-3 right-8 h-6 w-16" aria-hidden />
              )}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="mm-label">{plan.name.toUpperCase()}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${
                      plan.popular
                        ? "bg-[var(--color-ink-black)] text-[var(--color-pure-white)]"
                        : "bg-[var(--color-cool-mist)] text-[var(--color-slate)]"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="mm-display text-[44px] leading-none">{plan.price}</span>
                  <span className="text-[13px] font-medium text-[var(--color-slate)]">{plan.period}</span>
                </div>
                <p className="mt-3 text-[13px] leading-[1.5] text-[var(--color-slate)]">
                  {plan.tagline}
                </p>

                <div className="mt-5 space-y-2.5 border-t border-[var(--color-hairline)] pt-5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px] leading-[1.5]">
                      <PiIcon name="check" size={14} className="mt-0.5 shrink-0 text-[var(--color-deep-violet)]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--color-hairline)] pt-5">
                <button
                  onClick={() => purchase(plan.id)}
                  disabled={busy}
                  className={`mm-cta w-full justify-center ${
                    plan.popular ? "" : "mm-cta--light"
                  } ${busy ? "opacity-60" : ""}`}
                >
                  {busy ? (
                    "PROCESSING..."
                  ) : (
                    <>
                      {plan.cta} <PiIcon name="key" size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* API Developer Section */}
        <div className="rounded-[12px] bg-[var(--color-pure-white)] p-6 md:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mm-label mm-label--violet mb-2 flex items-center gap-2">
              <PiIcon name="terminal-window" size={16} className="text-[var(--color-deep-violet)]" />
                NPM PACKAGE & SDK ACCESS
              </div>
              <h3 className="mm-display text-[30px] leading-tight">
                Integrate in 3 lines of code
              </h3>
              <p className="mt-2 max-w-xl text-[14px] leading-[1.55] text-[var(--color-slate)]">
                Open-source TypeScript/JavaScript SDK for automated pipeline
                audits, risk scores, and on-chain monitoring.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/docs" className="mm-cta mm-cta--light">
                Read API Docs
              </Link>
              <Link href="/dashboard/api-console" className="mm-cta">
                Generate API Key →
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--color-hairline)] pt-6 md:grid-cols-2">
            <div className="rounded-[8px] bg-[var(--color-cool-mist)] p-4 font-mono text-[13px]">
              <div className="mb-1 text-[var(--color-slate)]">// Install open-source SDK</div>
              <div className="font-bold text-[var(--color-deep-violet)]">npm install securithm</div>
            </div>
            <div className="rounded-[8px] bg-[var(--color-cool-mist)] p-4 font-mono text-[13px]">
              <div className="mb-1 text-[var(--color-slate)]">// CLI instant audit</div>
              <div className="font-bold text-[var(--color-deep-violet)]">npx securithm scan ./contracts/Vault.sol</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fff1eb] font-mono text-sm">
          Loading pricing...
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
