"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV = [
  ["Platform", "/features"],
  ["Monitoring", "/dashboard/monitoring"],
  ["Risk API", "/dashboard/api-console"],
  ["Docs", "/docs"],
];

/* Isometric wireframe cubes — the brand's geometric mark.
   1px strokes, mint on dark / obsidian on mint, bleeding off edges. */
function WireCubes({
  className = "",
  variant = "mint",
  rows = 3,
}: {
  className?: string;
  variant?: "mint" | "obsidian";
  rows?: number;
}) {
  const stroke = variant === "mint" ? "#90fc95" : "#1e211e";
  const cube = (cx: number, cy: number, s: number, key: string) => (
    <g key={key}>
      {/* top face */}
      <polygon
        points={`${cx},${cy - s} ${cx + s * 0.87},${cy - s / 2} ${cx},${cy} ${
          cx - s * 0.87
        },${cy - s / 2}`}
      />
      {/* left face */}
      <polygon
        points={`${cx - s * 0.87},${cy - s / 2} ${cx},${cy} ${cx},${
          cy + s
        } ${cx - s * 0.87},${cy + s / 2}`}
      />
      {/* right face */}
      <polygon
        points={`${cx + s * 0.87},${cy - s / 2} ${cx},${cy} ${cx},${
          cy + s
        } ${cx + s * 0.87},${cy + s / 2}`}
      />
    </g>
  );
  return (
    <svg
      className={className}
      viewBox="0 0 400 520"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke={stroke} strokeWidth="1" vectorEffect="non-scaling-stroke">
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: 2 }).map((_, c) =>
            cube(140 + c * 175 + (r % 2) * 60, 110 + r * 130, 82, `${r}-${c}`)
          ),
        )}
      </g>
    </svg>
  );
}

const STATS = [
  {
    eyebrow: "DETECTION SPEED",
    value: "0.4s",
    label: "from code push to full verdict",
  },
  {
    eyebrow: "COVERAGE",
    value: "6",
    label: "chains monitored around the clock",
  },
  {
    eyebrow: "SCAN THROUGHPUT",
    value: "10k+",
    label: "contracts analyzed every hour",
  },
  {
    eyebrow: "FINDING ACCURACY",
    value: "98.2%",
    label: "precision across 500+ static rules",
  },
];

