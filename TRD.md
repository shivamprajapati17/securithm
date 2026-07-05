# Technical Requirements Document (TRD) for AuditAI

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                │
│   Marketing site · App dashboard · Docs · Status page    │
└───────────────────────────┬───────────────────────────────┘
                            │ HTTPS/REST + WebSocket
┌───────────────────────────▼───────────────────────────────┐
│              API Gateway (FastAPI, Python 3.12)           │
│   AuthN/Z · Rate limiting · Request routing · Billing hooks│
└───┬───────────┬───────────┬───────────┬───────────────────┘
    │           │           │           │
    ▼           ▼           ▼           ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐
│Analysis│ │ Monitoring│ │Risk Score│ │ Workflow Engine │
│ Engine │ │  Workers  │ │   API    │ │ (n8n embedded)  │
└───┬────┘ └────┬─────┘ └────┬─────┘ └────────┬────────┘
    │           │             │                │
    ▼           ▼             ▼                ▼
┌─────────────────────────────────────────────────────────┐
│  Slither (static) · MythX (symbolic) · GPT-4o (reasoning) │
│  Alchemy/Helius Notify (on-chain events, multi-chain)     │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│  PostgreSQL (findings, users, billing) · Redis (queues)   │
│  S3 (PDF reports, SARIF) · Celery workers · ClickHouse    │
│  (on-chain event analytics, high-volume time-series)       │
└─────────────────────────────────────────────────────────┘
```

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 + TypeScript + shadcn/ui + Tailwind | SSR for marketing/SEO, CSR for app |
| Backend API | FastAPI (Python) | Async, OpenAPI auto-docs for the public Risk Score API |
| Static analysis | Slither (Crytic) | Open-source baseline |
| Symbolic execution | MythX API | Deeper path exploration |
| AI reasoning | GPT-4o fine-tuned on audit reports + Claude for report narrative | Dual-model cross-check reduces false positives |
| Multi-chain data | Alchemy (EVM) + Helius (Solana) + custom indexer | Matches SimpleHash/Blockscope pattern |
| Primary DB | PostgreSQL + Prisma/SQLAlchemy | Transactional data |
| Time-series/events | ClickHouse | On-chain monitoring feed at scale |
| Cache/Queue | Redis + Celery | Analysis job queue |
| Workflow automation | n8n (embedded) | Remediation workflow + integrations |
| Auth | Clerk/AuthKit (Web2) + WalletConnect + SIWE (Web3) | Dual auth for devs and institutions |
| Billing | Stripe (fiat) + on-chain USDC option | Institutional buyers need invoicing |
| PDF generation | WeasyPrint | Security Posture Reports |
| GitHub integration | GitHub App (Probot) | PR comments, Marketplace listing |
| Hosting | AWS ECS Fargate + CloudFront | Auto-scaling for burst scan traffic |
| Observability | Sentry + Datadog | SLA-critical for CI/CD gating use case |

## 3. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Analysis latency | p95 < 30s for contracts <1,000 LOC |
| API uptime | 99.9% (99.95% for Risk Score API — enterprise SLA) |
| False positive rate | <15% High/Critical at GA |
| Multi-chain coverage | Ethereum, Base, Arbitrum, Polygon, BSC, Solana at launch |
| Data residency | SOC 2 Type II path started by Month 6 (required to sell to exchanges/insurers) |
| Concurrency | 500 concurrent scan jobs at launch, horizontally scalable workers |

## 4. Security & Compliance Requirements
- AuditAI itself must be securely built: signed GitHub App tokens, encrypted secrets (source code uploads), least-privilege OAuth scopes on repo access
- SOC 2 Type II roadmap (blocking requirement to land institutional Risk Score API customers)
- Clear ToS disclaimer: AI analysis is *preliminary*, not a substitute for a full manual audit — critical for liability management
