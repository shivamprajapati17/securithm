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
  Terminal,
  Vault,
  Github,
  MessageCircle,
  X as XIcon,
  FileCheck,
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

const ECOSYSTEM = [
  {
    icon: ScanLine,
    title: "AuditAI Scan",
    desc: "Paste source, point at a repo, or target a deployed address. Multi-engine analysis returns severity-tagged findings and AI-generated fixes in seconds.",
    href: "/features",
    cta: "Start a scan",
  },
  {
    icon: Vault,
    title: "AuditAI Monitor",
    desc: "Continuous on-chain surveillance for deployed contracts — anomalous outflows, unknown callers and TVL drops alert your team in real time.",
    href: "/dashboard/monitoring",
    cta: "Watch contracts",
  },
  {
    icon: Terminal,
    title: "AuditAI Build",
    desc: "Risk Score API, GitHub Action CI gating and SARIF reports. Wire security into your pipeline with one API key and a single workflow file.",
    href: "/docs",
    cta: "Read the docs",
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
  gradient = false,
}: {
  text: string;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="fw-mask mr-[0.28em] last:mr-0">
          <span className={gradient ? "ax-gradient-text" : undefined}>{w}</span>
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const reduced = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const faqRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLandingMotion(reduced);

  // Nav glassmorphic state (> 50px per Axiom spec)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

      {/* ── NAV — transparent → glassmorphic after 50px ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "ax-glass-nav"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="ax-gradient flex h-8 w-8 items-center justify-center rounded-[8px]">
              <Shield className="h-4 w-4 text-white" strokeWidth={2.4} />
            </span>
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.14em] text-[var(--color-ax-text)]">
              AUDITAI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {[
              ["Ecosystem", "/features"],
              ["Whitepaper", "/whitepaper"],
              ["Solvency", "/solvency"],
              ["Docs", "/docs"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-[var(--color-ax-muted)] transition-colors duration-200 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden text-sm text-[var(--color-ax-muted)] transition-colors duration-200 hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="ax-press inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-[var(--color-ax-primary)] px-4 text-sm font-medium text-white transition-all duration-200 hover:bg-[#9b5de5] hover:ax-glow"
            >
              Launch App
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── SECTION 1 · HERO — glowing orb + reveal on load ── */}
        <section className="relative overflow-hidden px-6 pt-40 pb-24">
          {/* Glowing orb: layered radial gradients in accent colors */}
          <div className="pointer-events-none absolute inset-0 -z-[1]" aria-hidden>
            <div
              className="absolute left-1/2 top-[-220px] h-[560px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(131,56,236,0.55) 0%, rgba(58,134,255,0.25) 45%, transparent 70%)",
              }}
            />
            <div
              className="absolute right-[8%] top-[30%] h-[300px] w-[300px] rounded-full opacity-25 blur-[90px]"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(58,134,255,0.5) 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <p
              data-ax-hero
              className="fw-mono mb-6 text-xs uppercase tracking-[0.3em] text-[var(--color-ax-muted)]"
            >
              AI-powered smart contract security
            </p>
            <h1
              data-hero-split
              className="text-balance font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] tracking-tight text-[var(--color-ax-text)] sm:text-5xl lg:text-[64px] lg:leading-[1.12]"
            >
              <SplitWords text="The next-generation" />{" "}
              <SplitWords text="security protocol" gradient />{" "}
              <SplitWords text="for on-chain value" />
            </h1>
            <p
              data-ax-hero
              className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-[var(--color-ax-muted)]"
            >
              Blistering scan speeds, absolute precision, and continuous
              monitoring — institutional-grade analysis powered by AI, for
              every contract you ship.
            </p>

            <div
              data-ax-hero
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/dashboard"
                className="ax-press inline-flex h-12 items-center gap-2 rounded-[12px] bg-[var(--color-ax-primary)] px-7 text-base font-medium text-white transition-all duration-200 hover:bg-[#9b5de5] hover:ax-glow"
              >
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="ax-press inline-flex h-12 items-center gap-2 rounded-[12px] border border-[var(--color-ax-border)] bg-transparent px-7 text-base font-medium text-[var(--color-ax-text)] transition-all duration-200 hover:border-[var(--color-ax-muted)] hover:bg-white/5"
              >
                Read Docs
              </Link>
            </div>

            {/* Working scan input — reach core action in 1 click */}
            <div
              data-ax-hero
              className="mx-auto mt-12 max-w-2xl [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-[var(--color-ax-muted)] [&_button]:bg-[var(--color-ax-primary)] [&_button]:text-white [&_button]:hover:bg-[#9b5de5] [&_*]:border-[var(--color-ax-border)]"
            >
              <ScanInput variant="hero" redirectToDemo />
            </div>
            <p
              data-ax-hero
              className="fw-mono mt-4 text-[11px] uppercase tracking-widest text-[var(--color-ax-muted)]"
            >
              No signup required for basic scan
            </p>
          </div>
        </section>

        {/* ── SECTION 2 · PERFORMANCE METRICS BAR ── */}
        <section className="relative z-10 border-y border-[var(--color-ax-border)] bg-[var(--color-ax-surface)]/80 py-10 backdrop-blur-sm">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-6 sm:grid-cols-3">
            {[
              { v: "10,000+", l: "Scans per hour" },
              { v: "<30s", l: "Average scan time" },
              { v: "98.2%", l: "Detection precision" },
            ].map((m) => (
              <div
                key={m.l}
                data-ax-reveal
                className="text-center"
              >
                <div className="fw-mono tnum text-3xl font-medium text-white sm:text-4xl">
                  <span className="ax-gradient-text">{m.v}</span>
                </div>
                <div className="mt-2 text-sm text-[var(--color-ax-muted)]">
                  {m.l}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3 · CORE ECOSYSTEM — 3-column glass grid ── */}
        <section id="ecosystem" className="relative px-6 py-24">
          <div className="mx-auto max-w-[1280px]">
            <p className="fw-mono mb-4 text-xs uppercase tracking-[0.3em] text-[var(--color-ax-primary)]">
              Core ecosystem
            </p>
            <h2
              data-split
              className="max-w-2xl text-balance font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[40px] sm:leading-[1.2]"
            >
              <SplitWords text="One protocol for the" />{" "}
              <SplitWords text="full security lifecycle" />
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {ECOSYSTEM.map((card) => (
                <div
                  key={card.title}
                  data-ax-reveal
                  className="ax-glass group relative flex flex-col p-8 transition-colors duration-200 hover:border-[var(--color-ax-primary)]/40"
                >
                  <div className="ax-gradient flex h-12 w-12 items-center justify-center rounded-[12px]">
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mt-6 font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-ax-muted)]">
                    {card.desc}
                  </p>
                  <Link
                    href={card.href}
                    data-cursor="Explore"
                    className="fw-mono mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-ax-glow)] transition-colors hover:text-white"
                  >
                    {card.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4 · DEVELOPER QUICKSTART — split screen ── */}
        <section className="relative border-y border-[var(--color-ax-border)] px-6 py-24">
          <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2">
            <div data-ax-reveal>
              <p className="fw-mono mb-4 text-xs uppercase tracking-[0.3em] text-[var(--color-ax-primary)]">
                Developer quickstart
              </p>
              <h2 className="text-balance font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[40px] sm:leading-[1.2]">
                Build without{" "}
                <span className="ax-gradient-text">vulnerabilities</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-ax-muted)]">
                One CLI. One API key. One GitHub Action. AuditAI plugs into the
                tools you already use and returns findings where you work —
                your terminal, your PRs, your Security tab.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/docs"
                  className="ax-press inline-flex h-12 items-center gap-2 rounded-[12px] bg-[var(--color-ax-primary)] px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-[#9b5de5] hover:ax-glow"
                >
                  Open the docs
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/api-console"
                  className="ax-press inline-flex h-12 items-center gap-2 rounded-[12px] border border-[var(--color-ax-border)] px-6 text-sm font-medium text-white transition-all duration-200 hover:border-[var(--color-ax-muted)] hover:bg-white/5"
                >
                  Try the API
                </Link>
              </div>
            </div>

            {/* Mock terminal — Mac dots + syntax-highlighted snippet */}
            <div data-ax-reveal>
              <div className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[#08080d] shadow-[0_0_40px_rgba(131,56,236,0.12)]">
                <div className="flex items-center gap-2 border-b border-[var(--color-ax-border)] px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  <span className="fw-mono ml-3 text-[11px] text-[var(--color-ax-muted)]">
                    quickstart — zsh
                  </span>
                </div>
                <pre className="fw-mono overflow-x-auto border-0 bg-transparent p-5 text-[13px] leading-7">
                  <code>
                    <span className="text-[var(--color-ax-muted)]">$</span>{" "}
                    <span className="text-white">npm install</span>{" "}
                    <span className="text-[#7cb0ff]">auditai</span>
                    {"\n"}
                    <span className="text-[var(--color-ax-muted)]">$</span>{" "}
                    <span className="text-white">npx auditai init</span>{" "}
                    <span className="text-[#c792ea]">--network</span>{" "}
                    <span className="text-[#3dd68c]">monad</span>
                    {"\n"}
                    <span className="text-[var(--color-ax-muted)]">$</span>{" "}
                    <span className="text-white">auditai scan</span>{" "}
                    <span className="text-[#c792ea]">./contracts</span>
                    {"\n\n"}
                    <span className="text-[var(--color-ax-muted)]">
                      ✔ 3 engines completed in{" "}
                    </span>
                    <span className="text-[#3dd68c]">18.4s</span>
                    {"\n"}
                    <span className="text-[var(--color-ax-muted)]">
                      ├ 2 critical · 1 high · 0 medium
                    </span>
                    {"\n"}
                    <span className="text-[var(--color-ax-muted)]">
                      ├ fixes generated:{" "}
                    </span>
                    <span className="text-[#7cb0ff]">3 / 3</span>
                    {"\n"}
                    <span className="text-[var(--color-ax-muted)]">
                      └ risk grade:{" "}
                    </span>
                    <span className="text-[#ff4d6d]">F</span>
                    <span className="text-[var(--color-ax-muted)]"> → </span>
                    <span className="text-[#3dd68c]">A</span>
                    <span className="text-[var(--color-ax-muted)]">
                      {" "}
                      (after fixes)
                    </span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <section className="relative z-10 overflow-hidden border-b border-[var(--color-ax-border)] py-5">
          <div className="fw-marquee-track">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${half}-${item}`}
                    className="fw-mono flex items-center whitespace-nowrap text-sm uppercase tracking-[0.25em] text-[var(--color-ax-muted)]"
                  >
                    <span className="px-6">{item}</span>
                    <span className="text-[var(--color-ax-primary)]">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURE TOOLKIT (staggered glass cards) ── */}
        <section className="relative px-6 py-24">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="fw-mono mb-4 text-xs uppercase tracking-[0.3em] text-[var(--color-ax-primary)]">
                  The toolkit
                </p>
                <h2
                  data-split
                  className="max-w-xl text-balance font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[40px] sm:leading-[1.2]"
                >
                  <SplitWords text="Everything between" />{" "}
                  <SplitWords text="code and mainnet" />
                </h2>
              </div>
              <Link
                href="/features"
                className="fw-mono inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-ax-muted)] transition-colors hover:text-white"
              >
                All capabilities
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <Link
                  key={f.title}
                  href="/features"
                  data-cursor={f.cursor}
                  data-ax-reveal
                  className={`ax-glass fw-img-hover group relative block overflow-hidden rounded-[16px]! transition-colors duration-200 hover:border-[var(--color-ax-primary)]/40 ${f.offset ?? ""}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={f.img}
                      alt={f.title}
                      className="fw-parallax absolute inset-0 h-[114%] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--color-ax-primary)]/15">
                      <f.icon className="h-4 w-4 text-[#a56bff]" />
                    </div>
                    <h3 className="mt-4 font-[family-name:var(--font-display)] text-base font-semibold text-white">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-ax-muted)]">
                      {f.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORKFLOW STRIP ── */}
        <section className="relative px-6 py-8">
          <div className="fw-mono mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-widest text-[var(--color-ax-muted)]">
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
                {i < arr.length - 1 && (
                  <span className="text-[var(--color-ax-primary)]">→</span>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* ── SECTION 5 · FAQ ── */}
        <section className="relative px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <p className="fw-mono mb-4 text-center text-xs uppercase tracking-[0.3em] text-[var(--color-ax-primary)]">
              FAQ
            </p>
            <h2
              data-split
              className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white sm:text-[40px]"
            >
              <SplitWords text="Questions, answered" />
            </h2>

            <div className="mt-12 divide-y divide-[var(--color-ax-border)] rounded-[24px] border border-[var(--color-ax-border)] bg-[var(--color-ax-surface)]/50 px-8">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-base font-medium text-white">
                        {faq.q}
                      </span>
                      <span className="shrink-0 text-[#a56bff]">
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
                      <p className="pb-6 pr-10 text-sm leading-relaxed text-[var(--color-ax-muted)]">
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
        <section className="relative px-6 py-24 text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-[1] h-[360px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[110px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(131,56,236,0.5) 0%, rgba(58,134,255,0.2) 50%, transparent 70%)",
            }}
            aria-hidden
          />
          <h2
            data-split
            className="mx-auto max-w-2xl text-balance font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-[56px] sm:leading-[1.15]"
          >
            <SplitWords text="Ship secure contracts." />
          </h2>
          <p
            data-ax-hero
            className="mx-auto mt-5 max-w-md text-base text-[var(--color-ax-muted)]"
          >
            Run your first scan free — no credit card, no signup. Upgrade when
            your contracts go live.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="ax-press inline-flex h-12 items-center gap-2 rounded-[12px] bg-[var(--color-ax-primary)] px-7 text-base font-medium text-white transition-all duration-200 hover:bg-[#9b5de5] hover:ax-glow"
            >
              Start scanning free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/whitepaper"
              className="ax-press inline-flex h-12 items-center gap-2 rounded-[12px] border border-[var(--color-ax-border)] px-7 text-base font-medium text-white transition-all duration-200 hover:border-[var(--color-ax-muted)] hover:bg-white/5"
            >
              Read the whitepaper
            </Link>
          </div>
        </section>
      </main>

      {/* ── SECTION 5 · FOOTER ── */}
      <footer className="relative z-10 border-t border-[var(--color-ax-border)] px-6 py-14">
        <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="ax-gradient flex h-8 w-8 items-center justify-center rounded-[8px]">
                <Shield className="h-4 w-4 text-white" strokeWidth={2.4} />
              </span>
              <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.14em] text-white">
                AUDITAI
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-ax-muted)]">
              AI-powered smart contract security analysis. Find bugs before
              they find your users.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { icon: MessageCircle, href: "/book-demo", label: "Discord" },
                { icon: XIcon, href: "/book-demo", label: "X" },
                { icon: Github, href: "/docs", label: "GitHub" },
              ].map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--color-ax-border)] text-[var(--color-ax-muted)] transition-colors duration-200 hover:border-[var(--color-ax-primary)]/50 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
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
                ["Audit reports", "/whitepaper"],
              ],
            },
          ].map((col) => (
            <div key={col.head}>
              <p className="fw-mono text-[11px] uppercase tracking-widest text-[var(--color-ax-muted)]">
                {col.head}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-[var(--color-ax-muted)] transition-colors duration-200 hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="fw-mono mx-auto mt-12 flex max-w-[1280px] items-center justify-between border-t border-[var(--color-ax-border)] pt-6 text-[11px] uppercase tracking-widest text-[var(--color-ax-muted)]">
          <span>© 2026 AuditAI</span>
          <span className="flex items-center gap-2">
            <FileCheck className="h-3.5 w-3.5" />
            Audited · Monitored · Secured
          </span>
        </div>
      </footer>
    </div>
  );
}
