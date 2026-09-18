"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  X,
  Shield,
  Play,
} from "lucide-react";

const BANNER_KEY = "auditai_banner_dismissed";

const NAV = [
  ["HOME", "/"],
  ["SCAN", "/features"],
  ["MONITOR", "/dashboard/monitoring"],
  ["API", "/dashboard/api-console"],
  ["DOCS", "/docs"],
];

const ADVANTAGE = [
  {
    n: "001",
    tag: "PERFORMANCE",
    title: "High Performance Engine",
    body: "Experience lightning-fast analysis with absolute reliability, parallel engines, and sub-second verdicts on any contract.",
    cta: "LEARN MORE",
    href: "/features",
    color: "#4fd1c5",
  },
  {
    n: "002",
    tag: "COVERAGE",
    title: "True Multi-Chain Reach",
    body: "Full visibility across Ethereum, Base, Arbitrum, Polygon, BSC and Solana — one scan, every chain that matters.",
    cta: "EXPLORE CHAINS",
    href: "/features",
    color: "#e2498b",
  },
  {
    n: "003",
    tag: "COMMUNITY",
    title: "Community Driven",
    body: "Built for and by the community. Engage with developers, auditors, and researchers securing the future together.",
    cta: "JOIN THE NETWORK",
    href: "/whitepaper",
    color: "#31c48d",
  },
];

const STATS = [
  { v: "10,000+", l: "TRANSACTIONS PER SECOND", sub: "monitored events indexed" },
  { v: "100%", l: "EVM-COMPATIBLE", sub: "solidity · vyper · anchor" },
  { v: "0.4s", l: "FINALITY", sub: "from push to verdict" },
  { v: "1s", l: "BLOCK TIMES", sub: "alert latency" },
];

const PLUG_WORDS = [
  "SMART CONTRACTS",
  "TOOLS & SERVICES",
  "SECURITY",
  "RESEARCH",
  "WALLETS",
  "EVM ADDRESSES",
  "STATIC ANALYSIS",
  "SYMBOLIC EXECUTION",
];

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

