# Securithm SDK & API Documentation

> **Version:** 1.0.0 | **License:** MIT | **Base URL:** `https://securithm.vercel.app/_/backend` (production) | `http://localhost:8000` (development)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Quick Start Guide (5 min)](#2-quick-start-guide-5-min)
3. [Integration Guide](#3-integration-guide)
4. [Developer API Reference](#4-developer-api-reference)
5. [Scans API](#5-scans-api)
6. [Risk Score API](#6-risk-score-api)
7. [NFT API](#7-nft-api)
8. [Token API](#8-token-api)
9. [Payments / Billing API](#9-payments--billing-api)
10. [Monitoring API](#10-monitoring-api)
11. [Findings API](#11-findings-api)
12. [Errors & Status Codes](#12-errors--status-codes)
13. [Rate Limits](#13-rate-limits)
14. [SDK Usage Examples](#14-sdk-usage-examples)
15. [Open Source & Contributing](#15-open-source--contributing)

---

## 1. Authentication

All API requests (except public endpoints) require a Bearer token in the `Authorization` header.

```http
Authorization: Bearer <your_access_token>
```

### Get a Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "dev@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### OAuth Login

```http
GET /api/v1/auth/login/google
```

Redirects to Google's consent screen. On success, the callback returns a JWT token.

---

## 5. Scans API

Submit Solidity/Rust code, deployed contract addresses, or GitHub URLs for security analysis.

### Submit a Scan

```http
POST /api/v1/scans
Content-Type: application/json

{
  "contract_source": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "chain": "ethereum",
  "contract_name": "MyContract"
}
```

**Response (202 Accepted):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "chain": "ethereum",
  "contract_name": "MyContract",
  "created_at": "2026-07-06T12:00:00Z",
  "findings": []
}
```

### Get Scan Results

```http
GET /api/v1/scans/{scan_id}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "risk_score_overall": "D",
  "findings": [
    {
      "category": "Reentrancy",
      "severity": "critical",
      "line_number": 45,
      "description": "Unchecked external call allows reentrancy attack",
      "suggested_fix": "Apply checks-effects-interactions pattern"
    }
  ]
}
```

---

## 6. Risk Score API

Institutional-facing risk scoring for any contract address. Designed for exchanges, insurers, and funds.

### Get Risk Score

```http
GET /api/v1/risk-score/{chain}/{address}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `chain` | string | Blockchain: `ethereum`, `solana`, `base`, `arbitrum`, `polygon`, `bsc` |
| `address` | string | Contract address to evaluate |

**Response:**
```json
{
  "chain": "ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "risk_score": 72,
  "grade": "D",
  "total_findings": 5,
  "critical_count": 1,
  "high_count": 2,
  "medium_count": 1,
  "low_count": 1,
  "confidence": "high"
}
```

### Get Score History

```http
GET /api/v1/risk-score/{chain}/{address}/history
```

Returns an array of historical risk scores for tracking security posture changes.

---

## 7. NFT API 🔥 NEW

Analyze NFT collections for security risks, royalty enforcement, and mint authority issues.

### Analyze NFT Collection

```http
GET /api/v1/nft/analyze/{chain}/{address}
```

**Response:**
```json
{
  "contract_address": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
  "chain": "ethereum",
  "collection_name": "BoredApeYachtClub",
  "total_supply": 10000,
  "security_score": 85,
  "risk_level": "low",
  "findings": [
    {
      "category": "Royalty Enforcement",
      "severity": "medium",
      "description": "Royalties enforced off-chain via marketplace filter",
      "recommendation": "Consider on-chain royalty enforcement (ERC-2981)"
    }
  ],
  "is_verified": true,
  "has_royalty_enforcement": true,
  "has_allowlist": true,
  "has_mint_authority_risk": false,
  "analyzed_at": "2026-07-06T12:00:00Z"
}
```

### List Analyzed Collections

```http
GET /api/v1/nft/collections?page=1&page_size=20&chain=ethereum
```

---

## 8. Token API 🔥 NEW

Analyze token contracts for rug-pull risks, honeypot detection, and tokenomics security.

### Analyze Token

```http
GET /api/v1/token/analyze/{chain}/{address}?token_type=erc20
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chain` | string | — | Blockchain: `ethereum`, `solana`, etc. |
| `address` | string | — | Token contract address |
| `token_type` | string | `erc20` | Token standard: `erc20`, `erc721`, `erc1155`, `spl` |

**Response:**
```json
{
  "contract_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "chain": "ethereum",
  "token_name": "USD Coin",
  "token_symbol": "USDC",
  "token_type": "erc20",
  "security_score": 95,
  "risk_level": "low",
  "findings": [
    {
      "category": "Ownership",
      "severity": "informational",
      "description": "Contract has owner role with blacklist capability"
    }
  ],
  "is_renounced": false,
  "has_honeypot_risk": false,
  "has_blacklist": true,
  "has_tax": false,
  "has_mint_function": true,
  "analyzed_at": "2026-07-06T12:00:00Z"
}
```

### List Analyzed Tokens

```http
GET /api/v1/token/list?page=1&page_size=20&chain=ethereum&token_type=erc20
```

---

## 9. Payments / Billing API 🔥 NEW

Manage billing plans, track usage, and view invoices.

### List Plans

```http
GET /api/v1/payments/plans
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Free",
    "max_scans_per_month": 50,
    "max_monitored_contracts": 1,
    "price_usd": 0.0,
    "features": [
      "AI-powered analysis (50 scans/mo)",
      "Basic monitoring (1 contract)",
      "Community support"
    ]
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Pro",
    "max_scans_per_month": 500,
    "max_monitored_contracts": 10,
    "price_usd": 29.0,
    "features": [
      "AI-powered analysis (500 scans/mo)",
      "CI/CD integration",
      "Continuous monitoring (10 contracts)",
      "Team seats (5)",
      "API access",
      "Email support"
    ]
  }
]
```

### Get Usage

```http
GET /api/v1/payments/usage
```

### Get Full Dashboard

```http
GET /api/v1/payments/dashboard
```

Returns plans, current plan, usage, payment methods, and invoice history in one response.

---

## 10. Monitoring API

Monitor deployed contracts for anomalous on-chain activity.

### Add Contract to Monitor

```http
POST /api/v1/monitored-contracts
Content-Type: application/json

{
  "contract_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "chain": "ethereum",
  "label": "USDC Vault"
}
```

### List Monitored Contracts

```http
GET /api/v1/monitored-contracts
```

### Get Contract Events

```http
GET /api/v1/monitored-contracts/{contract_id}/events
```

---

## 11. Findings API

Manage security findings in the remediation workflow.

### List Findings

```http
GET /api/v1/findings?scan_id={scan_id}&severity=critical&status=open
```

### Update Finding

```http
PATCH /api/v1/findings/{finding_id}
Content-Type: application/json

{
  "status": "resolved",
  "assigned_to": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 12. Errors & Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request — invalid parameters |
| `401` | Unauthorized — missing or invalid token |
| `404` | Not Found — resource doesn't exist |
| `409` | Conflict — resource already exists (e.g., email registered) |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |

**Error Response Format:**
```json
{
  "detail": "Error description message"
}
```

---

## 13. Rate Limits

| Plan | Rate Limit |
|------|------------|
| Free | 10 requests/min |
| Pro | 100 requests/min |
| Enterprise | Custom (contact sales) |

Rate limit headers are returned in all responses:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1625676000
```

---

## 14. SDK Usage Examples

### JavaScript / TypeScript (Web)

```typescript
import * as Securithm from '@securithm/sdk';

// Initialize client
const client = new Securithm.Client({
  apiKey: 'aai_live_sk_...',
  baseUrl: 'https://securithm.vercel.app/_/backend',
});

// Scan a contract
const scan = await client.scans.create({
  contract_source: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  chain: 'ethereum',
});
console.log(`Scan ID: ${scan.id}`);

// Get risk score
const risk = await client.riskScore.get('ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
console.log(`Risk Score: ${risk.risk_score}/100 (Grade: ${risk.grade})`);

// Analyze NFT collection
const nft = await client.nft.analyze('ethereum', '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D');
console.log(`Collection: ${nft.collection_name} — Score: ${nft.security_score}`);

// Analyze token
const token = await client.token.analyze('ethereum', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
console.log(`Token: ${token.token_name} — Risk: ${token.risk_level}`);

// Get billing info
const billing = await client.payments.getDashboard();
console.log(`Current plan: ${billing.current_plan?.name}`);
console.log(`Scans used: ${billing.usage?.scans_used}/${billing.usage?.scans_limit}`);
```

### Python

```python
from securithm import Securithm

client = Securithm(
    api_key="aai_live_sk_...",
    base_url="https://securithm.vercel.app/_/backend"
)

# Scan a contract
scan = client.scans.create(
    contract_source="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    chain="ethereum"
)
print(f"Scan ID: {scan['id']}")

# Get risk score
risk = client.risk_score.get("ethereum", "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18")
print(f"Grade: {risk['grade']} — Score: {risk['risk_score']}")

# Analyze NFT
nft = client.nft.analyze("ethereum", "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D")
print(f"Collection security score: {nft['security_score']}")

# Analyze token
token = client.token.analyze("ethereum", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
print(f"Token risk level: {token['risk_level']}")

# Check billing
billing = client.payments.get_dashboard()
print(f"Plan: {billing['current_plan']['name']}")
```

### cURL

```bash
# Authenticate
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"password123"}' \
  | jq -r '.access_token')

# Risk Score
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/risk-score/ethereum/0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18

# NFT Analysis
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/nft/analyze/ethereum/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D

# Token Analysis
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/token/analyze/ethereum/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?token_type=erc20"

# Payment Plans
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/payments/plans
```

### Go

```go
package main

import (
    "fmt"
    "github.com/securithm/sdk-go"
)

func main() {
    client := securithm.NewClient("aai_live_sk_...")

    // Risk score
    risk, _ := client.RiskScore.Get("ethereum", "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18")
    fmt.Printf("Risk score: %d/100 (Grade: %s)\n", risk.RiskScore, risk.Grade)

    // NFT analysis
    nft, _ := client.NFT.Analyze("ethereum", "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D")
    fmt.Printf("NFT Collection: %s — Score: %d\n", nft.CollectionName, nft.SecurityScore)
}
```

---

## 2. Quick Start Guide (5 min)

### Get Your API Key

1. Sign up at `https://securithm.vercel.app/auth/register`
2. Navigate to Dashboard → Settings to generate your API key
3. Your key starts with `aai_live_sk_...`

### Make Your First API Call

```bash
curl -X POST http://localhost:8000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "contract_source": "contract MyContract { function foo() public {} }",
    "chain": "ethereum",
    "contract_name": "MyContract"
  }'
```

### Poll for Results

```bash
curl -s http://localhost:8000/api/v1/scans/{scan_id} \
  | jq '.status, .risk_score_overall'
```

---

## 3. Integration Guide

### GitHub Action (CI/CD)

Add to `.github/workflows/securithm.yml`:

```yaml
name: Securithm Security Scan
on: [push, pull_request]
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: securithm/action@v1
        with:
          threshold: HIGH
          token: ${{ secrets.SECURITHM_TOKEN }}
          paths: contracts/**/*.sol
```

### Webhook Integration

Register a webhook to receive scan completion events:

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/securithm",
  "events": ["scan.completed", "finding.critical"],
  "secret": "your_webhook_secret"
}
```

### Slack / Discord Notifications

Use the webhook system to forward critical findings to your team:

```bash
# Example: Slack webhook payload
curl -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer xoxb-your-token" \
  -d '{
    "channel": "#security-alerts",
    "text": "🚨 Critical finding in MyContract!"
  }'
```

### React / Next.js Integration

```tsx
import { createScan, getRiskScore } from "@/lib/api";

async function scanContract() {
  const scan = await createScan({
    contract_source: "0x...",
    chain: "ethereum",
    contract_name: "MyContract",
  });
  console.log(`Scan created: ${scan.id}`);
}
```

---

## 4. Developer API Reference

### OpenAPI Spec

Download the full OpenAPI specification:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **JSON:** `http://localhost:8000/openapi.json`

### API Client Libraries

#### JavaScript / TypeScript
```bash
npm install @securithm/sdk
```

```typescript
import { SecurithmClient } from "@securithm/sdk";

const client = new SecurithmClient({
  apiKey: process.env.SECURITHM_API_KEY,
});

const risk = await client.riskScore.get("ethereum", "0x...");
```

#### Python
```bash
pip install securithm-sdk
```

```python
from securithm import Securithm

client = Securithm(api_key="your_key")
risk = client.risk_score.get("ethereum", "0x...")
print(f"Score: {risk.risk_score}/100")
```

#### cURL (no SDK needed)
```bash
# All endpoints accessible via plain HTTP
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/risk-score/ethereum/0x...
```

### Rate Limits & Quotas

| Plan | Scans/month | API calls/min | Contracts monitored |
|------|-------------|---------------|-------------------|
| Free | 50 | 10 | 1 |
| Pro | 500 | 100 | 10 |
| Enterprise | Custom | Custom | Custom |

### Authentication Flows

1. **Email/Password:** `POST /api/v1/auth/login`
2. **Google OAuth:** `GET /api/v1/auth/login/google`
3. **GitHub OAuth:** `GET /api/v1/auth/login/github`
4. **API Key:** Pass in `Authorization: Bearer <key>` header

---

## Interactive API Console

Visit the interactive API console at `/dashboard/api-console` in the Securithm dashboard or use the auto-generated OpenAPI docs:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## 15. Open Source & Contributing

### Repository

```
https://github.com/shivamprajapati17/securithm
```

### License

This project is open source under the **MIT License**. See `LICENSE` file for details.

### Local Development

```bash
# Clone the repository
git clone https://github.com/shivamprajapati17/securithm.git
cd securithm

# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r backend/requirements.txt

# Start development servers
npm run dev          # Frontend on :3000
# In another terminal:
python -m backend.dev_setup  # Backend on :8000
```

### Project Structure

```
securithm/
├── src/                 # Next.js frontend
│   ├── app/             # Pages and layouts
│   ├── components/      # UI components
│   └── lib/             # API client, hooks, utilities
├── backend/             # FastAPI backend
│   ├── api/v1/          # REST API endpoints
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   └── services/        # Business logic
├── .github/workflows/   # CI/CD pipelines
└── SDK_DOCUMENTATION.md # This file
```

### CI/CD Status

| Workflow | Status |
|----------|--------|
| Frontend CI | [![Frontend CI](https://github.com/shivamprajapati17/securithm/actions/workflows/ci.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/ci.yml) |
| Backend CI | [![Backend CI](https://github.com/shivamprajapati17/securithm/actions/workflows/backend.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/backend.yml) |
| Deploy | [![Deploy](https://github.com/shivamprajapati17/securithm/actions/workflows/deploy.yml/badge.svg)](https://github.com/shivamprajapati17/securithm/actions/workflows/deploy.yml) |

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -am "Add my feature"`
4. Push to the branch: `git push origin feat/my-feature`
5. Submit a pull request

### Code Standards

- **Frontend:** TypeScript, React 19, Next.js 15, Tailwind CSS 4
- **Backend:** Python 3.12, FastAPI, Pydantic, SQLAlchemy
- **Testing:** Vitest (frontend), pytest (backend)
- **Linting:** ESLint with typescript-eslint + @next/eslint-plugin-next

### Support

- **Issues:** [GitHub Issues](https://github.com/shivamprajapati17/securithm/issues)
- **Discussions:** [GitHub Discussions](https://github.com/shivamprajapati17/securithm/discussions)
- **Email:** support@securithm.dev

---

*Documentation generated for Securithm SDK v1.0.0 — Open Source (MIT)*
