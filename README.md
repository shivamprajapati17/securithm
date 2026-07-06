# Securithm 🔍

> Ship secure contracts. Before the hackers find the bugs.

[![Frontend CI](https://github.com/shivamprajapati17/securithm/actions/workflows/ci.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/ci.yml)
[![Backend CI](https://github.com/shivamprajapati17/securithm/actions/workflows/backend.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/backend.yml)
[![Deploy](https://github.com/shivamprajapati17/securithm/actions/workflows/deploy.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/deploy.yml)

Instant AI + static analysis of Solidity and Rust smart contracts, continuous on-chain monitoring, and a compliance-style remediation workflow.

## Features

- **Contract Analysis** — Paste code, upload `.sol`/`.rs`, or point to a deployed contract address
- **Vulnerability Detection** — Reentrancy, access control, oracle manipulation, flash loans, and more
- **Risk Scoring** — A–F risk score for any contract address via the Risk Score API
- **CI/CD Integration** — GitHub Action scans every push/PR with inline PR comments
- **Continuous Monitoring** — Watch deployed contracts for anomalous on-chain activity
- **Remediation Workflow** — Assign findings, set SLAs, sign off, and export audit trails

## Quick Start

```bash
# Frontend
npm install
npm run dev        # → http://localhost:3000

# Backend (requires Python 3.12+)
pip install -r backend/requirements.txt
pip install ruff
make dev            # → uvicorn on http://localhost:8000

# Database
make db-start       # Starts PostgreSQL + Redis via Docker
make migrate        # Creates tables
```

## Project Structure

```
├── src/                 # Next.js frontend (11 dashboard pages)
├── backend/             # FastAPI backend (14 REST endpoints)
│   ├── api/v1/          # API routes: scans, findings, monitoring, risk score
│   ├── models/          # SQLAlchemy models (8 tables)
│   ├── schemas/         # Pydantic request/response schemas
│   ├── services/        # Scan analysis pipeline
│   ├── core/            # Config, database, security
│   └── migrations/      # Alembic migrations
├── .github/workflows/   # CI/CD: frontend build + lint, backend test + lint, deploy
├── docker-compose.yml   # PostgreSQL 16 + Redis 7
└── Makefile             # Common dev commands
```

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| **Frontend CI** | Push/PR to master | `npm run lint` + `npm run build` |
| **Backend CI** | Push/PR to master | `ruff check` + `pytest` (with PostgreSQL service) |
| **Deploy** | Push to master | Build + deploy to Vercel |

## Demo Credentials

After seeding: `dev@example.com` / `password123`
