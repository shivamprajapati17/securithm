"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";

const NAV = [
  ["Platform", "/features"],
  ["Agents", "#agents"],
  ["Docs", "/docs"],
  ["Pricing", "/pricing"],
  ["FAQ", "#faq"],
];

const MODULES = [
  {
    index: "01",
    code: "UNIT / AXIOM-SCAN",
    title: "Scan before you ship.",
    body: "Paste a file, point at a repo, or drop a deployed address. A family of trained security agents reads your contract line-by-line and returns severity-tagged findings in seconds.",
    cta: "Run a free scan",
    href: "/dashboard/scans",
  },
  {
    index: "02",
    code: "UNIT / AXIOM-FIX",
    title: "Fixes, not lectures.",
    body: "Every auto-fixable finding ships with a deterministic patch. Download the fully repaired .sol file, or a per-category unified diff you can apply in your repo.",
    cta: "See a fixed contract",
    href: "/dashboard/scans",
  },
  {
    index: "03",
    code: "UNIT / AXIOM-MONITOR",
    title: "Watch what's live.",
    body: "Deployed contracts are watched around the clock across six chains. Exploit attempts, governance anomalies and oracle drift trigger alerts in under a second.",
    cta: "Open monitoring",
    href: "/dashboard/monitoring",
  },
];

const AGENTS = [
  ["SENTINEL-01", "ReentrancyAgent", "critical", "auto-fix"],
  ["SENTINEL-02", "AuthAgent", "high", "auto-fix"],
  ["SENTINEL-03", "LifecycleAgent", "critical", "auto-fix"],
  ["SENTINEL-04", "ContextAgent", "high", "auto-fix"],
  ["SENTINEL-05", "ReturnValueAgent", "low", "auto-fix"],
  ["SENTINEL-06", "GasAgent", "low", "auto-fix"],
  ["SENTINEL-07", "TemporalAgent", "medium", "review"],
  ["SENTINEL-08", "EntropyAgent", "high", "review"],
  ["SENTINEL-09", "PrivilegeAgent", "high", "review"],
  ["SENTINEL-10", "ArithAgent", "medium", "auto-fix"],
  ["SENTINEL-11", "GovernanceAgent", "medium", "review"],
] as const;

const SEV_COLOR: Record<string, string> = {
  critical: "bg-[#e5484d]",
  high: "bg-[#e5a13d]",
  medium: "bg-[#d9b13f]",
  low: "bg-[#4b4d4b]",
};

const FAQS = [
  {
    q: "What exactly does the scanner read?",
    a: "Anything written in Solidity, Vyper or Rust/Anchor — a pasted file, a GitHub repo, or a live deployed address. Trained rule agents plus static analysis cross-check every finding before it reaches you.",
  },
  {
    q: "Do I need an account to run a scan?",
    a: "No. The first 5 scans are free and require no signup. Creating an account keeps your scan history private to your login, unlocks fix downloads, CI/CD integration and team seats.",
  },
  {
    q: "What happens after 5 free scans?",
    a: "The scanner asks you to pick a plan. Complete checkout — payment handled by Razorpay — and an API key is generated on the spot. Paste it into the CLI or use it on the site and scanning continues, unlimited.",
  },
  {
    q: "Can I download the fixed contract?",
    a: "Yes. After a scan completes you get the fully auto-fixed .sol file, a unified diff with every applied fix, and a per-category patch for each individual finding.",
  },
  {
    q: "Can it gate my CI/CD pipeline?",
    a: "Yes. The GitHub Action scans every push and pull request, posts inline comments on findings, and fails the build above your configured severity threshold.",
  },
];

const SCAN_CMD = "securithm scan VulnerableVault.sol";

