"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Content ─────────────────────────────────────────────── */

const NAV_LINKS = [
  ["Skills", "#skills"],
  ["Projects", "#projects"],
  ["Experience", "#experience"],
  ["Certifications", "#proof"],
  ["Docs", "/docs"],
] as const;

const HERO_BODY = [
  "Eleven trained agents scan your Solidity",
  "for exploits, fix the flagged lines, and",
  "hand back a patched file you can ship.",
];

const CODE_LINES = [
  ['> ', 'const securithm = {'],
  ['  ', 'scan', ':    ', "'Solidity'", ','],
  ['  ', 'fix', ':    ', "'Auto-patch'", ','],
  ['  ', 'watch', ':  ', "'6 chains'", ','],
  ['  ', 'prove', ':  ', "'Solvency'", ','],
  ['  ', 'passion', ': ', "'Solving problems'", ','],
  ['}', ';'],
];

const SKILLS = [
  ["SOL", "Solidity"],
  ["VYP", "Vyper"],
  ["RS", "Rust"],
  ["TS", "TypeScript"],
  ["NX", "Next.js"],
  ["SB", "Supabase"],
] as const;

const PROJECTS = [
  {
    title: "Agent Scans",
    desc: "Eleven rule agents sweep every line and grade the file A–F.",
    tags: ["11 agents", "line-level", "A–F grade"],
    href: "/dashboard/scans",
  },
  {
    title: "Auto-Fix Patches",
    desc: "Flagged lines are rewritten into a compilable fixed file.",
    tags: ["unified diff", "per-category", "download"],
    href: "/dashboard/scans",
  },
  {
    title: "Live Monitoring",
    desc: "Deployed contracts watched on six chains, alerts in <1s.",
    tags: ["6 chains", "24/7", "alerts"],
    href: "/dashboard/monitoring",
  },
];

const PROOFS = [
  { title: "PROOF OF RESERVES", sub: "Merkle attestations — live", href: "/solvency" },
  { title: "WHITEPAPER", sub: "Engine architecture — v2.6", href: "/whitepaper" },
  { title: "SOC 2", sub: "Controls & practices", href: "/soc2" },
];

const TIMELINE = [
  {
    role: "CLI 1.1",
    org: "NPM",
    dates: "2026 — NOW",
    lines: [
      "securithm on npm: scan, fix, login, sync.",
      "Five free scans, then one key unlocks all.",
    ],
  },
  {
    role: "AGENT ENGINE",
    org: "11 RULES",
    dates: "2026",
    lines: [
      "Every agent owns one vulnerability class",
      "and reports with a line-level signature.",
    ],
  },
  {
    role: "SOLVENCY SUITE",
    org: "MERKLE",
    dates: "2026",
    lines: [
      "Signed proof-of-reserves attestations",
      "with coverage thresholds and alerts.",
    ],
  },
];

/* ── Projects column: arrows, card and dots share one state ── */

