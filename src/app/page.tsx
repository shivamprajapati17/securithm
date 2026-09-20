"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PiIcon } from "@/components/pi-icon";

const NAV = [
  ["Platform", "/features"],
  ["Agents", "#agents"],
  ["Docs", "/docs"],
  ["Pricing", "/pricing"],
  ["FAQ", "#faq"],
];

const MODULES = [
  {
    eyebrow: "AXIOM SCAN",
    title: "Scan before you ship.",
    body: "Paste a file, point at a repo, or drop a deployed address. A family of trained security agents reads your contract line-by-line and returns severity-tagged findings in seconds.",
    cta: "Run a free scan",
    href: "/dashboard/scans",
    wash: "mm-card--lime",
    burst: "top-6 -right-3 h-16 w-24",
  },
  {
    eyebrow: "AXIOM FIX",
    title: "Fixes, not lectures.",
    body: "Every auto-fixable finding ships with a deterministic patch. Download the fully repaired .sol file, or a per-category unified diff you can apply in your repo.",
    cta: "See a fixed contract",
    href: "/dashboard/scans",
    wash: "mm-card--lilac",
    burst: "bottom-6 -left-3 h-12 w-20",
  },
  {
    eyebrow: "AXIOM MONITOR",
    title: "Watch what's live.",
    body: "Deployed contracts are watched around the clock across six chains. Exploit attempts, governance anomalies and oracle drift trigger alerts in under a second.",
    cta: "Open monitoring",
    href: "/dashboard/monitoring",
    wash: "mm-card--apricot",
    burst: "top-10 -right-4 h-14 w-14 rounded-full",
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
  low: "bg-[#89b0ff]",
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
              "opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)";
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
    <div className="mm-root min-h-screen" ref={revealRef}>
      {/* Ambient light — fixed layer behind everything */}
      <div className="mm-ambient" aria-hidden />

      {/* ── Top telemetry strip — quiet meta line on the canvas ── */}
      <div className="relative z-10 border-b border-[var(--color-hairline)]">
        <div className="mm-container flex h-9 items-center justify-between">
          <span className="mm-label">SEC-2026 / CONTRACT SECURITY OPERATIONS</span>
          <span className="mm-label mm-label--violet hidden sm:inline">
            11 AGENTS ONLINE
          </span>
        </div>
      </div>

      {/* ── NAV — flat transparent bar on the cream canvas ── */}
      <header className="sticky top-0 z-50">
        <div className="mm-container flex h-[72px] items-center justify-between">            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border-2 border-[var(--nb-ink)] bg-[var(--color-acid-lime)] shadow-[2px_2px_0_var(--nb-ink)]">
                <PiIcon name="shield-check" size={15} className="text-[var(--color-deep-violet)]" />
              </span>
            <span className="mm-display text-[26px] leading-none">
              AuditAI
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-[15px] font-medium text-[var(--color-slate)] transition-colors hover:text-[var(--color-deep-violet)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="mm-link">
              Log in
            </Link>
            <Link href="/dashboard/scans" className="mm-cta">
              Scan free
            </Link>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-[8px] border-2 border-[var(--nb-ink)] bg-[var(--color-pure-white)] p-2 shadow-[2px_2px_0_var(--nb-ink)] md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <PiIcon name="x" size={16} />
            ) : (
              <PiIcon name="list" size={16} />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="mm-container pb-4 md:hidden">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block py-2 text-[15px] font-medium text-[var(--color-slate)]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex gap-3">
              <Link
                href="/auth/login"
                className="mm-cta mm-cta--light flex-1 justify-center"
              >
                Log in
              </Link>
              <Link href="/dashboard/scans" className="mm-cta flex-1 justify-center">
                Scan free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* ── HERO — the headline IS the hero ── */}
        <section className="mm-container pb-20 pt-12 text-center md:pb-28 md:pt-20">
          <div
            data-reveal
            className="mm-eyebrow"
          >
            <span className="block h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--nb-ink)] bg-[var(--color-acid-lime)]" />
            DOC. SEC-2026 / 11 TRAINED AGENTS / REV 2.6
          </div>

          <h1
            data-reveal
            className="mm-display mx-auto mt-6 max-w-[1100px] text-[clamp(56px,11vw,158px)]"
            style={{ transitionDelay: "80ms" }}
          >
            Ship{" "}
            <span className="mm-serif text-[0.96em]">secure</span>
            <br />
            contracts.
          </h1>
          <p
            data-reveal
            className="mx-auto mt-7 max-w-[52ch] text-[17px] leading-[1.6] text-[var(--color-slate)]"
            style={{ transitionDelay: "160ms" }}
          >
            We are a security operations unit for your code. Paste a contract
            and eleven trained agents sweep every line — real line numbers,
            severity-tagged findings, and a fixed file you download when the
            sweep is done.
          </p>
          <div
            data-reveal
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ transitionDelay: "240ms" }}
          >
            <Link href="/dashboard/scans" className="mm-cta">
              Scan a contract free <PiIcon name="arrow-right" size={15} />
            </Link>
            <Link href="/docs" className="mm-cta mm-cta--light">
              Read the docs
            </Link>
          </div>

          {/* Product mock — faux-OS window chrome over the warm canvas */}
          <div
            data-reveal
            className="mm-brackets relative mx-auto mt-16 max-w-[640px]"
            style={{ transitionDelay: "320ms" }}
          >
            {/* purple fragments breaking out of the frame */}
            <span className="mm-burst -left-4 top-10 h-20 w-6" aria-hidden />
            <span className="mm-burst -right-6 bottom-14 h-6 w-24" aria-hidden />
            <div className="mm-terminal text-left">
              <div className="mm-terminal-head">
                <span style={{ background: "#e5484d" }} />
                <span style={{ background: "#e5a13d" }} />
                <span style={{ background: "#baf24a" }} />
                <span className="mm-terminal-title">securithm — agent run</span>
              </div>
              <div className="mm-terminal-body">
                <div>
                  {"> "}
                  {terminal.reduced
                    ? SCAN_CMD
                    : SCAN_CMD.slice(0, terminal.chars)}
                  <span className="mm-caret">▌</span>
                </div>
                {(terminal.reduced
                  ? OUTPUT_LINES
                  : OUTPUT_LINES.slice(0, terminal.lines)
                ).map((l, i) => (
                  <div key={i} className={`${l.cls} mm-line-in`}>
                    {l.text || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── AGENT MARQUEE — the roster on parade ── */}
        <div className="mm-marquee" aria-label="Security agents">
          <div className="mm-marquee__track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-10"
                aria-hidden={copy === 1}
              >
                {MARQUEE_ITEMS.map((name) => (
                  <span key={`${copy}-${name}`} className="mm-marquee__item">
                    <span className="mm-marquee__dot" />
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── PROOF STRIP — quiet metrics on the canvas ── */}
        <section className="mm-container pt-16 md:pt-20" ref={metricsRef}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { v: "0.4s", l: "TO VERDICT" },
              { v: metricsSeen ? String(agentsCount) : "0", l: "TRAINED AGENTS" },
              { v: metricsSeen ? String(chainsCount) : "0", l: "CHAINS WATCHED" },
              { v: "24/7", l: "MONITORING" },
            ].map(({ v, l }, i) => (
              <div
                key={l}
                data-reveal
                className="mm-card bg-[var(--color-pure-white)] p-6"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mm-display text-[40px] leading-none">{v}</div>
                <div className="mm-label mt-3">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHAT WE ARE — the operation, stated ── */}
        <section className="mm-container py-24 md:py-32">
          <p data-reveal className="mm-label mm-label--violet">
            [ WHAT WE ARE ]
          </p>
          <h2
            data-reveal
            className="mm-display mt-4 max-w-[900px] text-[clamp(40px,6vw,75px)]"
          >
            A security operations{" "}
            <span className="mm-serif text-[0.96em]">unit</span>
            <br />
            for your code.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              {
                k: "DETECT",
                v: "11 agents trained on single vulnerability classes, cross-checked by static analysis. No black box — every finding names its agent and its line.",
                wash: "mm-card--lime",
              },
              {
                k: "REPAIR",
                v: "Deterministic patches, not suggestions. Guards inserted, auth hardened, loops bounded — then handed back as a compilable file.",
                wash: "mm-card--lilac",
              },
              {
                k: "WATCH",
                v: "Deployed contracts monitored on six chains. Exploit attempts, governance anomalies and oracle drift alerted in under a second.",
                wash: "mm-card--sky",
              },
              {
                k: "PROVE",
                v: "Proof-of-solvency attestations, signed reports and exportable audits — the paperwork your users and regulators ask for.",
                wash: "mm-card--apricot",
              },
            ].map((b, i) => (
              <div
                key={b.k}
                data-reveal
                className={`mm-card ${b.wash} p-7`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-baseline justify-between">
                  <span className="mm-display text-[26px] leading-none">{b.k}</span>
                  <span className="mm-badge">0{i + 1}</span>
                </div>
                <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.6] text-[var(--color-ink-black)]">
                  {b.v}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MODULES — accent wash rotation, one wash per card ── */}
        <section className="mm-container pb-24 md:pb-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p data-reveal className="mm-eyebrow">
                One protocol, three instruments
              </p>
              <h2
                data-reveal
                className="mm-display mt-4 max-w-[900px] text-[clamp(40px,6vw,75px)]"
              >
                Everything between
                <br />
                your code and{" "}
                <span className="mm-serif text-[0.96em]">the exploit.</span>
              </h2>
            </div>
            <div data-reveal className="mm-barcode hidden w-36 md:block" aria-hidden />
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {MODULES.map((m, i) => (
              <div
                key={m.eyebrow}
                data-reveal
                className={`mm-card ${m.wash}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className={`mm-burst ${m.burst}`} aria-hidden />
                <p className="mm-eyebrow">{m.eyebrow}</p>
                <h3 className="mm-display mt-5 text-[34px] leading-[1.05]">
                  {m.title}
                </h3>
                <p className="mt-4 text-[15px] leading-[1.6] text-[var(--color-ink-black)]">
                  {m.body}
                </p>
                <Link
                  href={m.href}
                  className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--color-deep-violet)] underline underline-offset-2"
                >
                  {m.cta} <PiIcon name="arrow-right" size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── AGENTS — the trained roster, sky wash section ── */}
        <section id="agents" className="mm-container pb-24 md:pb-32">
          <div className="mm-card mm-card--sky">
            <span
              className="mm-burst -top-3 left-10 h-6 w-28"
              aria-hidden
            />
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p data-reveal className="mm-eyebrow">
                  The roster
                </p>
                <h2
                  data-reveal
                  className="mm-display mt-4 text-[clamp(36px,5vw,48px)]"
                >
                  Meet the agents
                  <br />
                  on your side.
                </h2>
                <p
                  data-reveal
                  className="mt-5 max-w-[46ch] text-[15px] leading-[1.6]"
                >
                  Each agent is trained on one vulnerability class and reports
                  with its own signature. Auto-fix agents patch the line they
                  flagged; review agents leave annotated guidance for your team.
                </p>

                <div data-reveal className="mt-7 flex flex-wrap gap-3">
                  <span className="mm-badge bg-[var(--color-lime-wash)]">
                    <PiIcon name="wrench" size={12} /> auto-fix
                  </span>
                  <span className="mm-badge bg-[var(--color-lilac-haze)]">
                    <PiIcon name="robot" size={12} /> review
                  </span>
                  <span className="mm-badge bg-[var(--color-pure-white)]">
                    <PiIcon name="download-simple" size={12} /> .sol / .patch
                  </span>
                </div>
              </div>

              <div data-reveal className="grid gap-2 sm:grid-cols-2">
                {AGENTS.map(([id, name, sev, mode]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-[8px] border-[1.5px] border-[var(--nb-ink)] bg-[var(--color-pure-white)] px-3 py-2.5 shadow-[2px_2px_0_var(--nb-ink)]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold leading-tight">
                        {name}
                      </div>
                      <div className="text-[11px] text-[var(--color-slate)]">
                        {id}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${SEV_COLOR[sev]}`}
                        aria-label={sev}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-slate)]">
                        {mode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SCAN → FIX → DOWNLOAD — the loop, wash rotation ── */}
        <section className="mm-container pb-24 md:pb-32">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Scan",
                b: "Paste your contract or point at a repo. Eleven agents sweep every line and grade the file A–F.",
                wash: "mm-card--lime",
              },
              {
                n: "02",
                t: "Fix",
                b: "Auto-fix agents rewrite the flagged lines: guards inserted, auth hardened, loops bounded.",
                wash: "mm-card--lilac",
              },
              {
                n: "03",
                t: "Download",
                b: "Take the repaired .sol, the full unified patch, or a per-category diff — straight from the scan page.",
                wash: "mm-card--apricot",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                data-reveal
                className={`mm-card ${s.wash}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mm-display text-[64px] leading-none">{s.n}</div>
                <h3 className="mm-display mt-4 text-[30px]">{s.t}</h3>
                <p className="mt-3 text-[15px] leading-[1.6]">{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CLI — terminal access, dark mock on cream ── */}
        <section className="mm-container pb-24 md:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p data-reveal className="mm-label mm-label--violet">
                [ TERMINAL ACCESS ]
              </p>
              <h2
                data-reveal
                className="mm-display mt-4 text-[clamp(36px,5vw,56px)]"
              >
                Your pipeline,
                <br />
                <span className="mm-serif text-[0.96em]">hardened.</span>
              </h2>
              <p
                data-reveal
                className="mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-[var(--color-slate)]"
              >
                The CLI runs the same eleven agents from your terminal. Five
                free scans, no account. After that, one API key — generated at
                checkout — unlocks unlimited runs and dashboard sync.
              </p>
              <div data-reveal className="mt-7">
                <Link href="/pricing" className="mm-cta">
                  Get an API key <PiIcon name="key" size={15} />
                </Link>
              </div>
            </div>
            <div data-reveal className="mm-brackets relative">
              <div className="mm-terminal !min-h-0">
                <div className="mm-terminal-head">
                  <span style={{ background: "#e5484d" }} />
                  <span style={{ background: "#e5a13d" }} />
                  <span style={{ background: "#baf24a" }} />
                  <span className="mm-terminal-title">terminal — securithm</span>
                </div>
                <div className="mm-terminal-body space-y-2">
                  <div className="text-[#6b6b6b]"># install</div>
                  <div>
                    <span className="tok-key">$</span> npm install -g securithm
                  </div>
                  <div className="pt-2 text-[#6b6b6b]"># scan + fix</div>
                  <div>
                    <span className="tok-key">$</span> securithm scan Vault.sol --fix
                  </div>
                  <div className="pt-2 text-[#6b6b6b]"># unlimited + sync</div>
                  <div>
                    <span className="tok-key">$</span> securithm login
                  </div>
                  <div className="pl-4 text-[#89b0ff]">
                    paste key from dashboard — done.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ — borderless items, hairline dividers only ── */}
        <section id="faq" className="mm-container pb-24 md:pb-32">
          <div className="mx-auto max-w-4xl">
            <p data-reveal className="mm-eyebrow">
              Common questions
            </p>
            <h2
              data-reveal
              className="mm-display mt-4 text-[clamp(40px,6vw,75px)]"
            >
              Asked, <span className="mm-serif text-[0.96em]">answered.</span>
            </h2>

            <div className="mt-12 border-t border-[var(--color-hairline)]">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={i}
                    data-reveal
                    className="border-b border-[var(--color-hairline)]"
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    >
                      <span className="text-[17px] font-medium text-[var(--color-ink-black)]">
                        {f.q}
                      </span>
                      <span
                        className={`shrink-0 text-xl leading-none transition-transform duration-300 ${
                          open
                            ? "rotate-45 text-[var(--color-deep-violet)]"
                            : "text-[var(--color-slate)]"
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
                        <p className="pb-6 pr-10 text-[15px] leading-[1.6] text-[var(--color-slate)]">
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

        {/* ── CTA — violet display, ink block ── */}
        <section className="mm-container pb-28 text-center">
          <div className="mm-barcode mx-auto mb-12 w-40" aria-hidden />
          <h2
            data-reveal
            className="mm-display mx-auto max-w-[900px] text-[clamp(44px,7vw,127px)]"
          >
            Run your first
            <br />
            <span className="mm-serif text-[0.96em]">scan free.</span>
          </h2>
          <div
            data-reveal
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/auth/register" className="mm-cta">
              Start scanning <PiIcon name="arrow-right" size={15} />
            </Link>
            <Link href="/book-demo" className="mm-cta mm-cta--light">
              Request a demo
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER — directly on the canvas, no border plate ── */}
      <footer className="relative z-10 mm-container pb-12 pt-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border-2 border-[var(--nb-ink)] bg-[var(--color-acid-lime)] shadow-[2px_2px_0_var(--nb-ink)]">
                <PiIcon name="shield-check" size={15} className="text-[var(--color-deep-violet)]" />
              </span>
              <span className="mm-display text-[26px] leading-none">
                AuditAI
              </span>
            </div>
            <p className="mt-4 max-w-[300px] text-[14px] leading-[1.6] text-[var(--color-slate)]">
              AI-powered smart contract security. Trained agents, deterministic
              fixes and continuous monitoring for the on-chain economy.
            </p>
            <div className="mm-barcode mt-6 w-28" aria-hidden />
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
              <p className="mm-label">{col.head}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="mm-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-between text-[12px] uppercase tracking-[0.06em] text-[var(--color-slate)]">
          <span>© 2026 AuditAI</span>
          <span className="hidden sm:inline">Ship secure contracts</span>
        </div>
      </footer>

      {/* Floating right-edge widget */}
      <div className="mm-widget" aria-hidden>
        <span className="mm-widget-dot" />
        <span className="mm-widget-dot" />
        <span className="mm-widget-dot" />
      </div>
    </div>
  );
}