const OUTPUT_LINES: Array<{ cls: string; text: string }> = [
  { cls: "tok-key", text: "> dispatching 11 agents..." },
  { cls: "tok-com", text: "  SENTINEL-01 ReentrancyAgent ... CRITICAL line 12" },
  { cls: "tok-com", text: "  SENTINEL-02 AuthAgent      ... HIGH     line 31" },
  { cls: "tok-com", text: "  SENTINEL-06 GasAgent       ... LOW      line 48" },
  { cls: "tok-key", text: "> applying safe fixes..." },
  { cls: "tok-str", text: "  [OK] nonReentrant() guard inserted" },
  { cls: "tok-str", text: "  [OK] tx.origin -> msg.sender" },
  { cls: "tok-str", text: "  [OK] loop bounded by MAX_BATCH" },
  { cls: "tok-fn", text: "  grade: C -> A   ready: VulnerableVault_fixed.sol" },
];

const MARQUEE_ITEMS = [
  "ReentrancyAgent",
  "AuthAgent",
  "LifecycleAgent",
  "ContextAgent",
  "ReturnValueAgent",
  "GasAgent",
  "TemporalAgent",
  "EntropyAgent",
  "PrivilegeAgent",
  "ArithAgent",
  "GovernanceAgent",
];

/** Looping typewriter: types the scan command, streams agent output, restarts. */
function useTerminalLoop(): { reduced: boolean; chars: number; lines: number } {
  const [reduced, setReduced] = useState(false);
  const [chars, setChars] = useState(0);
  const [lines, setLines] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    let t: ReturnType<typeof setTimeout> | undefined;
    if (chars < SCAN_CMD.length) {
      t = setTimeout(() => setChars((c) => c + 1), 26 + Math.random() * 46);
    } else if (lines < OUTPUT_LINES.length) {
      t = setTimeout(() => setLines((l) => l + 1), lines === 0 ? 320 : 170 + Math.random() * 90);
    } else {
      t = setTimeout(() => {
        setChars(0);
        setLines(0);
      }, 3600);
    }
    return () => clearTimeout(t);
  }, [chars, lines]);

  return { reduced, chars, lines };
}

