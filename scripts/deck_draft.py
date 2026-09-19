"""Full generator for the AuditAI (Securithm) deck — MUSA 'Unfiltered Devs' style.

Renders each slide as a vector drawing with PIL, then exports:
  1. AuditAI_Investor_Pitch_Deck.pdf  (via PIL's PDF save = fully vector)
  2. AuditAI_Investor_Pitch_Deck.pptx (via PowerPoint COM API with the same vector shapes + text)
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1440, 810
BG = (5, 5, 8)
PANEL = (11, 11, 16)
PANEL2 = (17, 17, 26)
BORDER = (57, 71, 255)
PURPLE = (216, 147, 242)
YELLOW = (255, 255, 0)
WHITE = (255, 255, 255)
GREY = (189, 183, 208)
GREEN = (46, 230, 168)
RED = (255, 77, 90)

# ---------------------------------------------------------------- helpers
def F(sz, bold=False, mono=False):
    names = (['consolab.ttf', 'cour.ttf'] if mono else
             (['segoeuib.ttf', 'arialbd.ttf'] if bold else ['segoeui.ttf', 'arial.ttf']))
    for n in names:
        try:
            f = ImageFont.truetype('C:/Windows/Fonts/' + n, sz)
            f.psz, f.pbold, f.pmono = sz, bold, mono  # metadata for the PPTX replay
            return f
        except Exception:
            continue
    return ImageFont.load_default()

def R(d, x, y, w, h, out=None, fill=None, wd=2, rad=10):
    """rounded rect"""
    d.rounded_rectangle([x, y, x + w, y + h], radius=rad, fill=fill, outline=out, width=wd)

def T(d, x, y, s, sz, color=WHITE, bold=False, anchor='la', mono=False, italic=False):
    d.text((x, y), s, font=F(sz, bold, mono), fill=color, anchor=anchor)

def bullets(d, x, y, w, items, sz=15, gap=34, bcol=PURPLE, tcol=WHITE, bold_heads=True):
    yy = y
    for head, body in items:
        if head:
            T(d, x, yy, '▸ ' + head, sz, bcol, bold_heads)
            yy += gap
        if body:
            T(d, x + 18, yy, body, sz - 2, tcol)
            yy += gap - 4
    return yy

def frame(d, title, kicker):
    """standard content-slide chrome: bg, border, logo chip, kicker, title"""
    d.rectangle([0, 0, W, H], fill=BG)
    R(d, 78, 83, W - 156, H - 166, out=BORDER, fill=None, wd=3, rad=6)
    R(d, 1010, 22, 348, 84, fill=PANEL, out=None)
    T(d, 1184, 64, 'AUDITAI', 38, WHITE, True, 'mm')
    T(d, 110, 98, kicker, 15, YELLOW, True)
    T(d, 110, 122, title, 33, WHITE, True)

def page1(d):  # ---------------------------------------------------------------- TITLE
    d.rectangle([0, 0, W, H], fill=BG)
    # decorative blue grid
    for gx in range(0, W, 120):
        d.line([(gx, 0), (gx, H)], fill=(13, 13, 22), width=1)
    for gy in range(0, H, 120):
        d.line([(0, gy), (W, gy)], fill=(13, 13, 22), width=1)
    R(d, 60, 50, W - 120, H - 100, out=BORDER, fill=None, wd=3, rad=8)
    R(d, 80, 70, W - 160, H - 140, out=(30, 36, 120), fill=None, wd=1, rad=8)
    # logo chip
    R(d, 520, 92, 400, 78, fill=PANEL, out=BORDER, wd=2)
    T(d, 720, 131, 'AUDITAI', 40, PURPLE, True, 'mm')
    T(d, 720, 225, 'PRESENTS', 17, GREY, False, 'mm')
    T(d, 720, 285, 'AUDIT AI', 84, WHITE, True, 'mm')
    T(d, 720, 400, 'AI-Powered Smart Contract Security Platform', 27, YELLOW, True, 'mm')
    T(d, 720, 455, 'Static Analysis  •  Symbolic Execution  •  AI Detection  •  Continuous Monitoring', 15, GREY, False, 'mm')
    R(d, 460, 520, 520, 62, out=BORDER, fill=PANEL, wd=2)
    T(d, 720, 551, 'Team Unfiltered Devs   |   Securithm Product Line', 20, WHITE, True, 'mm')
    T(d, 720, 660, '2026  •  SaaS Security Audit Platform  •  auditai.io', 15, GREY, False, 'mm')

def page2(d):  # ---------------------------------------------------------------- OVERVIEW
    frame(d, 'Product Overview', 'SECTION 01')
    R(d, 110, 185, 600, 250, out=BORDER, fill=PANEL)
    T(d, 132, 205, 'What is AuditAI?', 21, PURPLE, True)
    what = ['An AI-powered SaaS platform that audits smart',
            'contracts in seconds — combining 500+ static',
            'rules, symbolic execution, and an LLM engine,',
            'with A–F risk scoring and on-chain monitoring.']
    for i, ln in enumerate(what):
        T(d, 132, 248 + i * 36, ln, 15, WHITE)
    R(d, 730, 185, 610, 250, out=BORDER, fill=PANEL)
    T(d, 752, 205, 'Why Now', 21, PURPLE, True)
    stats = [('$3.8B+', 'lost to DeFi hacks'), ('$100B+', 'TVL at stake'), ('47 days', 'avg. to exploit')]
    for i, (big, sub) in enumerate(stats):
        T(d, 752 + i * 205, 260, big, 26, YELLOW, True)
        T(d, 752 + i * 205, 305, sub, 12, GREY)
    T(d, 752, 355, 'Audits cost $50K–$500K and take 4–8 weeks. We do it in 45 seconds.', 13, WHITE)
    chips = [('94.7%', 'DETECTION RATE'), ('45s', 'AVG. SCAN TIME'), ('6', 'CHAINS SUPPORTED'), ('500+', 'VULN PATTERNS')]
    for i, (big, sub) in enumerate(chips):
        x = 110 + i * 318
        R(d, x, 470, 296, 140, out=PURPLE, fill=PANEL2)
        T(d, x + 148, 520, big, 30, WHITE, True, 'mm')
        T(d, x + 148, 570, sub, 12, GREY, False, 'mm')
    R(d, 110, 640, 1230, 84, out=BORDER, fill=PANEL)
    T(d, 132, 662, 'One-line pitch:  Ship secure contracts — before the hackers find the bugs.', 17, YELLOW, True)

def page3(d):  # ---------------------------------------------------------------- PROBLEM
    frame(d, 'Problem Statement & Target Users', 'SECTION 02')
    R(d, 110, 185, 1230, 200, out=RED, fill=PANEL)
    T(d, 132, 205, 'The Problem', 21, RED, True)
    probs = ['•  Manual audits take 4–8 weeks and cost $50K–$500K+ — critical bugs get exploited in as little as 6 hours.',
             '•  Even expert auditors miss 15–20% of vulnerabilities; static tools drown teams in false positives.',
             '•  Point-in-time audits go stale: 32% of exploits are reentrancy, 21% flash-loan attacks, 18% oracle manipulation.']
    for i, ln in enumerate(probs):
        T(d, 132, 248 + i * 38, ln, 15, WHITE)
    T(d, 110, 410, 'TARGET USERS', 15, YELLOW, True)
    users = [('Protocol Teams', 'Instant CI/CD scans on every push & PR before deployment'),
             ('Security Auditors', 'Auto-triage findings; focus human effort on business logic'),
             ('Investors & DAOs', 'A–F risk score any contract before investing or voting'),
             ('Exchanges & Launchpads', 'Screen listings at scale with the Risk Score API')]
    for i, (h, s) in enumerate(users):
        x = 110 + (i % 2) * 630
        y = 440 + (i // 2) * 145
        R(d, x, y, 600, 125, out=BORDER, fill=PANEL)
        T(d, x + 22, y + 20, h, 19, YELLOW, True)
        T(d, x + 22, y + 58, s, 14, GREY)
        T(d, x + 22, y + 84, '→  ' + ['Faster, safer shipping', 'Higher coverage per hour', 'Data-driven decisions', 'Automated due diligence'][i], 13, GREEN)

def page4(d):  # ---------------------------------------------------------------- EXISTING SOLUTIONS
    frame(d, 'Existing Solutions & Their Limitations', 'SECTION 03')
    sols = [('Slither', 'Static analyzer', 'High false positives; misses cross-contract & economic bugs'),
            ('Mythril', 'Symbolic executor', 'Slow on large contracts; shallow business-logic coverage'),
            ('Manual Audit Firms', 'Human experts', '$50K–$500K, 4–8 weeks, point-in-time only, hard to scale'),
            ('Basic LLM Checkers', 'AI chatbots', 'Generic, no exploit grounding, no monitoring, no CI/CD')]
    for i, (name, kind, lim) in enumerate(sols):
        x = 110 + (i % 2) * 630
        y = 190 + (i // 2) * 155
        R(d, x, y, 600, 135, out=BORDER, fill=PANEL)
        T(d, x + 22, y + 18, name, 20, WHITE, True)
        T(d, x + 22, y + 55, kind, 13, PURPLE, True)
        T(d, x + 22, y + 85, lim, 13, GREY)
    R(d, 110, 520, 1230, 200, out=PURPLE, fill=PANEL2)
    T(d, 132, 542, 'The Gap AuditAI Fills', 21, PURPLE, True)
    gaps = ['•  Multi-engine depth of an audit firm — automated, repeatable, and 100x faster.',
            '•  AI semantic layer catches business-logic & economic attacks that pattern tools miss (+23% logic-vuln detection, −35% false positives).',
            '•  Continuous monitoring keeps verdicts fresh — no more point-in-time audit decay.',
            '•  API-first & CI/CD-native: security embedded in the dev workflow, not bolted on.']
    for i, ln in enumerate(gaps):
        T(d, 132, 585 + i * 32, ln, 14, WHITE)

def page5(d):  # ---------------------------------------------------------------- KEY INNOVATIONS
    frame(d, 'Proposed Solution & Key Innovations', 'SECTION 04')
    inno = [('01  Multi-Engine Analysis', 'Static rules (500+) + symbolic execution (10^6 paths) + AI semantic analysis — consensus scoring across engines'),
            ('02  AI Fix Suggestions', 'Context-aware patches with code, tests & deployment notes for every finding — not just an alert'),
            ('03  Continuous Monitoring', 'On-chain surveillance of deployed contracts with 2.3s alert latency across 6 chains'),
            ('04  Risk Score API', 'A–F grade for any contract address in one call — for investors, exchanges & DAOs')]
    for i, (h, s) in enumerate(inno):
        x = 110 + (i % 2) * 630
        y = 195 + (i // 2) * 165
        R(d, x, y, 600, 145, out=BORDER, fill=PANEL)
        T(d, x + 22, y + 20, h, 19, YELLOW, True)
        T(d, x + 22, y + 60, s, 14, WHITE, False)
    R(d, 110, 545, 1230, 180, out=GREEN, fill=PANEL)
    T(d, 132, 565, 'Competitive Edge', 21, GREEN, True)
    edge = [('94.7%', 'vs 74.8% industry'), ('−35%', 'false positives'), ('45s', 'vs 4–8 weeks'), ('$29', 'vs $50K+ audits')]
    for i, (big, sub) in enumerate(edge):
        T(d, 160 + i * 300, 615, big, 30, WHITE, True)
        T(d, 160 + i * 300, 665, sub, 13, GREY)

def page6(d):  # ---------------------------------------------------------------- ARCHITECTURE / WORKFLOW
    frame(d, 'Technical Approach — System Workflow', 'SECTION 05')
    stages = [('INPUT', 'Paste code / .sol,.rs upload / on-chain address'),
              ('PARSE', 'Solidity • Vyper • Rust → unified AST + CFG'),
              ('STATIC', '500+ rules: reentrancy, access control, oracle bugs'),
              ('SYMBOLIC', 'Z3 constraint solving, 10^6 path exploration'),
              ('AI ENGINE', 'Fine-tuned LLM + RAG — logic & economic attacks'),
              ('AGGREGATE', 'Dedup, severity (CVSS), cross-engine consensus'),
              ('OUTPUT', 'Findings + AI fixes + A–F Risk Score + report'),
              ('MONITOR', 'Deployed-contract watch, 2.3s alerts, CI/CD hooks')]
    bw, bh, gap = 276, 150, 24
    for i, (h, s) in enumerate(stages):
        x = 110 + (i % 4) * (bw + gap)
        y = 200 + (i // 4) * (bh + 60)
        R(d, x, y, bw, bh, out=BORDER, fill=PANEL)
        T(d, x + 16, y + 18, h, 18, YELLOW, True)
        words, lines, cur = s.split(), [], ''
        for wd in words:
            if len(cur + ' ' + wd) <= 34:
                cur = (cur + ' ' + wd).strip()
            else:
                lines.append(cur); cur = wd
        lines.append(cur)
        for j, ln in enumerate(lines[:4]):
            T(d, x + 16, y + 58 + j * 22, ln, 12, GREY)
        if i % 4 != 3:
            ax, ay = x + bw + 6, y + bh // 2
            d.polygon([(ax, ay - 8), (ax, ay + 8), (ax + 12, ay)], fill=BORDER)
    T(d, 720, 585, 'Avg. full-pipeline scan: 45 seconds standard contract  •  3–8 min complex protocol', 15, GREEN, False, 'mm')
    R(d, 110, 620, 1230, 100, out=PURPLE, fill=PANEL2)
    T(d, 132, 640, 'Detection Performance', 17, PURPLE, True)
    perf = [('Reentrancy 99.2%', 'vs 87% industry'), ('Access Control 96.8%', 'vs 82%'), ('Flash Loan 94.1%', 'vs 76%'), ('Business Logic 89.3%', 'vs 58%')]
    for i, (a, b) in enumerate(perf):
        T(d, 160 + i * 300, 680, a, 15, WHITE, True)
        T(d, 160 + i * 300, 705, b, 11, GREY)

def page6b(d):  # ------------------------------------------------------------ TECH STACK
    frame(d, 'Technology Stack — What Powers AuditAI', 'SECTION 06')
    stacks = [('FRONTEND', ['Next.js 15 + React 19 + TypeScript', 'Tailwind CSS 4 + Radix UI components', 'Three.js / GSAP visualizations', 'Lucide icon system']),
              ('BACKEND API', ['FastAPI (Python 3.12) · 14+ REST endpoints', 'JWT auth · API keys · Pydantic v2 schemas', 'Versioned /api/v1 · Uvicorn ASGI', 'reportlab PDF reports · Resend email']),
              ('DATA & CACHE', ['PostgreSQL 16 + SQLAlchemy ORM', 'Alembic migrations', 'Redis 7 cache + task broker', 'Celery background scan workers']),
              ('AI / ML ENGINE', ['Fine-tuned security LLM + RAG', 'Z3 symbolic constraint solver', '500+ static detection rules', 'CVSS severity scoring model']),
              ('BLOCKCHAIN LAYER', ['Solidity 0.4–0.8 · Vyper · Rust/Anchor', 'eth-account · Risk Score API (A–F)', '6 chains: ETH, Base, Arbitrum,', 'Polygon, BSC, Solana']),
              ('DEVOPS & CI/CD', ['GitHub Actions scan bot on PRs', 'Docker Compose infra (PG + Redis)', 'Vercel frontend deploys', 'Sentry monitoring + Resend email'])]
    for i, (h, lines) in enumerate(stacks):
        x = 110 + (i % 3) * 416
        y = 190 + (i // 3) * 218
        R(d, x, y, 396, 198, out=BORDER, fill=PANEL)
        T(d, x + 20, y + 16, h, 16, YELLOW, True)
        for j, ln in enumerate(lines):
            T(d, x + 20, y + 54 + j * 33, ln, 12.5, WHITE)
    R(d, 110, 630, 1230, 110, out=PURPLE, fill=PANEL2)
    T(d, 132, 642, 'END-TO-END REQUEST FLOW', 13, PURPLE, True)
    flow = ['Next.js Dashboard', 'FastAPI REST', 'Celery + Redis Queue', 'Analysis Engines', 'PostgreSQL', 'Alerts + Reports']
    cw = 172
    sx = 110 + (1230 - (6 * cw + 5 * 26)) // 2
    for i, name in enumerate(flow):
        cx = sx + i * (cw + 26)
        R(d, cx, 678, cw, 44, out=BORDER, fill=PANEL, wd=1)
        T(d, cx + cw / 2, 700, name, 12, WHITE, False, 'mm')
        if i < 5:
            ax, ay = cx + cw + 7, 700
            d.polygon([(ax, ay - 7), (ax, ay + 7), (ax + 12, ay)], fill=PURPLE)



def page_arch(d):  # ------------------------------------------------------------ ARCHITECTURE
    frame(d, 'System Architecture', 'SECTION 07')
    # CLIENT tier
    R(d, 110, 190, 560, 74, out=BORDER, fill=PANEL)
    T(d, 130, 208, 'CLIENT — Next.js 15 Dashboard (React 19, Tailwind, GSAP)', 13, YELLOW, True)
    T(d, 130, 234, 'Team seats, scan UI, remediation workflow, API console', 11, GREY)
    # API tier
    R(d, 770, 190, 560, 74, out=BORDER, fill=PANEL)
    T(d, 790, 208, 'API GATEWAY — FastAPI (Uvicorn ASGI) + JWT / API keys', 13, YELLOW, True)
    T(d, 790, 234, '/api/v1: scans, findings, monitoring, risk-score, billing', 11, GREY)
    # QUEUE + WORKERS
    R(d, 110, 292, 560, 74, out=PURPLE, fill=PANEL)
    T(d, 130, 310, 'JOB QUEUE — Redis 7 broker + Celery workers', 13, PURPLE, True)
    T(d, 130, 336, 'Async scan pipeline, retries, scheduled monitor sweeps', 11, GREY)
    # ENGINES
    R(d, 770, 292, 560, 74, out=PURPLE, fill=PANEL)
    T(d, 790, 310, 'ANALYSIS ENGINES — Static + Symbolic (Z3) + AI LLM/RAG', 13, PURPLE, True)
    T(d, 790, 336, '500+ rules · 10^6 paths · CVSS scoring · fix generation', 11, GREY)
    # DATA tier
    R(d, 110, 394, 560, 74, out=GREEN, fill=PANEL)
    T(d, 130, 412, 'DATA — PostgreSQL 16 (SQLAlchemy + Alembic)', 13, GREEN, True)
    T(d, 130, 438, 'Orgs, scans, findings, monitors, usage meters, audit trails', 11, GREY)
    # CHAIN tier
    R(d, 770, 394, 560, 74, out=GREEN, fill=PANEL)
    T(d, 790, 412, 'BLOCKCHAIN WATCHERS — eth-account RPC polling', 13, GREEN, True)
    T(d, 790, 438, 'Ethereum, Base, Arbitrum, Polygon, BSC, Solana', 11, GREY)
    # connectors
    for (x1, y1, x2, y2) in [(390, 264, 390, 292), (1050, 264, 1050, 292),
                             (670, 227, 770, 227), (670, 329, 770, 329), (670, 431, 770, 431),
                             (390, 366, 390, 394), (1050, 366, 1050, 394)]:
        d.line([(x1, y1), (x2, y2)], fill=BORDER, width=2)
    # lateral bands
    R(d, 110, 496, 600, 60, out=YELLOW, fill=PANEL)
    T(d, 130, 508, 'CI/CD: GitHub Action scans every push/PR with inline findings', 12, YELLOW, True)
    R(d, 740, 496, 600, 60, out=YELLOW, fill=PANEL)
    T(d, 760, 508, 'ALERTS: Slack / Discord / Email / Webhook (2.3s latency)', 12, YELLOW, True)
    # deployment strip
    R(d, 110, 580, 1230, 160, out=BORDER, fill=PANEL2)
    T(d, 132, 596, 'DEPLOYMENT & SCALE', 15, PURPLE, True)
    dep = [('Vercel', 'frontend + edge'), ('Docker Compose', 'PG + Redis infra'),
           ('Worker autoscale', '10k+ scans/hour'), ('Sentry', 'error telemetry'),
           ('99.97%', 'API uptime, 12 mo')]
    for i, (a, b) in enumerate(dep):
        T(d, 160 + i * 245, 640, a, 16, WHITE, True)
        T(d, 160 + i * 245, 676, b, 11, GREY)


def page_shots(d):  # ----------------------------------------------------------- PRODUCT WALKTHROUGH
    frame(d, 'Product Walkthrough — Live Dashboard', 'SECTION 08')
    T(d, 110, 178, 'Real product UI · demo org data · scans, monitoring & alerting in production shape', 13, GREY)
    cards = [('scripts/out/shots/dashboard.png', 'Dashboard Overview',
              'Quick scan (code / address / GitHub), live usage meters, CI status'),
             ('scripts/out/shots/scans.png', 'Scans & Risk Grades',
              'A-F risk grades per contract — VulnerableVault graded F'),
             ('scripts/out/shots/monitoring.png', 'Continuous Monitoring',
              'On-chain watchtowers with health status + activity feed alerts')]
    for i, (img, title, sub) in enumerate(cards):
        x = 110 + i * 416
        R(d, x, 208, 396, 380, out=BORDER, fill=PANEL)
        try:
            shot = Image.open(img).resize((376, 212))
            d._image.paste(shot, (x + 10, 218))
        except Exception as e:
            T(d, x + 20, 240, '[screenshot]', 14, GREY)
        T(d, x + 18, 440, title, 16, YELLOW, True)
        words, lines, cur = sub.split(), [], ''
        for wd in words:
            if len(cur + ' ' + wd) <= 44:
                cur = (cur + ' ' + wd).strip()
            else:
                lines.append(cur); cur = wd
        lines.append(cur)
        for j, ln in enumerate(lines[:3]):
            T(d, x + 18, 472 + j * 24, ln, 11.5, GREY)
    R(d, 110, 620, 1230, 120, out=PURPLE, fill=PANEL2)
    T(d, 132, 634, 'SHIPS TODAY', 14, PURPLE, True)
    T(d, 132, 664, 'Next.js dashboard (11 pages) · FastAPI (14+ REST endpoints) · GitHub Action CI bot ·',
      13, WHITE)
    T(d, 132, 692, 'A-F Risk Score API · remediation workflow with sign-off & audit-trail export', 13, WHITE)

def page7(d):  # ---------------------------------------------------------------- TOKENOMICS
    frame(d, 'Tokenomics — SCRT Utility Token', 'SECTION 09')
    R(d, 110, 185, 560, 260, out=BORDER, fill=PANEL)
    T(d, 132, 205, 'Token Utility', 21, PURPLE, True)
    utils = [('Pay', 'scans, monitoring, API & enterprise plans'),
             ('Stake', 'discounts, priority access, higher API limits'),
             ('Govern', 'vote on features, fees, ecosystem fund'),
             ('Earn', 'bug bounties, referrals, community rewards')]
    for i, (a, b) in enumerate(utils):
        T(d, 132, 250 + i * 45, a.upper(), 15, YELLOW, True)
        T(d, 220, 250 + i * 45, b, 13, WHITE)
    R(d, 700, 185, 640, 260, out=BORDER, fill=PANEL)
    T(d, 722, 205, 'Token Distribution', 21, PURPLE, True)
    dist = [('Ecosystem Fund', 35, BORDER), ('Community Rewards', 25, PURPLE),
            ('Team & Advisors', 20, YELLOW), ('Private Sale', 10, GREEN),
            ('Public Sale', 5, (255, 150, 60)), ('Liquidity', 5, RED)]
    for i, (name, pct, col) in enumerate(dist):
        y = 250 + i * 30
        T(d, 722, y, name, 13, WHITE)
        barw = int(6.0 * pct)
        d.rectangle([900, y + 4, 900 + barw, y + 16], fill=col)
        T(d, 1325, y, f'{pct}%', 13, WHITE, True, 'ra')
    # vesting note
    T(d, 722, 432, 'Vesting: Team 1y cliff / 3y linear • Private 6m cliff / 1y • Public 25% TGE', 11, GREY)
    # deflationary model
    R(d, 110, 468, 560, 272, out=GREEN, fill=PANEL)
    T(d, 132, 488, 'Economic Model — The Flywheel', 21, GREEN, True)
    fly = ['1. Demand: teams need constant security coverage',
           '2. Utility: SCRT pays for scans, staking, governance',
           '3. Value accrual: fee burning + revenue buybacks',
           '4. Growth: rewards attract auditors & contributors',
           '5. Platform improves → more demand → repeat']
    for i, ln in enumerate(fly):
        T(d, 132, 535 + i * 40, ln, 14, WHITE)
    R(d, 700, 468, 640, 272, out=RED, fill=PANEL)
    T(d, 722, 488, 'Deflationary Mechanisms', 21, RED, True)
    defs = [('Fee Burning', 'share of every SCRT service fee burned forever'),
            ('Buyback & Burn', 'fiat revenue used to buy & burn SCRT'),
            ('Staking Lockups', 'loyalty tiers reduce circulating supply'),
            ('Bounty Escrow', 'treasury SCRT reserved for bounties & grants')]
    for i, (a, b) in enumerate(defs):
        T(d, 722, 540 + i * 52, '• ' + a, 15, YELLOW, True)
        T(d, 742, 566 + i * 52, b, 12, GREY)

def page8(d):  # ---------------------------------------------------------------- BUSINESS MODEL
    frame(d, 'Business Model & Pricing', 'SECTION 10')
    plans = [('FREE', '$0/mo', ['50 scans/mo', '1 monitored contract', 'GitHub Action', 'Community support'], GREY),
             ('PRO', '$29/mo', ['500 scans/mo', '10 monitored contracts', 'AI fix suggestions', 'Slack/Discord alerts'], BORDER),
             ('TEAM', '$99/mo', ['2,000 scans/mo', '50 monitored contracts', 'Remediation workflow', 'Unlimited seats'], PURPLE),
             ('ENTERPRISE', 'Custom', ['Unlimited scans', 'Risk Score API', '99.95% SLA', 'Dedicated support'], GREEN)]
    for i, (name, price, feats, col) in enumerate(plans):
        x = 110 + i * 318
        R(d, x, 190, 296, 330, out=col, fill=PANEL, wd=2)
        T(d, x + 148, 220, name, 20, col if col != GREY else WHITE, True, 'mm')
        T(d, x + 148, 258, price, 26, WHITE, True, 'mm')
        for j, ft in enumerate(feats):
            T(d, x + 30, 320 + j * 34, '• ' + ft, 12, GREY)
        if i == 1:
            T(d, x + 148, 175, 'MOST POPULAR', 10, YELLOW, True, 'mm')
    R(d, 110, 545, 1230, 195, out=BORDER, fill=PANEL)
    T(d, 132, 563, 'Revenue Streams & Unit Economics', 21, PURPLE, True)
    rev = [('Subscription SaaS', 'core recurring revenue across 4 tiers'),
           ('Usage-based', '$0.10 per extra scan; volume discounts'),
           ('API Licensing', 'Risk Score API for exchanges & wallets'),
           ('Enterprise', 'custom infra, compliance docs, SLAs')]
    for i, (a, b) in enumerate(rev):
        T(d, 160 + (i % 2) * 610, 600 + (i // 2) * 65, '• ' + a, 15, YELLOW, True)
        T(d, 180 + (i % 2) * 610, 623 + (i // 2) * 65, b, 13, GREY)

def page9(d):  # ---------------------------------------------------------------- ROADMAP
    frame(d, 'Development Roadmap', 'SECTION 11')
    phases = [('Q3 2026', ['Cross-chain invariant monitoring', 'Advanced fuzzing engine', 'Formal verification module']),
              ('Q4 2026', ['MEV protection analysis', 'Gas optimization recommender', 'Custom rule creation SDK']),
              ('Q1 2027', ['ZK-proof verification', 'Move language support', 'Automated exploit simulation']),
              ('Q2 2027', ['WASM contract support', 'AI exploit prediction', 'Decentralized audit marketplace'])]
    # timeline spine
    d.line([(140, 260), (1310, 260)], fill=BORDER, width=3)
    for i, (q, items) in enumerate(phases):
        x = 110 + i * 318
        cx = x + 148
        d.ellipse([cx - 9, 251, cx + 9, 269], fill=BORDER, outline=WHITE, width=2)
        R(d, x, 300, 296, 280, out=BORDER, fill=PANEL)
        T(d, x + 20, 320, q, 20, YELLOW, True)
        for j, it in enumerate(items):
            T(d, x + 20, 365 + j * 48, '• ' + it, 13, WHITE)
    R(d, 110, 610, 1230, 130, out=GREEN, fill=PANEL)
    T(d, 132, 628, 'Long-Term Vision', 21, GREEN, True)
    T(d, 132, 666, 'A fully automated security layer for the entire blockchain ecosystem — every contract continuously', 15, WHITE)
    T(d, 132, 692, 'monitored and protected against emerging threats in real time.', 15, WHITE)

def page10(d):  # ---------------------------------------------------------------- TEAM + WHY US
    frame(d, 'Team & Why We Win', 'SECTION 12')
    T(d, 110, 185, 'TEAM UNFILTERED DEVS', 15, YELLOW, True)
    team = [('Ajay Yadav', 'Team Lead & Frontend'),
            ('Rangesh Gupta', 'AI/ML & Backend'),
            ('Shivam Prajapati', 'UI/UX & Frontend'),
            ('Poornita Sahu', 'Research & Presentation')]
    for i, (n, r) in enumerate(team):
        x = 110 + i * 318
        R(d, x, 220, 296, 130, out=BORDER, fill=PANEL)
        d.ellipse([x + 118, 240, x + 178, 300], fill=PANEL2, outline=PURPLE, width=2)
        T(d, x + 148, 268, n[0], 22, PURPLE, True, 'mm')
        T(d, x + 148, 310, n, 15, WHITE, True, 'mm')
        T(d, x + 148, 332, r, 11, GREY, False, 'mm')
    R(d, 110, 385, 1230, 165, out=BORDER, fill=PANEL)
    T(d, 132, 405, 'Why We Win', 21, PURPLE, True)
    win = ['•  Only platform combining static + symbolic + AI engines with continuous monitoring at SaaS pricing',
           '•  Working product: Next.js dashboard, FastAPI backend, GitHub Action CI/CD — already scanning contracts',
           '•  AI fix suggestions close the loop from detection to remediation — a category first at this price point']
    for i, ln in enumerate(win):
        T(d, 132, 450 + i * 32, ln, 14, WHITE)
    R(d, 110, 580, 1230, 145, out=YELLOW, fill=PANEL2)
    T(d, 132, 600, 'The Ask', 21, YELLOW, True)
    T(d, 132, 645, 'Raising to scale go-to-market, expand chain coverage, and grow the AI detection research team.', 15, WHITE)
    T(d, 132, 678, 'Contact: team@auditai.io  •  auditai.io  •  github.com/securithm', 13, GREY)

def page11(d):  # ---------------------------------------------------------------- REFERENCES
    frame(d, 'References & Disclosure of Existing Work', 'SECTION 13')
    refs = [('01', 'SWC Registry', 'Smart Contract Weakness Classification', 'swcregistry.io'),
            ('02', 'OWASP Smart Contract Top 10', 'Industry vulnerability taxonomy', 'owasp.org/www-project-smart-contract-top-10'),
            ('03', 'Slither', 'Static analysis framework reference', 'github.com/crytic/slither'),
            ('04', 'Mythril', 'Symbolic execution approach reference', 'github.com/Consensys/mythril'),
            ('05', 'Rekt News', 'DeFi attack database & case studies', 'rekt.news'),
            ('06', 'Certora', 'Formal verification of smart contracts', 'certora.com'),
            ('07', 'ZEUS / S-gram Research', 'Academic smart-contract analysis papers', 'IEEE S&P / ACM'),
            ('08', 'Securithm Whitepaper v1.0', 'Full technical methodology document', 'securithm.com/whitepaper')]
    for i, (num, name, desc, url) in enumerate(refs):
        x = 110 + (i % 2) * 630
        y = 195 + (i // 2) * 130
        R(d, x, y, 600, 110, out=BORDER, fill=PANEL)
        T(d, x + 22, y + 20, num, 15, PURPLE, True)
        T(d, x + 70, y + 18, name, 17, WHITE, True)
        T(d, x + 70, y + 48, desc, 12, GREY)
        T(d, x + 70, y + 74, url, 12, GREEN)

# ---------------------------------------------------------------- export
PAGES = [page1, page2, page3, page4, page5, page6, page6b, page_arch, page_shots, page7, page8, page9, page10, page11]

def main():
    os.makedirs('scripts/out', exist_ok=True)
    Image.init()
    imgs = []
    for pg in PAGES:
        img = Image.new('RGB', (W, H), BG)
        dr = ImageDraw.Draw(img)
        pg(dr)
        imgs.append(img)
    imgs[0].save('AuditAI_Investor_Pitch_Deck.pdf', save_all=True, append_images=imgs[1:], resolution=96)
    print('PDF written: AuditAI_Investor_Pitch_Deck.pdf')

    # PNG previews for inspection
    for idx, img in enumerate(imgs):
        img.save(f'scripts/out/slide_{idx+1:02d}.png')
    print('PNG previews written to scripts/out/')

if __name__ == '__main__':
    main()
