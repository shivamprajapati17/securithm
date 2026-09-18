"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Minus,
  Shield,
  ScanLine,
  Wrench,
  Radar,
  Gauge,
} from "lucide-react";
import {
  Preloader,
  CustomCursor,
  AuraCanvas,
  ScrollProgress,
  useLandingMotion,
  LandingBehaviors,
} from "@/components/landing-effects";
import { useReducedMotion } from "@/components/scroll-animations";
import { ScanInput } from "@/components/scan-input";

const HERO_VIDEO =
  "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/generated-videos/2e815afb-cac1-4c01-90e1-cf3810246e35/1788781992660-34271847-4aac-4437-9a3d-dc9700a9681f.mp4";

const MARQUEE_ITEMS = [
  "Static analysis",
  "Symbolic execution",
  "AI reasoning",
  "Continuous monitoring",
  "Risk scoring",
  "Fix suggestions",
  "CI/CD gating",
  "6 chains supported",
];

const FEATURES = [
  {
    icon: ScanLine,
    img: "/fw/feat-1.jpg",
    cursor: "Scan",
    title: "Instant analysis",
    desc: "Paste code or a deployed address. Multi-engine analysis returns severity-tagged findings in under 30 seconds.",
  },
  {
    icon: Wrench,
    img: "/fw/feat-2.jpg",
    cursor: "Fix",
    title: "AI fix suggestions",
    desc: "Generated secure replacements with plain-English reasoning — apply every fix with one click.",
    offset: "lg:translate-y-8",
  },
  {
    icon: Radar,
    img: "/fw/feat-3.jpg",
    cursor: "Watch",
    title: "Continuous monitor",
    desc: "Deployed contracts watched 24/7 for anomalous outflows, unknown callers and TVL drops.",
  },
  {
    icon: Gauge,
    img: "/fw/feat-4.jpg",
    cursor: "Score",
    title: "Risk Score API",
    desc: "A–F risk grades for any contract address — used by exchanges for listing diligence.",
    offset: "lg:translate-y-16",
  },
];

const FAQS = [
  {
    q: "What exactly does AuditAI scan?",
    a: "Anything written in Solidity, Vyper or Rust/Anchor — a pasted file, a GitHub repo, or a live deployed address. Static rules, a Z3 symbolic solver and a security-tuned LLM cross-check every finding before it reaches you.",
  },
  {
    q: "Do I need an account to run a scan?",
    a: "No. The basic scan is free and requires no signup. Creating an account unlocks fix suggestions, CI/CD integration, team seats and continuous monitoring.",
  },
  {
    q: "Which chains are supported?",
    a: "Ethereum, Base, Arbitrum, Polygon, BSC and Solana — for both pre-deploy scanning and post-deploy monitoring.",
  },
  {
    q: "How does the Risk Score API work?",
    a: "Send any contract address and receive an A–F grade with contributing factors: exploit probability, liquidity risk, governance centralization and upgradeability. One API key, no instrumentation required.",
  },
  {
    q: "Can it gate my CI/CD pipeline?",
    a: "Yes. The GitHub Action scans every push and pull request, posts inline comments on findings, and fails the build above your configured severity threshold with SARIF reports in the Security tab.",
  },
];