/** Count up to `target` once `start` flips true. Respects reduced motion. */
function useCountUp(target: number, start: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 950, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target]);
  return value;
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null!);
  const terminal = useTerminalLoop();
  const [metricsSeen, setMetricsSeen] = useState(false);
  const metricsRef = useRef<HTMLDivElement>(null!);
  const agentsCount = useCountUp(11, metricsSeen);
  const chainsCount = useCountUp(6, metricsSeen);

  useEffect(() => {
    const el = metricsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMetricsSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
              "opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1)";
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
    <div className="bx-root min-h-screen" ref={revealRef}>
      {/* ── TOP TELEMETRY BAR ── */}
      <div className="border-b border-[var(--bx-ash)] bg-[var(--bx-ink)] text-[#e8ebe8]">
        <div className="bx-container flex h-8 items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
          <span>Security operations / smart contracts</span>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="inline-block h-1.5 w-1.5 bg-[#e5484d]" />
            11 agents online
          </span>
        </div>
      </div>

      {/* ── NAV — hairline compartment, zero radius ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--bx-ash)] bg-[var(--bx-paper)]">
        <div className="bx-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center bg-[var(--bx-ink)]">
              <span className="block h-2.5 w-2.5 bg-[var(--bx-hazard)]" />
            </span>
            <span className="bx-macro text-[22px] leading-none">AuditAI</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="bx-label transition-colors hover:text-[var(--bx-hazard)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link href="/auth/login" className="bx-label hover:text-[var(--bx-hazard)]">
              Log in
            </Link>
            <Link href="/dashboard/scans" className="bx-cta !py-2.5 !text-[12px]">
              Scan free
            </Link>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center border border-[var(--bx-ink)] p-2 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="bx-container border-t border-[var(--bx-ash)] pb-5 pt-3 md:hidden">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block border-b border-[var(--bx-ash)] py-3 font-mono text-[13px] uppercase tracking-[0.1em]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-4 flex gap-3">
              <Link
                href="/auth/login"
                className="bx-cta bx-cta--ghost flex-1 justify-center"
              >
                Log in
              </Link>
              <Link href="/dashboard/scans" className="bx-cta flex-1 justify-center">
                Scan free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ══ HERO — blueprint grid, macro type, live telemetry ══ */}
        <section className="bx-grid-bg border-b border-[var(--bx-ash)]">
          <div className="bx-container pb-16 pt-14 text-center md:pb-24 md:pt-20">
            <div
              data-reveal
              className="mx-auto mb-8 inline-flex items-center gap-3 border border-[var(--bx-ash)] bg-[var(--bx-paper)] px-4 py-2"
            >
              <span className="inline-block h-2 w-2 bg-[var(--bx-hazard)]" />
              <span className="bx-label">Doc. SEC-2026 / 11 trained agents / rev 2.6</span>
            </div>

            <h1
              data-reveal
              className="bx-macro mx-auto max-w-[1150px] text-[clamp(52px,10.5vw,150px)]"
              style={{ transitionDelay: "60ms" }}
            >
              Ship secure
              <br />
              <span className="text-[var(--bx-hazard)]">contracts.</span>
            </h1>

            <p
              data-reveal
              className="mx-auto mt-8 max-w-[54ch] text-[16px] leading-[1.6] text-[var(--bx-muted)]"
              style={{ transitionDelay: "140ms" }}
            >
              We are a security operations unit for your code. Paste a contract
              and eleven trained agents sweep every line — real line numbers,
              severity-tagged findings, and a fixed file you download when the
              sweep is done.
            </p>

            <div
              data-reveal
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
              style={{ transitionDelay: "220ms" }}
            >
              <Link href="/dashboard/scans" className="bx-cta bx-cta--hazard">
                Scan a contract free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/docs" className="bx-cta bx-cta--ghost">
                Read the docs
              </Link>
            </div>

            {/* Telemetry terminal — obsidian phosphor frame */}
            <div
              data-reveal
              className="bx-brackets relative mx-auto mt-16 max-w-[680px]"
              style={{ transitionDelay: "300ms" }}
            >
              <div className="bx-terminal text-left">
                <div className="bx-terminal-head">
                  <span className="bx-sig" />
                  <span>securithm — agent run / live feed</span>
                </div>
                <div>
                  {"> "}
                  {terminal.reduced
                    ? SCAN_CMD
                    : SCAN_CMD.slice(0, terminal.chars)}
                  <span className="bx-caret">▌</span>
                </div>
                {(terminal.reduced
                  ? OUTPUT_LINES
                  : OUTPUT_LINES.slice(0, terminal.lines)
                ).map((l, i) => (
                  <div key={i} className={`${l.cls} bx-line-in`}>
                    {l.text || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ AGENT TAPE — telemetry parade ══ */}
        <div className="bx-marquee" aria-label="Security agents">
          <div className="bx-marquee__track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-12"
                aria-hidden={copy === 1}
              >
                {MARQUEE_ITEMS.map((name) => (
                  <span key={`${copy}-${name}`} className="bx-marquee__item">
                    <span className="bx-marquee__dot" />
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ══ PROOF STRIP — instrument readouts ══ */}
        <section className="bx-container" ref={metricsRef}>
          <div className="grid grid-cols-2 gap-px border border-[var(--bx-ash)] bg-[var(--bx-ash)] md:grid-cols-4">
            {[
              { v: "0.4s", l: "TO VERDICT" },
              { v: metricsSeen ? String(agentsCount) : "0", l: "TRAINED AGENTS" },
              { v: metricsSeen ? String(chainsCount) : "0", l: "CHAINS WATCHED" },
              { v: "24/7", l: "MONITORING" },
            ].map(({ v, l }, i) => (
              <div
                key={l}
                data-reveal
                className="bg-[var(--bx-paper)] p-6"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="bx-macro text-[44px] leading-none">{v}</div>
                <div className="bx-label mt-3">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ WHAT WE ARE — the operation, stated ══ */}
        <section className="bx-container pt-20 md:pt-28">
          <div className="bx-rule" />
          <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_1.4fr]">
            <div data-reveal>
              <p className="bx-label bx-label--hazard">[ What we are ]</p>
              <h2 className="bx-macro mt-5 text-[clamp(34px,4.5vw,56px)]">
                A security
                <br />
                operations
                <br />
                unit for
                <br />
                your code.
              </h2>
            </div>
            <div
              data-reveal
              className="grid content-start gap-px border border-[var(--bx-ash)] bg-[var(--bx-ash)] sm:grid-cols-2"
            >
              {[
                {
                  k: "DETECT",
                  v: "11 agents trained on single vulnerability classes, cross-checked by static analysis. No black box — every finding names its agent and its line.",
                },
                {
                  k: "REPAIR",
                  v: "Deterministic patches, not suggestions. Guards inserted, auth hardened, loops bounded — then handed back as a compilable file.",
                },
                {
                  k: "WATCH",
                  v: "Deployed contracts monitored on six chains. Exploit attempts, governance anomalies and oracle drift alerted in under a second.",
                },
                {
                  k: "PROVE",
                  v: "Proof-of-solvency attestations, signed reports and exportable audits — the paperwork your users and regulators ask for.",
                },
              ].map((b, i) => (
                <div
                  key={b.k}
                  data-reveal
                  className="bx-panel bx-panel--shift p-6"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="bx-macro text-[18px]">{b.k}</span>
                    <span className="bx-label">0{i + 1}</span>
                  </div>
                  <p className="mt-4 text-[14px] leading-[1.6] text-[var(--bx-muted)]">
                    {b.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MODULES — instrument compartments ══ */}
        <section className="bx-container py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p data-reveal className="bx-label bx-label--hazard">
                [ Delivery systems ]
              </p>
              <h2
                data-reveal
                className="bx-macro mt-5 max-w-[820px] text-[clamp(38px,6vw,72px)]"
              >
                Everything between
                <br />
                your code and the exploit.
              </h2>
            </div>
            <div data-reveal className="bx-barcode hidden w-40 md:block" aria-hidden />
          </div>

          <div className="mt-14 grid gap-px border border-[var(--bx-ash)] bg-[var(--bx-ash)] md:grid-cols-3">
            {MODULES.map((m, i) => (
              <div
                key={m.code}
                data-reveal
                className="bx-panel bx-panel--dim bx-panel--shift group flex flex-col p-7"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="bx-index text-[72px]">{m.index}</span>
                  <span className="bx-label">{m.code}</span>
                </div>
                <h3 className="bx-macro mt-6 text-[26px] leading-[1.02]">
                  {m.title}
                </h3>
                <p className="mt-4 flex-1 text-[14px] leading-[1.6] text-[var(--bx-muted)]">
                  {m.body}
                </p>
                <Link
                  href={m.href}
                  className="mt-7 inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.06em] text-[var(--bx-ink)] underline decoration-[var(--bx-ash)] underline-offset-4 transition-colors group-hover:text-[var(--bx-hazard)] group-hover:decoration-[var(--bx-hazard)]"
                >
                  {m.cta} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ══ AGENTS — the roster, ink panel ══ */}
        <section id="agents" className="bx-container pb-20 md:pb-28">
          <div className="bx-panel bx-panel--ink">
            <div className="grid gap-10 p-7 md:p-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p data-reveal className="bx-label !text-[#7b837b]">
                  [ The roster ]
                </p>
                <h2
                  data-reveal
                  className="bx-macro mt-5 text-[clamp(32px,4.5vw,52px)] !text-[#e8ebe8]"
                >
                  Meet the agents
                  <br />
                  on your side.
                </h2>
                <p
                  data-reveal
                  className="mt-6 max-w-[46ch] text-[14px] leading-[1.7] text-[#a8b0a8]"
                >
                  Each agent is trained on one vulnerability class and reports
                  with its own signature. Auto-fix agents patch the line they
                  flagged; review agents leave annotated guidance for your team.
                </p>

                <div data-reveal className="mt-8 border-t border-[#3a3f3a]">
                  {[
                    ["AUTO-FIX", "patches the flagged line, deterministically"],
                    ["REVIEW", "annotates severity + remediation guidance"],
                    ["OUTPUT", ".sol file / unified patch / per-category diff"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-4 border-b border-[#3a3f3a] py-3"
                    >
                      <span className="font-mono text-[12px] tracking-[0.1em] text-[#90fc95]">
                        {k}
                      </span>
                      <span className="text-right text-[12px] text-[#a8b0a8]">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                data-reveal
                className="grid content-start gap-px border border-[#3a3f3a] bg-[#3a3f3a] sm:grid-cols-2"
              >
                {AGENTS.map(([id, name, sev, mode]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between bg-[var(--bx-ink)] px-4 py-3 transition-colors hover:bg-[#262a26]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[13px] font-medium leading-tight text-[#e8ebe8]">
                        {name}
                      </div>
                      <div className="font-mono text-[10px] tracking-[0.1em] text-[#7b837b]">
                        {id}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`h-2 w-2 ${SEV_COLOR[sev]}`}
                        aria-label={sev}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#7b837b]">
                        {mode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ THE LOOP — 01 scan / 02 fix / 03 download ══ */}
        <section className="bx-container pb-20 md:pb-28">
          <div className="bx-rule bx-rule--hazard" />
          <div className="pt-10">
            <p data-reveal className="bx-label bx-label--hazard">
              [ Operating procedure ]
            </p>
            <h2
              data-reveal
              className="bx-macro mt-5 text-[clamp(38px,6vw,72px)]"
            >
              Scan. Fix. Download.
            </h2>
          </div>
          <div className="mt-12 grid gap-px border border-[var(--bx-ash)] bg-[var(--bx-ash)] md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Scan",
                b: "Paste your contract or point at a repo. Eleven agents sweep every line and grade the file A–F.",
              },
              {
                n: "02",
                t: "Fix",
                b: "Auto-fix agents rewrite the flagged lines: guards inserted, auth hardened, loops bounded.",
              },
              {
                n: "03",
                t: "Download",
                b: "Take the repaired .sol, the full unified patch, or a per-category diff — straight from the scan page.",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                data-reveal
                className="bx-panel bx-panel--shift p-7"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="bx-macro text-[56px] leading-none text-[var(--bx-hazard)]">
                  {s.n}
                </div>
                <h3 className="bx-macro mt-5 text-[24px]">{s.t}</h3>
                <p className="mt-3 text-[14px] leading-[1.6] text-[var(--bx-muted)]">
                  {s.b}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ CLI — three lines to onboard ══ */}
        <section className="bx-container pb-20 md:pb-28">
          <div className="bx-panel grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="border-b border-[var(--bx-ash)] p-7 md:border-b-0 md:border-r md:p-10">
              <p data-reveal className="bx-label bx-label--hazard">
                [ Terminal access ]
              </p>
              <h2
                data-reveal
                className="bx-macro mt-5 text-[clamp(32px,4.5vw,52px)]"
              >
                Your pipeline,
                <br />
                hardened.
              </h2>
              <p
                data-reveal
                className="mt-6 max-w-[44ch] text-[14px] leading-[1.7] text-[var(--bx-muted)]"
              >
                The CLI runs the same eleven agents from your terminal. Five
                free scans, no account. After that, one API key — generated at
                checkout — unlocks unlimited runs and dashboard sync.
              </p>
              <div data-reveal className="mt-8">
                <Link href="/pricing" className="bx-cta bx-cta--ghost">
                  Get an API key <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div data-reveal className="bx-terminal !min-h-0 md:!min-h-full">
              <div className="space-y-2">
                <div className="text-[#7b837b]"># install</div>
                <div>
                  <span className="text-[#90fc95]">$</span> npm install -g securithm
                </div>
                <div className="pt-2 text-[#7b837b]"># scan + fix</div>
                <div>
                  <span className="text-[#90fc95]">$</span> securithm scan Vault.sol --fix
                </div>
                <div className="pt-2 text-[#7b837b]"># unlimited + sync</div>
                <div>
                  <span className="text-[#90fc95]">$</span> securithm login
                </div>
                <div className="pl-4 text-[#a8b0a8]">
                  paste key from dashboard — done.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FAQ — ruled rows on the canvas ══ */}
        <section id="faq" className="bx-container pb-20 md:pb-28">
          <div className="mx-auto max-w-[860px]">
            <p data-reveal className="bx-label bx-label--hazard">
              [ Common questions ]
            </p>
            <h2
              data-reveal
              className="bx-macro mt-5 text-[clamp(38px,6vw,64px)]"
            >
              Asked, answered.
            </h2>

            <div className="mt-12 border-t-2 border-[var(--bx-ink)]">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={i}
                    data-reveal
                    className="border-b border-[var(--bx-ash)]"
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="font-mono text-[11px] tracking-[0.1em] text-[var(--bx-muted)]">
                          Q{String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[16px] font-medium text-[var(--bx-ink)]">
                          {f.q}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-xl leading-none transition-transform duration-300 ${
                          open ? "rotate-45 text-[var(--bx-hazard)]" : "text-[var(--bx-muted)]"
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
                        <p className="pb-6 pl-10 pr-10 text-[14px] leading-[1.7] text-[var(--bx-muted)]">
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

        {/* ══ CTA — hazard statement ══ */}
        <section className="bx-container pb-24 text-center">
          <div className="bx-stripes mb-14" aria-hidden />
          <h2
            data-reveal
            className="bx-macro mx-auto max-w-[950px] text-[clamp(44px,8vw,110px)]"
          >
            Run your first
            <br />
            scan free.
          </h2>
          <div
            data-reveal
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/auth/register" className="bx-cta bx-cta--hazard">
              Start scanning <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/book-demo" className="bx-cta bx-cta--ghost">
              Request a demo
            </Link>
          </div>
        </section>
      </main>

      {/* ══ FOOTER — ruled compartments, barcode strip ══ */}
      <footer className="border-t-2 border-[var(--bx-ink)]">
        <div className="bx-container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center bg-[var(--bx-ink)]">
                <span className="block h-2.5 w-2.5 bg-[var(--bx-hazard)]" />
              </span>
              <span className="bx-macro text-[22px] leading-none">AuditAI</span>
            </div>
            <p className="mt-5 max-w-[320px] text-[13px] leading-[1.7] text-[var(--bx-muted)]">
              AI-powered smart contract security. Trained agents, deterministic
              fixes and continuous monitoring for the on-chain economy.
            </p>
            <div className="bx-barcode mt-6 w-32" aria-hidden />
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
              <p className="bx-label">{col.head}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="bx-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--bx-ash)]">
          <div className="bx-container flex items-center justify-between py-5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--bx-muted)]">
            <span>© 2026 AuditAI / Security operations</span>
            <span className="hidden sm:inline">Doc. SEC-2026 / rev 2.6</span>
          </div>
        </div>
      </footer>

      {/* Floating edge tab — square, mechanical */}
      <div
        className="fixed right-0 top-[42%] z-50 hidden h-20 w-3 flex-col items-center justify-center gap-1 bg-[var(--bx-ink)] md:flex"
        aria-hidden
      >
        <span className="h-1 w-1 bg-[var(--bx-hazard)]" />
        <span className="h-1 w-1 bg-[#e8ebe8]" />
        <span className="h-1 w-1 bg-[#e8ebe8]" />
      </div>
    </div>
  );
}
