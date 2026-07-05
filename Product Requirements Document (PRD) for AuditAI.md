# Product Requirements Document (PRD) for AuditAI

## 1. Product Overview

- **Name:** AuditAI
- **Tagline:** "Ship secure contracts. Before the hackers find the bugs."
- **Category:** Web3 dev-tool / security infrastructure
- **Problem:** Smart contract audits cost $20–150K and take months; 95% of Web3 teams ship unaudited. $3.8B was lost to smart contract exploits in a single year.
- **Solution:** Instant AI + static + symbolic analysis of Solidity/Rust contracts, continuous on-chain monitoring, and a compliance-style remediation workflow — distributed via API, CLI, and GitHub Action.

## 2. Goals & KPIs

| Metric | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Developer signups | 2,000 | 10,000 | 50,000 |
| Contracts analyzed | 10,000 | 100,000 | 1,000,000 |
| Paying teams | 200 | 1,000 | 5,000 |
| MRR | $15K | $75K | $350K |
| Critical bugs caught pre-deploy | 500 | 5,000 | 50,000 |
| Enterprise/institutional accounts | 0 | 5 | 25 |

## 3. User Personas

### Persona A — "Solo Solidity Dev" (Primary, PLG entry point)
- Building a first protocol/token, can't afford a $50K audit
- Wants: instant feedback, plain-English fixes, free tier to start

### Persona B — "Protocol Security Lead" (Primary, revenue driver)
- Runs a funded DeFi protocol, ships weekly
- Wants: CI/CD gating, continuous monitoring, historical audit trail, team seats

### Persona C — "Institutional Risk/Compliance Officer" (Secondary, high-ACV — TRM Labs-style buyer)
- Works at an exchange, insurer, or fund evaluating counterparty protocols
- Wants: a **Risk Score API**, due-diligence reports, portfolio-wide monitoring dashboards — *not* code-level detail

## 4. Feature Requirements

### F1: Contract Analysis Engine
- Input: paste code, upload `.sol`/`.rs`, GitHub URL, deployed contract address, CI/CD
- Detection categories: Reentrancy, Access Control, Integer Issues, Flash Loan attacks, Oracle Manipulation, Unchecked Calls, Gas Griefing, Front-running/MEV, Timestamp Dependence, Centralization Risk, **Logic/Intent Mismatch (new — AI reasons about spec vs. code, KV Cash-style)**
- Output: severity-tagged findings, line-level snippets, plain-English explanation, Risk Score (A–F)
- Performance: <30s for contracts under 1,000 lines; false positive rate <15% on High/Critical

### F2: AI-Generated Fix Suggestions
- Secure code replacement per finding + rationale
- "Apply all fixes" → patched file
- Secondary AI pass validates fixes before showing them

### F3: GitHub Action / CI/CD Integration
- Runs on push/PR, posts inline PR review comments, fails CI above configured severity, publishes SARIF to GitHub Security tab
- Listed on GitHub Marketplace for organic discovery (Hiro/SimpleHash-style PLG distribution)

### F4: Continuous Contract Monitoring (new emphasis — TRM Labs-style)
- Watches deployed contracts for anomalous on-chain activity (large outflows, unknown-address calls, sudden TVL drops)
- Real-time transaction feed dashboard per monitored contract
- Multi-chain support from day one (EVM chains + Solana) via indexed data layer, not per-chain custom integration

### F5: Risk Score API & Institutional Dashboard (new — highest-ACV feature)
- Public/partner-facing API returning a normalized Risk Score for any contract address
- Sold to exchanges (listing due-diligence), insurers (coverage underwriting), funds (portfolio risk)
- This is the TRM Labs/Notabene-style expansion product that turns a $15/mo developer tool into a $50K+/yr enterprise contract

### F6: Compliance-Style Remediation Workflow (new — Notabene-style)
- Each finding can be assigned an owner, a remediation SLA, and a sign-off step
- Full audit trail exportable as a PDF "Security Posture Report" for investors/auditors/insurers

### F7: Automation Integrations
- n8n: scan → filter by severity → GitHub PR comment → Linear issue → Slack alert
- Zapier: scan completed → email PDF report → Notion page → Slack summary

## 5. Non-Goals (v1)
- No formal verification (mathematical proofs) — positioned as a *complement* to, not replacement for, a full manual audit
- No custody of funds or bug-bounty escrow in v1
- No support for non-EVM/non-Solana chains in v1