function ProjectsColumn() {
  const [index, setIndex] = useState(0);
  const count = PROJECTS.length;
  const project = PROJECTS[index];

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`Featured projects — slide ${index + 1} of ${count}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
        if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      }}
      className="focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--lime)] focus-visible:outline-offset-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="nb-h2">WHAT WE SHIP</h2>
          <Link href="/features" className="nb-btn nb-btn--white mt-4">
            VIEW ALL PROJECTS →
          </Link>
        </div>
        <div className="flex gap-3">
          <button type="button" className="nb-arrow" aria-label="Previous project" onClick={prev}>
            ◀
          </button>
          <button type="button" className="nb-arrow" aria-label="Next project" onClick={next}>
            ▶
          </button>
        </div>
      </div>

      <div className="nb-card mt-8">
        <div className="nb-shot">
          <div className="nb-shot-inner nb-grid-bg flex items-center justify-center">
            <span className="nb-label">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="nb-pad">
          <h3 className="nb-h3">{project.title}</h3>
          <p className="nb-body mt-2 max-w-[52ch]">{project.desc}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="nb-chip">{t}</span>
            ))}
          </div>
          <Link href={project.href} className="nb-btn nb-btn--white mt-6">
            VIEW DETAILS →
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        {PROJECTS.map((_, i) => (
          <button
            key={i}
            type="button"
            className="nb-dot"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="nb-scope min-h-screen bg-[var(--paper)] p-5 max-[599px]:p-2">
      <div className="nb-frame">
        {/* ── BAND 1 — NAV ─────────────────────────────── */}
        <nav className="nb-band nb-nav" aria-label="Main">
          <Link href="/" className="nb-nav__cell">
            <span aria-hidden>&lt;/&gt;</span> SECURITHM
          </Link>
          <div className="nb-nav__mid">
            {NAV_LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="nb-nav__link">
                {label}
              </Link>
            ))}
          </div>
          <Link href="/dashboard/scans" className="nb-nav__cell nb-nav__cell--cta">
            SCAN FREE →
          </Link>
        </nav>

        {/* ── BAND 2 — HERO 55/45 ──────────────────────── */}
        <header className="nb-band" style={{ gridTemplateColumns: "55fr 45fr" }}>
          <div className="nb-grid-bg nb-pad flex flex-col justify-center">
            <div>
              <span className="nb-badge">
                HEY, WE&apos;RE SECURITHM <span aria-hidden>👋</span>
              </span>
            </div>
            <h1 className="nb-display nb-h1 mt-7">
              SHIP SECURE
              <br />
              SMART CONTRACTS
            </h1>
            <div className="mt-6 space-y-1">
              {HERO_BODY.map((line) => (
                <p key={line} className="nb-body max-w-[48ch]">{line}</p>
              ))}
            </div>
            <div className="nb-actions mt-8 flex flex-wrap gap-4">
              <Link href="/dashboard/scans" className="nb-btn nb-btn--lime">
                SCAN A CONTRACT ↗
              </Link>
              <Link href="/docs" className="nb-btn nb-btn--white">
                GET THE CLI ↓
              </Link>
            </div>
            <p className="nb-label mt-8">CONNECT WITH US</p>
            <div className="mt-3 flex gap-3">
              {[
                ["GitHub", "GH", "https://github.com/shivamprajapati17/securithm"],
                ["npm", "NP", "https://www.npmjs.com/package/securithm"],
                ["Docs", "DC", "/docs"],
                ["Email", "@", "mailto:hello@securithm.vercel.app"],
              ].map(([label, glyph, href]) => (
                <a
                  key={label}
                  href={href}
                  className="nb-iconbtn"
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                >
                  <span className="text-[12px] font-bold">{glyph}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="nb-hero-media relative flex items-center justify-center bg-[var(--pink)] p-10">
            {/* lime-framed "portrait": the product's terminal face */}
            <div className="nb-photoframe w-full max-w-[340px]">
              <div className="min-h-[320px] bg-[var(--ink)] p-4 font-mono text-[12px] leading-[1.7] text-white">
                <div className="text-[#8a8a8a]">$ securithm scan Vault.sol --fix</div>
                <div className="mt-2 text-[var(--pink)]">&gt; dispatching 11 agents...</div>
                <div className="text-[#8a8a8a]">  Reentrancy ... CRITICAL line 12</div>
                <div className="text-[#8a8a8a]">  AuthAgent ... HIGH line 31</div>
                <div className="mt-2 text-[var(--lime)]">  [OK] nonReentrant() guard</div>
                <div className="text-[var(--lime)]">  [OK] tx.origin -&gt; msg.sender</div>
                <div className="mt-2">  grade: C → A</div>
                <div className="text-[var(--lime)]">  → Vault_fixed.sol</div>
              </div>
            </div>
            {/* violet code card overlapping the frame's lower-right */}
            <div aria-hidden className="nb-codecard absolute bottom-6 right-4 max-w-[300px] md:-right-2">
              {CODE_LINES.map((parts, i) => (
                <div key={i} className="whitespace-pre">
                  {parts.map((p, j) => {
                    const cls = p.startsWith("'")
                      ? "tok-s"
                      : ["const", "scan", "fix", "watch", "prove", "passion", "securithm"].includes(p)
                        ? "tok-k"
                        : "tok-p";
                    return (
                      <span key={j} className={cls}>{p}</span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── BAND 3 — SKILLS STRIP ────────────────────── */}
        <section id="skills" className="nb-band" style={{ gridTemplateColumns: "12fr 88fr" }} aria-label="Skills">
          <div className="flex flex-col justify-center bg-[var(--violet)] p-5">
            <h2 className="nb-display text-[22px] text-white">SKILLS</h2>
            <span className="nb-display mt-1 text-[22px] text-white" aria-hidden>→</span>
          </div>
          <div className="nb-skills-row flex items-stretch justify-around divide-x-[3px] divide-[var(--ink)] max-[1199px]:flex-wrap">
            {SKILLS.map(([glyph, name]) => (
              <div key={name} className="nb-skill min-w-[110px] flex-1">
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center border-[3px] border-[var(--ink)] font-mono text-[11px] font-bold"
                >
                  {glyph}
                </span>
                <span className="nb-label">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── BAND 4 — PROJECTS 70 / CERTS 30 ──────────── */}
        <section id="projects" className="nb-band" style={{ gridTemplateColumns: "70fr 30fr" }}>
          <div className="nb-pad">
            <ProjectsColumn />
          </div>

          <div id="proof" className="flex flex-col bg-[var(--lime)] p-6">
            <h2 className="nb-h2">PROOF</h2>
            <div className="mt-5 flex flex-1 flex-col gap-4">
              {PROOFS.map((p) => (
                <Link key={p.title} href={p.href} className="nb-cert">
                  <span className="nb-h3 text-[15px]">{p.title}</span>
                  <span className="nb-label">{p.sub}</span>
                </Link>
              ))}
            </div>
            <Link href="/docs" className="nb-btn nb-btn--white mt-5">
              VIEW ALL DOCUMENTS →
            </Link>
          </div>
        </section>

        {/* ── BAND 5 — EXPERIENCE 20/50/30 + CTA ───────── */}
        <section id="experience" className="nb-band" style={{ gridTemplateColumns: "20fr 50fr 30fr" }}>
          <div className="relative flex flex-col justify-center bg-[var(--pink)] p-5">
            <h2 className="nb-display text-[24px] leading-[1.05]">TRACK<br />RECORD</h2>
            <span className="nb-display mt-2 text-[24px]" aria-hidden>→</span>
          </div>

          <div className="nb-pad">
            <ol className="nb-timeline">
              {TIMELINE.map((t) => (
                <li key={t.role}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="nb-label text-[12px]">
                      {t.role} • {t.org}
                    </p>
                    <p className="nb-label text-[11px]">{t.dates}</p>
                  </div>
                  {t.lines.map((l) => (
                    <p key={l} className="nb-body mt-1 max-w-[52ch]">{l}</p>
                  ))}
                </li>
              ))}
            </ol>
            <Link href="/docs" className="nb-btn nb-btn--white mt-2">
              READ FULL DOCS →
            </Link>
          </div>

          <div className="nb-grid-bg--violet relative overflow-hidden p-8">
            <h2 className="nb-display text-[clamp(26px,2.4vw,34px)] leading-[1.05] text-white">
              LET&apos;S BUILD
              <br />
              SOMETHING
              <br />
              SECURE
              <br />
              TOGETHER
            </h2>
            <Link href="/book-demo" className="nb-btn nb-btn--white mt-7">
              GET IN TOUCH →
            </Link>
            {/* the one decorative element: clipped pink starburst */}
            <Starburst className="absolute -bottom-8 -right-8 h-[90px] w-[90px] max-[599px]:h-[56px] max-[599px]:w-[56px]" />
          </div>
        </section>

        {/* ── BAND 6 — FOOTER (logo + copyright, no socials) ── */}
        <footer className="nb-band" style={{ gridTemplateColumns: "auto 1fr" }}>
          <Link href="/" className="nb-nav__cell">
            <span aria-hidden>&lt;/&gt;</span> SECURITHM
          </Link>
          <div className="flex min-h-[56px] items-center justify-center border-l-[3px] border-[var(--ink)] px-4 text-center">
            <p className="nb-label">© 2026 SECURITHM. ALL RIGHTS RESERVED.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ── 12-point starburst ──────────────────────────────────── */

function Starburst({ className }: { className?: string }) {
  const spikes = 12;
  const outer = 45;
  const inner = 20;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes;
    pts.push(`${(45 + r * Math.cos(a)).toFixed(1)},${(45 + r * Math.sin(a)).toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 90 90" className={className} aria-hidden focusable="false">
      <polygon
        points={pts.join(" ")}
        fill="var(--pink)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
    </svg>
  );
}