function SplitWords({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="fw-mask mr-[0.28em] last:mr-0">
          <span>{w}</span>
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const reduced = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLandingMotion(reduced);

  // Remove the CRT scanline overlay on the landing page
  useEffect(() => {
    document.body.classList.add("no-scanlines");
    return () => document.body.classList.remove("no-scanlines");
  }, []);

  const toggleFaq = (i: number) => {
    const content = faqRefs.current[i];
    if (!content) return;
    if (openFaq === i) {
      setOpenFaq(null);
      if (reduced) content.style.height = "0px";
      else gsap.to(content, { height: 0, duration: 0.45, ease: "power3.inOut" });
    } else {
      setOpenFaq(i);
      if (reduced) content.style.height = "auto";
      else
        gsap.to(content, {
          height: "auto",
          duration: 0.55,
          ease: "power3.inOut",
        });
    }
  };

  return (
    <div className="fw-root relative min-h-screen">
      <Preloader />
      <CustomCursor />
      <AuraCanvas />
      <div className="fw-grain" aria-hidden />
      <ScrollProgress />
      <LandingBehaviors reduced={reduced} />

      {/* ── HEADER ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#140a05]/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#ffb366] text-[#1a0c05]">
              <Shield className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="text-sm font-semibold tracking-[0.18em] text-white">
              AUDITAI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {[
              ["Solutions", "/features"],
              ["Whitepaper", "/whitepaper"],
              ["Solvency", "/solvency"],
              ["Docs", "/docs"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-xs font-medium text-white/60 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden text-xs font-medium text-white/60 transition-colors hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/book-demo"
              className="magnetic inline-flex items-center gap-1.5 rounded-sm bg-[#ffb366] px-4 py-2 text-xs font-semibold text-[#1a0c05] transition-colors hover:bg-[#ffc68f]"
            >
              Book a demo
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── SECTION 1 · HERO ── */}
        <section className="relative px-4 pt-36 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="fw-mono mb-6 text-[11px] uppercase tracking-[0.35em] text-white/50">
              AI-powered smart contract security
            </p>
            <h1
              data-hero-split
              className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              <SplitWords text="Your intelligent" />{"\u00A0"}
              <SplitWords
                text="smart contract auditor"
                className="text-[#ffb366]"
              />
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-sm leading-relaxed text-white/60 sm:text-base">
              Paste your code, a deployed address, or connect your repo. Get
              severity-tagged findings, AI fix suggestions and a risk score —
              before the hackers find the bugs.
            </p>

            {/* Stat readouts */}
            <div className="fw-mono mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-widest text-white/50">
              <span>
                <span className="text-[#ffb366]">$3.8B</span> lost to exploits
              </span>
              <span>
                <span className="text-[#ffb366]">&lt;30s</span> per scan
              </span>
              <span>
                <span className="text-[#ffb366]">98.2%</span> precision
              </span>
              <span>
                <span className="text-[#ffb366]">6</span> chains
              </span>
            </div>

            {/* Working scan input */}
            <div className="mx-auto mt-10 max-w-2xl [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-white/40 [&_button]:bg-[#ffb366] [&_button]:text-[#1a0c05] [&_button]:hover:bg-[#ffc68f] [&_*]:border-white/15 [&_*]:font-manrope">
              <ScanInput variant="hero" redirectToDemo />
            </div>
            <p className="fw-mono mt-4 text-[10px] uppercase tracking-widest text-white/40">
              No signup required for basic scan
            </p>
          </div>

          {/* Viewfinder mock */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="fw-focus-frame relative overflow-hidden rounded-lg border border-white/10">
              <video
                data-loop-in-view
                className="aspect-video w-full object-cover"
                poster="/fw/hero-poster.jpg"
                src={HERO_VIDEO}
                muted
                playsInline
                preload="metadata"
                loop
              />
              {/* Viewfinder overlay chrome */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-[#ffb366]/80" />
                <div className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-[#ffb366]/80" />
                <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-[#ffb366]/80" />
                <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-[#ffb366]/80" />
                <div className="fw-mono absolute left-1/2 top-5 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/70">
                  REC · LIVE SCAN
                </div>
              </div>
            </div>

            {/* Floating guidance card */}
            <div className="fw-float absolute -bottom-6 left-4 hidden rounded-md border border-white/10 bg-[#1d1006]/90 p-4 shadow-2xl backdrop-blur-md sm:block lg:left-10">
              <p className="fw-mono text-[10px] uppercase tracking-widest text-white/50">
                Guidance
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white">
                Reentrancy found in{" "}
                <span className="fw-mono text-[#ffb366]">withdraw()</span>
              </p>
              <p className="mt-1 text-[11px] text-white/60">
                Fix suggestion ready · severity: high
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 · MARQUEE ── */}
        <section className="relative z-10 mt-24 overflow-hidden border-y border-white/5 py-5">
          <div className="fw-marquee-track">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${half}-${item}`}
                    className="fw-mono flex items-center whitespace-nowrap text-sm uppercase tracking-[0.25em] text-white/50"
                  >
                    <span className="px-6">{item}</span>
                    <span className="text-[#ffb366]">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3 · SOLUTIONS (bento) ── */}
        <section id="solutions" className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="fw-mono mb-4 text-[11px] uppercase tracking-[0.35em] text-[#ffb366]">
              Solutions
            </p>
            <h2
              data-split
              className="max-w-2xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl"
            >
              <SplitWords text="One engine for the" />{" "}
              <SplitWords text="full security lifecycle" />
            </h2>

            {/* Top row — 1.65fr / 0.75fr */}
            <div className="mt-12 grid gap-4 lg:grid-cols-[1.65fr_0.75fr]">
              <div className="fw-tilt group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                <div className="grid h-full lg:grid-cols-[1.35fr_0.65fr]">
                  <div className="flex flex-col justify-between p-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Multi-engine analysis
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
                        500+ static rules, a Z3 symbolic solver and a
                        security-tuned LLM cross-check every finding — so you
                        see real vulnerabilities, not noise.
                      </p>
                    </div>
                    <Link
                      href="/features"
                      data-cursor="Explore"
                      className="fw-mono mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#ffb366]"
                    >
                      Explore the engines
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="fw-img-hover relative min-h-56 overflow-hidden">
                    <img
                      src="/fw/feat-1.jpg"
                      alt="Analysis engines"
                      className="fw-parallax absolute inset-0 h-[114%] w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="fw-tilt flex flex-col justify-between rounded-lg border border-white/10 bg-white/[0.02] p-8">
                <div>
                  <p className="fw-mono text-[10px] uppercase tracking-widest text-white/50">
                    Live readout
                  </p>
                  <div className="fw-mono mt-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-white/50">STATIC RULES</span>
                      <span className="text-[#ffb366]">500+</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-white/50">SYMBOLIC SOLVER</span>
                      <span className="text-[#ffb366]">Z3</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-white/50">SCAN TIME</span>
                      <span className="text-[#ffb366]">&lt;30S</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">PRECISION</span>
                      <span className="text-[#ffb366]">98.2%</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/dashboard/api-console"
                  data-cursor="Explore"
                  className="fw-mono mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#ffb366]"
                >
                  Risk Score API
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Second row */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="fw-tilt relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] p-8">
                <h3 className="text-lg font-semibold text-white">
                  CI/CD gating
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
                  A GitHub Action on every push and PR. Inline comments,
                  severity thresholds that fail the build, SARIF reports in
                  your Security tab.
                </p>
                <div className="fw-mono mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-white/50">
                  {["GitHub Action", "SARIF", "Inline comments", "Severity gates"].map(
                    (t) => (
                      <span
                        key={t}
                        className="rounded-sm border border-white/10 px-2.5 py-1"
                      >
                        {t}
                      </span>
                    ),
                  )}
                </div>
              </div>
              <div className="fw-tilt relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] p-8">
                <h3 className="text-lg font-semibold text-white">
                  Continuous monitoring
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
                  Deployed contracts watched around the clock — large outflows,
                  unknown callers and TVL drops trigger alerts in seconds.
                </p>
                <div className="fw-mono mt-6 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ffb366]" />
                  <span className="text-white/60">
                    Watching · Lending Pool · USDC Vault
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4 · FEATURES (toolkit) ── */}
        <section className="relative px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="fw-mono mb-4 text-[11px] uppercase tracking-[0.35em] text-[#ffb366]">
                  The toolkit
                </p>
                <h2
                  data-split
                  className="max-w-xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl"
                >
                  <SplitWords text="Everything between" />{" "}
                  <SplitWords text="code and mainnet" />
                </h2>
              </div>
              <Link
                href="/features"
                className="fw-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:text-[#ffb366]"
              >
                All capabilities
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <Link
                  key={f.title}
                  href="/features"
                  data-cursor={f.cursor}
                  className={`fw-img-hover group relative block overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] transition-colors hover:border-[#ffb366]/40 ${f.offset ?? ""}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={f.img}
                      alt={f.title}
                      className="fw-parallax absolute inset-0 h-[114%] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140a05] via-transparent to-transparent" />
                  </div>
                  <div className="p-5">
                    <f.icon className="h-4 w-4 text-[#ffb366]" />
                    <h3 className="mt-3 text-sm font-semibold text-white">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60">
                      {f.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORKFLOW STRIP ── */}
        <section className="relative px-4 py-12 sm:px-6 lg:px-8">
          <div className="fw-mono mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-widest text-white/40">
            {[
              "Input",
              "Parse",
              "Static",
              "Symbolic",
              "AI engine",
              "Aggregate",
              "Report",
              "Monitor",
            ].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-3">
                <span>{step}</span>
                {i < arr.length - 1 && <span className="text-[#ffb366]">→</span>}
              </span>
            ))}
          </div>
        </section>

        {/* ── SECTION 5 · FAQ ── */}
        <section className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="fw-mono mb-4 text-center text-[11px] uppercase tracking-[0.35em] text-[#ffb366]">
              FAQ
            </p>
            <h2
              data-split
              className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              <SplitWords text="Questions, answered" />
            </h2>

            <div className="mt-12 divide-y divide-white/5 border-y border-white/5">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-center justify-between gap-6 py-5 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-sm font-medium text-white sm:text-base">
                        {faq.q}
                      </span>
                      <span className="shrink-0 text-[#ffb366]">
                        {open ? (
                          <Minus className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </span>
                    </button>
                    <div
                      ref={(el) => {
                        faqRefs.current[i] = el;
                      }}
                      className="fw-faq-content"
                      style={{ height: open && reduced ? "auto" : undefined }}
                    >
                      <p className="pb-6 pr-10 text-sm leading-relaxed text-white/60">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2
            data-split
            className="mx-auto max-w-2xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl"
          >
            <SplitWords text="Ship secure contracts." />
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm text-white/60">
            Run your first scan free — no credit card, no signup. Upgrade when
            your contracts go live.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="magnetic inline-flex items-center gap-2 rounded-sm bg-[#ffb366] px-7 py-3.5 text-sm font-semibold text-[#1a0c05] transition-colors hover:bg-[#ffc68f]"
            >
              Start scanning free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/whitepaper"
              className="magnetic inline-flex items-center gap-2 rounded-sm border border-white/15 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:border-[#ffb366]/60 hover:text-[#ffb366]"
            >
              Read the whitepaper
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER (all pages un-hidden) ── */}
      <footer className="relative z-10 border-t border-white/5 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#ffb366] text-[#1a0c05]">
                <Shield className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <span className="text-sm font-semibold tracking-[0.18em] text-white">
                AUDITAI
              </span>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/50">
              AI-powered smart contract security analysis. Find bugs before
              they find your users.
            </p>
          </div>
          {[
            {
              head: "Product",
              links: [
                ["Features", "/features"],
                ["Whitepaper", "/whitepaper"],
                ["Solvency proof", "/solvency"],
                ["Docs", "/docs"],
              ],
            },
            {
              head: "App",
              links: [
                ["Log in", "/auth/login"],
                ["Register", "/auth/register"],
                ["Book a demo", "/book-demo"],
                ["Dashboard", "/dashboard"],
              ],
            },
            {
              head: "Trust",
              links: [
                ["SOC 2", "/soc2"],
                ["Terms", "/terms"],
                ["Privacy", "/privacy"],
              ],
            },
          ].map((col) => (
            <div key={col.head}>
              <p className="fw-mono text-[10px] uppercase tracking-widest text-white/40">
                {col.head}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-white/60 transition-colors hover:text-[#ffb366]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="fw-mono mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-white/5 pt-6 text-[10px] uppercase tracking-widest text-white/40">
          <span>© 2026 AuditAI</span>
          <span>All contracts monitored · All frames secured</span>
        </div>
      </footer>
    </div>
  );
}
