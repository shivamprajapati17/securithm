# Securithm

> Scan, fix and monitor smart contracts — from the website or your terminal.

[![CI — Frontend + Backend](https://github.com/shivamprajapati17/securithm/actions/workflows/ci.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/ci.yml)
[![Backend CI](https://github.com/shivamprajapati17/securithm/actions/workflows/backend.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/backend.yml)

Securithm is a smart-contract security platform: **11 trained agents** scan
Solidity for vulnerabilities, rewrite the flagged lines into a compilable
fixed file, watch deployed contracts on six chains, and produce signed
proof-of-reserves attestations.

- **Website** — <https://securithm.vercel.app>
- **CLI on npm** — [`securithm`](https://www.npmjs.com/package/securithm)

---

## What it does

| Capability | Where |
|---|---|
| Scan a contract (11 agents, A–F grade) | Website → Scan · CLI `scan` · `POST /api/v1/scans` |
| Auto-fix + download patched `.sol` / unified `.patch` | Scan page → Download · CLI `scan --fix --patch` |
| Monitor deployed contracts (6 chains, <1s alerts) | Dashboard → Monitoring |
| Proof-of-reserves (merkle attestations) | `/solvency` · Dashboard → Solvency |
| Team workspaces & invites | Dashboard → Team |
| API keys, usage & paywall | Dashboard → API Console · Pricing |

**Free tier:** 5 contract scans, no account needed. After that, buy a plan
(currently ₹0 launch pricing) — an API key is generated on the spot and
unlocks unlimited scans on both the website and the CLI.

---

## Install & run (this repo)

```bash
# 1. Frontend (Next.js 15 + Tailwind v4)
npm install
npm run dev          # → http://localhost:3000

# 2. Backend (FastAPI, Python 3.12+ — optional, CI-tested reference engine)
pip install -r backend/requirements.txt
uvicorn app:app --reload   # from backend/ — see backend/README if present

# 3. CLI (local development of the npm package)
cd packages/sdk
npm install
npm run build
node dist/cli.js scan MyContract.sol --fix
```

### Environment variables (frontend, `.env.local`)

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + data storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes (plans, GitHub connections) |
| `SECRET_KEY` | HS256 session-token signing — **required, no fallback** |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Checkout (₹0 pricing skips the gateway) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth (PAT connect works without it) |

---

## Use the CLI (from npm)

```bash
npm install -g securithm     # or: npx securithm <command>
```

| Command | What it does |
|---|---|
| `securithm scan MyContract.sol` | Scan one file — findings with agent, severity, line |
| `securithm scan MyContract.sol --fix` | Also write `MyContract_fixed.sol` |
| `securithm scan MyContract.sol --patch` | Also write a unified `.patch` diff |
| `securithm login` | Paste your API key (dashboard → API Keys) — unlimited scans + dashboard sync |
| `securithm status` | Version, scan quota, key state |
| `securithm update` | Check for a newer CLI version |

The first **5 scans are free**. On scan 6 the CLI opens the pricing page,
you buy a plan, generate an API key, run `securithm login` and paste it —
scanning continues, unlimited, with every scan synced to your dashboard.

---

## Tech stack

- **Frontend** — Next.js 15 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Backend API** — Next.js Route Handlers (`/api/v1/*`), Supabase (Postgres) storage
- **Auth** — Supabase auth + app-issued HS256 session tokens
- **Payments** — Razorpay (orders, signature verification, webhooks)
- **Scanner engine** — TypeScript rule agents (vendored at `src/lib/engine.ts`),
  Python reference service under `backend/` (CI-tested)
- **CLI/SDK** — TypeScript, published to npm as [`securithm`](https://www.npmjs.com/package/securithm)
- **CI/CD** — GitHub Actions (lint + tests + build), Vercel production deploys
- **Contracts** — `contracts/SecurithmAttestation.sol` (on-chain proof-of-reserves)

---

## API overview

All routes live under `/api/v1`:

```
auth:      register · login · me · api-keys · github/token · github/repos
scans:     POST /scans (create) · GET /scans (list) · GET /scans/:id
payments:  plans · create-order · verify · webhook · callback · plan
monitoring:  alerts for watched contracts
team:      org · members · invites (+ accept/decline)
solvency:  profile · wallets · liabilities · snapshots · alerts · demo
```

Scan request example:

```bash
curl -X POST https://securithm.vercel.app/api/v1/scans \
  -H "Authorization: Bearer <your-session-or-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyVault", "contract_source": "pragma solidity ^0.8.19; contract V {}"}'
```

Logged-in users get 5 free scans per 24h; API-key requests (CLI/SDK) draw
from the plan's quota instead.

---

## Repository layout

```
src/                 Next.js app (pages, API routes, engine, styles)
packages/sdk/        securithm CLI + SDK source (published to npm)
backend/             Python reference service (CI-tested)
contracts/           SecurithmAttestation.sol + build artifact
supabase/            Database migration notes
.github/workflows/   CI (frontend+backend), backend CI, deploy
```

## License

MIT