const MODULES = [
  {
    eyebrow: "AXIOM SCAN",
    title: "Scan before you ship.",
    body: "Paste a file, point at a repo, or drop a deployed address. Static rules, a Z3 symbolic solver and a security-tuned LLM cross-check every finding — verdicts in seconds, not weeks.",
    cta: "Run a free scan",
    href: "/dashboard/scans",
  },
  {
    eyebrow: "AXIOM MONITOR",
    title: "Watch what's live.",
    body: "Deployed contracts are watched around the clock across six chains. Exploit attempts, governance anomalies and oracle drift trigger alerts in under a second.",
    cta: "See monitoring",
    href: "/dashboard/monitoring",
  },
  {
    eyebrow: "AXIOM SCORE",
    title: "Grade any contract.",
    body: "One API call returns an A–F risk grade with contributing factors: exploit probability, liquidity risk, governance centralization and upgradeability.",
    cta: "Open the API console",
    href: "/dashboard/api-console",
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

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const els = revealRef.current?.querySelectorAll("[data-reveal]");
    if (!els?.length) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
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
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="ex-root min-h-screen" ref={revealRef}>
      {/* ── NAV — flat paper bar, no shadow, no border ── */}
      <header className="sticky top-0 z-50 bg-[var(--color-ex-paper)]">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-[var(--color-ex-obsidian)]">
              <span className="block h-2.5 w-2.5 rounded-[1px] border border-[var(--color-ex-mint)]" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-ex-obsidian)]">
              AuditAI
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm tracking-[-0.01em] text-[var(--color-ex-obsidian)] transition-colors hover:text-[var(--color-ex-graphite)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="ex-press rounded-[2px] border border-[var(--color-ex-obsidian)] px-4 py-2.5 text-sm text-[var(--color-ex-obsidian)] hover:bg-[var(--color-term-dim)]"
            >
              Log in
            </Link>
            <Link
              href="/book-demo"
              className="ex-press rounded-[2px] bg-[var(--color-ex-obsidian)] px-4 py-2.5 text-sm text-[var(--color-ex-paper)] hover:bg-black"
            >
              Request a Demo
            </Link>
          </div>

          <button
            className="rounded-[2px] border border-[var(--color-ex-ash)] p-2 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[var(--color-ex-ash)] bg-white px-6 py-4 md:hidden">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block py-2 text-sm text-[var(--color-ex-obsidian)]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex gap-3">
              <Link
                href="/auth/login"
                className="flex-1 rounded-[2px] border border-[var(--color-ex-obsidian)] px-4 py-2.5 text-center text-sm"
              >
                Log in
              </Link>
              <Link
                href="/book-demo"
                className="flex-1 rounded-[2px] bg-[var(--color-ex-obsidian)] px-4 py-2.5 text-center text-sm text-white"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── DARK HERO — obsidian canvas, wireframe geometry bleeding right ── */}
        <section className="relative overflow-hidden bg-[var(--color-ex-obsidian)]">
          <div className="mx-auto grid min-h-[640px] max-w-[1200px] items-center gap-8 px-6 py-24 lg:grid-cols-[minmax(0,560px)_1fr]">
            <div>
              <p
                data-reveal
                className="ex-eyebrow text-[var(--color-ex-mint)]"
              >
                Automate security, your way
              </p>
              <h1
                data-reveal
                className="ex-display ex-display-light mt-6 text-[44px] text-[var(--color-ex-paper)] sm:text-[64px] lg:text-[76px] lg:tracking-[-0.05em]"
                style={{ transitionDelay: "80ms" }}
              >
                Security with
                <br />
                architectural
                <br />
                precision.
              </h1>
              <p
                data-reveal
                className="mt-7 max-w-[440px] text-[19px] leading-[1.5] tracking-[-0.02em] text-white/80"
                style={{ transitionDelay: "160ms" }}
              >
                AuditAI finds vulnerabilities before attackers do — static
                analysis, symbolic execution and AI reasoning, delivered in
                seconds.
              </p>
              <div
                data-reveal
                className="mt-9 flex flex-wrap gap-3"
                style={{ transitionDelay: "240ms" }}
              >
                <Link
                  href="/dashboard/scans"
                  className="ex-press rounded-[2px] bg-[var(--color-ex-paper)] px-5 py-3 text-sm font-medium text-[var(--color-ex-obsidian)] hover:bg-[var(--color-ex-mint)]"
                >
                  Scan a contract free
                </Link>
                <Link
                  href="/docs"
                  className="ex-press rounded-[2px] border border-white/50 px-5 py-3 text-sm font-medium text-[var(--color-ex-paper)] hover:border-white"
                >
                  Read the docs
                </Link>
              </div>
            </div>

            {/* Wireframe cubes bleed off the right edge */}
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block">
              <WireCubes className="h-full w-full" variant="mint" />
            </div>
          </div>
        </section>

        {/* ── PROOF STRIP — mono eyebrow + quiet metrics on white ── */}
        <section className="bg-[var(--color-ex-paper)]">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-px bg-[var(--color-ex-ash)] md:grid-cols-4">
            {[
              ["0.4s", "TO VERDICT"],
              ["500+", "STATIC RULES"],
              ["6", "CHAINS WATCHED"],
              ["24/7", "MONITORING"],
            ].map(([v, l]) => (
              <div
                key={l}
                data-reveal
                className="bg-[var(--color-ex-paper)] px-5 py-6"
              >
                <div className="font-[family-name:var(--font-display)] text-[26px] font-medium leading-none tracking-[-0.03em] text-[var(--color-ex-obsidian)]">
                  {v}
                </div>
                <div className="ex-eyebrow mt-2 text-[var(--color-ex-graphite)]">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MODULES — white canvas, eyebrow labels, editorial headings ── */}
        <section className="bg-[var(--color-ex-paper)] px-6 py-28">
          <div className="mx-auto max-w-[1200px]">
            <p data-reveal className="ex-eyebrow text-[var(--color-ex-graphite)]">
              One protocol, three instruments
            </p>
            <h2
              data-reveal
              className="ex-display mt-4 max-w-[640px] text-[38px] text-[var(--color-ex-obsidian)] sm:text-[52px] sm:tracking-[-0.04em]"
            >
              Everything between your code and the exploit.
            </h2>

            <div className="mt-16 grid gap-px border border-[var(--color-ex-ash)] bg-[var(--color-ex-ash)] md:grid-cols-3">
              {MODULES.map((m) => (
                <div
                  key={m.eyebrow}
                  data-reveal
                  className="bg-[var(--color-ex-paper)] p-7"
                >
                  <p className="ex-eyebrow text-[var(--color-ex-graphite)]">
                    {m.eyebrow}
                  </p>
                  <h3 className="ex-display mt-5 text-[28px] tracking-[-0.02em] text-[var(--color-ex-obsidian)]">
                    {m.title}
                  </h3>
                  <p className="mt-4 text-base leading-[1.5] tracking-[-0.02em] text-[var(--color-ex-graphite)]">
                    {m.body}
                  </p>
                  <Link
                    href={m.href}
                    className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ex-obsidian)] underline-offset-4 hover:underline"
                  >
                    {m.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEON MINT HIGHLIGHT BAND — white stat cards float on mint ── */}
        <section className="relative overflow-hidden bg-[var(--color-ex-mint)] px-6 py-24">
          {/* obsidian wireframe bleed, right edge */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] opacity-60 lg:block">
            <WireCubes className="h-full w-full" variant="obsidian" rows={2} />
          </div>
          <div className="relative mx-auto max-w-[1200px]">
            <p data-reveal className="ex-eyebrow text-[var(--color-ex-obsidian)]">
              Measured, not promised
            </p>
            <h2
              data-reveal
              className="ex-display mt-4 text-[38px] text-[var(--color-ex-obsidian)] sm:text-[52px] sm:tracking-[-0.04em]"
            >
              Numbers with your money on them.
            </h2>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.eyebrow}
                  data-reveal
                  className="rounded-[2px] bg-[var(--color-ex-paper)] p-6"
                >
                  <p className="ex-eyebrow text-[var(--color-ex-graphite)]">
                    {s.eyebrow}
                  </p>
                  <div className="ex-display ex-display-light mt-4 text-[52px] leading-none tracking-[-0.04em] text-[var(--color-ex-obsidian)] sm:text-[64px]">
                    {s.value}
                  </div>
                  <p className="mt-4 text-base tracking-[-0.02em] text-[var(--color-ex-graphite)]">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DARK INTERVAL — statement section (the two-mood rhythm) ── */}
        <section className="relative overflow-hidden bg-[var(--color-ex-obsidian)] px-6 py-28">
          <div className="mx-auto max-w-[1200px]">
            <p data-reveal className="ex-eyebrow text-[var(--color-ex-mint)]">
              The two-mood rhythm
            </p>
            <h2
              data-reveal
              className="ex-display ex-display-light mt-6 max-w-[720px] text-[36px] leading-[1.1] text-[var(--color-ex-paper)] sm:text-[52px] sm:tracking-[-0.04em]"
            >
              Most tools choose between depth and speed. We refuse the
              tradeoff — parallel engines give you both.
            </h2>
            <div
              data-reveal
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link
                href="/whitepaper"
                className="ex-press rounded-[2px] border border-white/50 px-5 py-3 text-sm font-medium text-white hover:border-white"
              >
                Read the whitepaper
              </Link>
              <Link
                href="/solvency"
                className="ex-press rounded-[2px] bg-[var(--color-ex-paper)] px-5 py-3 text-sm font-medium text-[var(--color-ex-obsidian)] hover:bg-[var(--color-ex-mint)]"
              >
                Verify solvency
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ — the divider line IS the component ── */}
        <section className="bg-[var(--color-ex-paper)] px-6 py-28">
          <div className="mx-auto max-w-[800px]">
            <p data-reveal className="ex-eyebrow text-[var(--color-ex-graphite)]">
              Common questions
            </p>
            <h2
              data-reveal
              className="ex-display mt-4 text-[38px] text-[var(--color-ex-obsidian)] sm:text-[52px] sm:tracking-[-0.04em]"
            >
              Asked, answered.
            </h2>

            <div className="mt-12 border-t border-[var(--color-ex-ash)]">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={i}
                    data-reveal
                    className="ex-row border-b border-[var(--color-ex-ash)]"
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    >
                      <span className="text-[19px] tracking-[-0.02em] text-[var(--color-ex-obsidian)]">
                        {f.q}
                      </span>
                      <span
                        className={`ex-mono shrink-0 text-xl leading-none transition-transform duration-300 ${
                          open
                            ? "rotate-45 text-[var(--color-ex-obsidian)]"
                            : "text-[var(--color-ex-graphite)]"
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
                        <p className="pb-6 pr-10 text-base leading-[1.5] tracking-[-0.02em] text-[var(--color-ex-graphite)]">
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

        {/* ── DARK CTA + FOOTER ── */}
        <section className="relative overflow-hidden bg-[var(--color-ex-obsidian)] px-6 py-24 text-center">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[30%] opacity-40 lg:block">
            <WireCubes className="h-full w-full" variant="mint" rows={2} />
          </div>
          <div className="relative mx-auto max-w-[640px]">
            <h2
              data-reveal
              className="ex-display ex-display-light text-[40px] text-[var(--color-ex-paper)] sm:text-[56px] sm:tracking-[-0.04em]"
            >
              Ship secure contracts.
            </h2>
            <p
              data-reveal
              className="mt-5 text-[19px] leading-[1.5] tracking-[-0.02em] text-white/80"
            >
              Run your first scan free — no credit card, no signup.
            </p>
            <div
              data-reveal
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                href="/auth/register"
                className="ex-press rounded-[2px] bg-[var(--color-ex-paper)] px-5 py-3 text-sm font-medium text-[var(--color-ex-obsidian)] hover:bg-[var(--color-ex-mint)]"
              >
                Start scanning <span aria-hidden>→</span>
              </Link>
              <Link
                href="/book-demo"
                className="ex-press rounded-[2px] border border-white/50 px-5 py-3 text-sm font-medium text-white hover:border-white"
              >
                Request a demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER — paper, flat, hairline above ── */}
      <footer className="border-t border-[var(--color-ex-ash)] bg-[var(--color-ex-paper)] px-6 pb-10 pt-14">
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-[var(--color-ex-obsidian)]">
                <span className="block h-2.5 w-2.5 rounded-[1px] border border-[var(--color-ex-mint)]" />
              </span>
              <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-ex-obsidian)]">
                AuditAI
              </span>
            </div>
            <p className="mt-4 max-w-[300px] text-sm leading-[1.5] tracking-[-0.01em] text-[var(--color-ex-graphite)]">
              AI-powered smart contract security. Static analysis, symbolic
              execution and continuous monitoring for the on-chain economy.
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
              <p className="ex-eyebrow text-[var(--color-ex-graphite)]">
                {col.head}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm tracking-[-0.01em] text-[var(--color-ex-obsidian)] transition-colors hover:text-[var(--color-ex-graphite)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="ex-mono mx-auto mt-12 flex max-w-[1200px] items-center justify-between border-t border-[var(--color-ex-ash)] pt-6 text-xs uppercase tracking-[0.06em] text-[var(--color-ex-graphite)]">
          <span>© 2026 AuditAI</span>
          <span className="hidden sm:inline">Security with architectural precision</span>
        </div>
      </footer>
    </div>
  );
}