export default function Home() {
  const [banner, setBanner] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const revealRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    try {
      setBanner(localStorage.getItem(BANNER_KEY) !== "1");
    } catch {
      setBanner(true);
    }
  }, []);

  // Scroll reveal via IntersectionObserver
  useEffect(() => {
    const els = revealRef.current?.querySelectorAll("[data-reveal]");
    if (!els?.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      els.forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.transition =
              "opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)";
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "none";
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const dismissBanner = () => {
    setBanner(false);
    try {
      localStorage.setItem(BANNER_KEY, "1");
    } catch {
      /* noop */
    }
  };

  return (
    <div className="ax-editorial min-h-screen" ref={revealRef}>
      {/* ── TOP BANNER ── */}
      {banner && (
        <div className="relative z-[60] flex items-center justify-center gap-3 bg-[#6c5ce7] px-10 py-3 text-center">
          <span className="ax-space rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
            LIVE
          </span>
          <p className="text-sm font-medium text-white">
            AuditAI is live — scan your first contract free{" "}
            <Link href="/dashboard/scans" className="underline underline-offset-2">
              Try it now →
            </Link>
          </p>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss"
            className="absolute right-4 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── NAV (white) ── */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 rotate-45 items-center justify-center rounded-[6px] bg-[#6c5ce7]">
              <span className="h-2 w-2 -rotate-45 rounded-full bg-white" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-black">
              AUDITAI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="ax-space text-[13px] font-bold tracking-wide text-black transition-colors hover:text-[#6c5ce7]"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              aria-label="Search docs"
              className="text-black/60 hover:text-black"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/dashboard"
              className="ax-press rounded-full bg-[#6c5ce7] px-6 py-3 text-[13px] font-bold tracking-wide text-white transition-all duration-200 hover:bg-[#7d6cf0] hover:shadow-[0_8px_24px_rgba(108,92,231,0.32)]"
            >
              TRY AUDITAI
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO — editorial headline + striped bars + floating card ── */}
        <section className="relative overflow-hidden bg-[#fdfdfa] px-10 pb-24 pt-10">
          <h1 className="mx-auto max-w-5xl text-center text-[56px] font-extrabold leading-[1.02] tracking-[-0.03em] text-black sm:text-[76px]">
            The infrastructure the
            <br />
            software world has been
            <br />
            waiting for.
          </h1>

          {/* Corner brackets */}
          <div className="relative mx-auto mt-4 max-w-[1360px]">
            <span className="absolute left-0 top-6 h-12 w-12 border-b border-l border-black/25" />
            <span className="absolute right-0 top-6 h-12 w-12 border-b border-r border-black/25" />

            {/* Striped bars stage */}
            <div className="relative mx-auto mt-2 flex h-[420px] max-w-[1200px] items-end justify-center gap-10 px-6">
              {[150, 260, 340, 420, 420, 420, 340, 260, 150].map((h, i) => (
                <div
                  key={i}
                  className="ax-bar w-[52px] rounded-[3px] opacity-90"
                  style={{ height: h, animationDelay: `${i * 0.12}s` }}
                />
              ))}

              {/* Floating stat card */}
              <div
                data-reveal
                className="absolute left-[6%] top-[16%] w-[300px] rounded-[10px] border border-black/10 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
              >
                <p className="ax-space text-[10px] tracking-wider text-black/50">
                  LIVE THREAT FEED
                </p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[28px] font-extrabold leading-none tracking-tight text-black">
                    2,481
                  </span>
                  <span className="ax-space rounded-full bg-[#31c48d]/15 px-2 py-0.5 text-[10px] font-bold text-[#0f9960]">
                    ▲ DEFENDED
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    ["Reentrancy", "blocked", "#e2498b"],
                    ["Access control", "flagged", "#f2a33c"],
                    ["Oracle drift", "resolved", "#4fd1c5"],
                  ].map(([k, v, c]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span className="text-black/70">{k}</span>
                      <span
                        className="ax-space font-bold"
                        style={{ color: c as string }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="ax-space mt-4 border-t border-black/8 pt-3 text-[10px] tracking-wide text-black/45">
                  INTELLIGENCE PROPAGATES FASTER THAN ATTACKS
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── AXIOM ADVANTAGE ── */}
        <section className="bg-[#fdfdfa] px-10 py-24">
          <div className="mx-auto max-w-[1360px]">
            <p data-reveal className="ax-space text-[12px] tracking-[0.1em] text-black/60">
              {"//"} AXIOM ADVANTAGE <span className="text-black/25">————</span>
            </p>
            <h2
              data-reveal
              className="mt-4 text-[52px] font-extrabold leading-[1.05] tracking-[-0.02em] text-black sm:text-[64px]"
            >
              Built for scale.
            </h2>
            <p data-reveal className="mt-6 max-w-md text-[17px] leading-relaxed text-black/70">
              Experience next-generation analysis capability without
              compromising on decentralization or developer experience.
            </p>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {ADVANTAGE.map((c) => (
                <div
                  key={c.n}
                  data-reveal
                  className="group rounded-[10px] border border-black/10 bg-white p-7 transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="ax-space text-[12px] text-black/50">
                      {"//"} {c.n}
                    </span>
                    <span className="ax-space rounded-[4px] bg-black/[0.05] px-2.5 py-1 text-[10px] font-bold tracking-wide text-black/60">
                      {c.tag}
                    </span>
                  </div>
                  {/* Icon frame with wireframe glyph */}
                  <div className="mt-5 rounded-[6px] border border-black/8 bg-[#fafaf8] p-6">
                    <div className="relative flex h-40 items-center justify-center rounded-[4px] border border-black/6 bg-white">
                      <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-black/20" />
                      <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-black/20" />
                      <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-black/20" />
                      <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-black/20" />
                      {/* Wireframe orb glyph */}
                      <span
                        className="block h-16 w-16 animate-[ax-breathe_5s_ease-in-out_infinite] rounded-full border"
                        style={{
                          borderColor: c.color,
                          background: `radial-gradient(circle at 35% 30%, ${c.color}22, transparent 60%)`,
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="mt-6 text-[26px] font-bold tracking-tight text-black">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-black/60">
                    {c.body}
                  </p>
                  <Link
                    href={c.href}
                    className="ax-space mt-6 inline-flex items-center gap-2 text-[12px] font-bold tracking-wide text-black transition-colors group-hover:text-[#6c5ce7]"
                  >
                    {c.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INTELLIGENCE STATEMENT (light band, left rail) ── */}
        <section className="bg-[#fdfdfa] px-10 py-24">
          <div className="mx-auto grid max-w-[1360px] gap-12 md:grid-cols-[280px_1fr]">
            <aside className="border-t border-black/10 pt-6">
              {["PERFORMANCE AT SCALE", "ZERO FRICTION", "TRULY DECENTRALIZED"].map(
                (t, i) => (
                  <p
                    key={t}
                    data-reveal
                    className="ax-space mb-3 text-[12px] tracking-[0.08em] text-black/45"
                    style={{ transitionDelay: `${i * 90}ms` }}
                  >
                    / {t}
                  </p>
                ),
              )}
            </aside>
            <div>
              <h2
                data-reveal
                className="text-[44px] font-extrabold leading-[1.06] tracking-[-0.02em] text-black sm:text-[56px]"
              >
                Intelligence without tradeoffs.
                <br />
                Defend <em className="font-extrabold italic">without limits.</em>
              </h2>
              <p
                data-reveal
                className="mt-8 max-w-xl text-[17px] leading-relaxed text-black/70"
              >
                AuditAI unlocks a new era of software reliability, enabling
                capabilities that traditional audit tools have never delivered
                before. When a vulnerability appears anywhere in the network,
                the entire ecosystem learns and defends — instantly.
              </p>
              <p
                data-reveal
                className="mt-5 max-w-xl text-[17px] leading-relaxed text-black/70"
              >
                Built on parallel analysis — with <strong>10,000+ TPS</strong>{" "}
                monitoring and <strong>0.4s finality</strong> — AuditAI&apos;s
                intelligence propagates faster than any attack can spread.
              </p>
            </div>
          </div>
        </section>

        {/* ── STATS BAR (light, mono columns) ── */}
        <section className="border-y border-black/8 bg-white px-10 py-12">
          <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} data-reveal className="text-center">
                <div className="text-[40px] font-extrabold leading-none tracking-tight text-black">
                  {s.v}
                </div>
                <div className="ax-space mt-3 text-[11px] font-bold tracking-[0.08em] text-black/60">
                  {s.l}
                </div>
                <div className="ax-space mt-1 text-[10px] tracking-wide text-black/35">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLUG AND PLAY (tinted band + word marquees) ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#f4f2fc] via-[#efecfb] to-[#e9e5fa] px-10 py-28">
          <div className="relative mx-auto max-w-[900px] text-center">
            <h2
              data-reveal
              className="text-[56px] font-extrabold leading-[1.02] tracking-[-0.03em] text-black sm:text-[72px]"
            >
              Plug and play.
            </h2>
            <p data-reveal className="mt-7 text-[17px] leading-relaxed text-black/75">
              AuditAI is{" "}
              <strong className="font-bold text-black">
                EVM-compatible at the bytecode level.
              </strong>{" "}
              That means Solidity contracts, EVM addresses, infra, tooling, and
              libraries work out of the box.
            </p>
            <p data-reveal className="mt-4 text-[17px] text-black/75">
              <strong className="font-bold text-black">
                Focus on building great products
              </strong>{" "}
              — not learning a new stack.
            </p>
            <div data-reveal className="mt-10">
              <Link
                href="/docs"
                className="ax-press inline-block rounded-full border border-black/15 bg-white px-8 py-4 text-[12px] font-bold tracking-wide text-black transition-all duration-200 hover:border-[#6c5ce7] hover:text-[#6c5ce7]"
              >
                CHECK THE DEVELOPER BRIEFING
              </Link>
            </div>
          </div>

          {/* Background word rows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {[12, 38, 64, 88].map((top, i) => (
              <div
                key={top}
                className={`absolute flex w-max gap-14 whitespace-nowrap ${
                  i % 2 ? "ax-marquee-rev" : "ax-marquee"
                }`}
                style={{ top: `${top}%`, opacity: 0.14 }}
              >
                {[0, 1].map((half) => (
                  <div key={half} className="flex gap-14">
                    {PLUG_WORDS.map((w) => (
                      <span
                        key={`${half}-${w}`}
                        className="ax-space text-[15px] font-bold tracking-[0.14em] text-black"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── DARK ORB BAND — Deploy an agent / defend the network ── */}
        <section className="ax-dots-dark relative overflow-hidden bg-[#0c0820] px-10 py-32">
          <div className="mx-auto grid max-w-[1360px] items-center gap-16 lg:grid-cols-2">
            <div>
              <h2
                data-reveal
                className="text-[52px] font-extrabold leading-[1.03] tracking-[-0.02em] text-white sm:text-[64px]"
              >
                Deploy an agent.
                <br />
                Defend the network.
              </h2>
              <p
                data-reveal
                className="mt-8 max-w-md text-[17px] leading-relaxed text-white/70"
              >
                AuditAI&apos;s custom fingerprint database and low system
                requirements allow security agents to run on consumer-grade
                hardware. Any developer can participate and strengthen the
                network.
              </p>
              <div data-reveal className="mt-9">
                <Link
                  href="/whitepaper"
                  className="block w-full max-w-[440px] rounded-full border border-white/25 px-8 py-4 text-center text-[12px] font-bold tracking-wide text-white transition-colors duration-200 hover:border-[#6c5ce7] hover:text-[#a996ff]"
                >
                  LEARN ABOUT THE DATABASE
                </Link>
              </div>
              <p
                data-reveal
                className="mt-12 max-w-md text-[22px] font-semibold leading-snug text-white"
              >
                That&apos;s <span className="font-extrabold">real decentralization</span>{" "}
                from day one — with a global network ready to scale as demand
                grows.
              </p>
              <div data-reveal className="mt-9">
                <Link
                  href="/dashboard/monitoring"
                  className="block w-full max-w-[440px] rounded-full border border-white/25 px-8 py-4 text-center text-[12px] font-bold tracking-wide text-white transition-colors duration-200 hover:border-[#6c5ce7] hover:text-[#a996ff]"
                >
                  LEARN HOW TO RUN A NODE
                </Link>
              </div>
            </div>

            {/* Glowing orb */}
            <div className="relative flex items-center justify-center">
              <div
                data-reveal
                className="ax-orb relative h-[420px] w-[420px] max-w-full"
              >
                <span className="absolute left-[30%] top-[26%] h-16 w-16 rounded-full bg-white/80 blur-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE STRIP (dark) ── */}
        <section className="overflow-hidden border-y border-white/10 bg-[#0c0820] py-5">
          <div className="ax-marquee flex w-max">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${half}-${item}`}
                    className="ax-space flex items-center whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.22em] text-white/60"
                  >
                    <span className="px-6">{item}</span>
                    <span className="text-[#6c5ce7]">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── LEGACY TRIANGLE (light, venn blur) ── */}
        <section className="bg-[#f4f3ef] px-10 py-28">
          <div className="mx-auto grid max-w-[1360px] items-center gap-14 lg:grid-cols-[1fr_1.2fr_0.9fr]">
            <h2
              data-reveal
              className="text-[40px] font-extrabold leading-[1.08] tracking-[-0.02em] text-black sm:text-[48px]"
            >
              Legacy tools are forced to choose between security,
              decentralization, and scalability.
            </h2>

            {/* Venn blur + dashed circle + labels */}
            <div data-reveal className="relative mx-auto h-[380px] w-full max-w-[480px]">
              <div
                className="absolute inset-0 rounded-full opacity-70 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 42% 42%, rgba(226,73,139,0.5) 0%, rgba(154,106,236,0.55) 55%, rgba(74,98,236,0.5) 100%)",
                }}
              />
              <div className="ax-dashed-ring absolute inset-[12%]" />
              <span className="ax-space absolute left-1/2 top-[2%] -translate-x-1/2 text-[11px] font-bold tracking-[0.14em] text-black/60">
                SECURITY
              </span>
              <span className="ax-space absolute left-[4%] top-[36%] text-[11px] font-bold tracking-[0.14em] text-black/60">
                DECENTRALIZATION
              </span>
              <span className="ax-space absolute bottom-[6%] right-[2%] text-[11px] font-bold tracking-[0.14em] text-black/60">
                SCALABILITY
              </span>
            </div>

            <div>
              <h3
                data-reveal
                className="text-[30px] font-semibold leading-tight tracking-tight text-black"
              >
                AuditAI <em className="italic">rewrites</em> the rules.
              </h3>
              <p
                data-reveal
                className="mt-5 text-[15px] leading-relaxed text-black/65"
              >
                By combining semantic fingerprints with parallel consensus
                analysis, AuditAI delivers real-time security coordination
                without exposing a single line of raw data.
              </p>
            </div>
          </div>
        </section>

        {/* ── ALL IN ONE (dark gradient statement) ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0c0820] via-[#1b1440] to-[#4a3ab0] px-10 py-40 text-center">
          <h2
            data-reveal
            className="text-[64px] font-extrabold tracking-[-0.02em] text-white sm:text-[80px]"
          >
            All in one.
          </h2>
          <p data-reveal className="mx-auto mt-6 max-w-lg text-[17px] text-white/75">
            Scan, monitor, score and fix — the full security lifecycle in a
            single protocol.
          </p>
        </section>

        {/* ── TWO BIG CARDS (dark, dotted) ── */}
        <section className="ax-dots-dark bg-[#0c0820] px-10 py-24">
          <div className="mx-auto grid max-w-[1360px] gap-6 md:grid-cols-2">
            {/* Ecosystem card */}
            <div
              data-reveal
              className="group overflow-hidden rounded-[14px] border border-white/10 bg-[#141028]"
            >
              <div className="relative h-[300px] overflow-hidden">
                <img
                  src="/axiom/app-dashboard.png"
                  alt="AuditAI dashboard"
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="border-t border-white/8 p-8">
                <h3 className="text-[22px] font-bold tracking-tight text-white">
                  Explore the Dashboard
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                  Live scans, findings and fix suggestions across every chain —
                  built for the speed AuditAI delivers.
                </p>
              </div>
            </div>
            {/* Start building card */}
            <div
              data-reveal
              className="group overflow-hidden rounded-[14px] border border-white/10 bg-[#141028]"
            >
              <div className="relative h-[300px] overflow-hidden">
                <img
                  src="/axiom/app-scans.png"
                  alt="AuditAI scans"
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="border-t border-white/8 p-8">
                <h3 className="text-[22px] font-bold tracking-tight text-white">
                  Start Building
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                  Explore programs, resources, and a world-class community for
                  founders and developers securing on-chain finance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── AUDITAI MEDIA (light) ── */}
        <section className="bg-white px-10 py-24">
          <div className="mx-auto max-w-[1360px]">
            <div className="grid items-end gap-8 md:grid-cols-[1fr_1fr]">
              <h2
                data-reveal
                className="text-[56px] font-extrabold tracking-[-0.03em] text-black sm:text-[68px]"
              >
                AuditAI Media.
              </h2>
              <div data-reveal>
                <p className="text-[15px] leading-relaxed text-black/65">
                  Stay close to what&apos;s happening in the ecosystem. Explore
                  the live product, learn from builders, hear from founders.
                  Read, listen, and explore.
                </p>
                <Link
                  href="/book-demo"
                  className="ax-press mt-5 inline-flex items-center gap-2 rounded-full bg-[#6c5ce7] px-6 py-3 text-[12px] font-bold tracking-wide text-white transition-all duration-200 hover:bg-[#7d6cf0]"
                >
                  <Play className="h-3.5 w-3.5" /> TRY AUDITAI LIVE
                </Link>
              </div>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {[
                {
                  img: "/axiom/app-monitoring.png",
                  kicker: "PRODUCT DEEP DIVE",
                  title: "Inside continuous monitoring",
                  desc: "How AuditAI watches deployed contracts and alerts in under a second.",
                },
                {
                  img: "/axiom/app-scans.png",
                  kicker: "BUILDER STORY",
                  title: "From F to A in one click",
                  desc: "Fix suggestions that rewrite vulnerable functions — automatically.",
                },
              ].map((m) => (
                <div
                  key={m.title}
                  data-reveal
                  className="group overflow-hidden rounded-[14px] border border-black/10 bg-white transition-shadow duration-300 hover:shadow-[0_20px_56px_rgba(0,0,0,0.10)]"
                >
                  <div className="relative h-[260px] overflow-hidden border-b border-black/8">
                    <img
                      src={m.img}
                      alt={m.title}
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-7">
                    <p className="ax-space text-[10px] font-bold tracking-[0.14em] text-[#6c5ce7]">
                      {m.kicker}
                    </p>
                    <h3 className="mt-3 text-[20px] font-bold tracking-tight text-black">
                      {m.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-black/60">
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ (light) ── */}
        <section className="bg-[#fdfdfa] px-10 py-24">
          <div className="mx-auto max-w-3xl">
            <p data-reveal className="ax-space text-[12px] tracking-[0.1em] text-black/60">
              {"//"} FAQ <span className="text-black/25">————</span>
            </p>
            <h2
              data-reveal
              className="mt-4 text-[44px] font-extrabold tracking-[-0.02em] text-black sm:text-[52px]"
            >
              Questions, answered.
            </h2>
            <div className="mt-10 divide-y divide-black/8 border-y border-black/10">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} data-reveal>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    >
                      <span className="text-[17px] font-semibold text-black">
                        {f.q}
                      </span>
                      <span
                        className={`ax-space shrink-0 text-[20px] font-bold transition-transform duration-300 ${
                          open ? "rotate-45 text-[#6c5ce7]" : "text-black/40"
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="pb-6 pr-10 text-[15px] leading-relaxed text-black/65">
                          {f.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA (dark) ── */}
        <section className="relative overflow-hidden bg-[#0c0820] px-10 py-28 text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[110px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(108,92,231,0.6) 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <h2
            data-reveal
            className="text-[48px] font-extrabold tracking-[-0.02em] text-white sm:text-[64px]"
          >
            Ship secure contracts.
          </h2>
          <p data-reveal className="mx-auto mt-5 max-w-md text-[16px] text-white/65">
            Run your first scan free — no credit card, no signup.
          </p>
          <div
            data-reveal
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/auth/register"
              className="ax-press inline-flex items-center gap-2 rounded-full bg-[#6c5ce7] px-8 py-4 text-[14px] font-bold text-white transition-all duration-200 hover:bg-[#7d6cf0] hover:shadow-[0_8px_24px_rgba(108,92,231,0.4)]"
            >
              Start scanning <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-[14px] font-bold text-white transition-colors duration-200 hover:border-[#6c5ce7] hover:text-[#a996ff]"
            >
              Read the whitepaper
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0c0820] px-10 pb-10 pt-16">
        <div className="mx-auto grid max-w-[1360px] gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 rotate-45 items-center justify-center rounded-[6px] bg-[#6c5ce7]">
                <Shield className="h-3.5 w-3.5 -rotate-45 text-white" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-white">
                AUDITAI
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/50">
              The high performance security network built for scale. Powered by
              parallel analysis and AI.
            </p>
          </div>
          {[
            {
              head: "PRODUCT",
              links: [
                ["Features", "/features"],
                ["Monitoring", "/dashboard/monitoring"],
                ["Risk API", "/dashboard/api-console"],
                ["Solvency proof", "/solvency"],
              ],
            },
            {
              head: "RESOURCES",
              links: [
                ["Documentation", "/docs"],
                ["Whitepaper", "/whitepaper"],
                ["SOC 2", "/soc2"],
                ["Book a demo", "/book-demo"],
              ],
            },
            {
              head: "COMPANY",
              links: [
                ["Terms", "/terms"],
                ["Privacy", "/privacy"],
                ["Log in", "/auth/login"],
                ["Register", "/auth/register"],
              ],
            },
          ].map((col) => (
            <div key={col.head}>
              <p className="ax-space text-[11px] font-bold tracking-[0.14em] text-white/40">
                {col.head}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] text-white/60 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="ax-space mx-auto mt-14 flex max-w-[1360px] items-center justify-between border-t border-white/10 pt-6 text-[10px] tracking-[0.12em] text-white/35">
          <span>© 2026 AUDITAI</span>
          <span>INTELLIGENCE WITHOUT TRADEOFFS</span>
        </div>
      </footer>
    </div>
  );
}
