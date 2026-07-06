# Backend Schema for Securithm

## 1. Database Schema

```sql
-- Users and Organizations
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  org_id UUID REFERENCES organizations(id)
)

organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  plan_id UUID REFERENCES plans(id),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

plans (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  max_scans_per_month INTEGER,
  max_monitored_contracts INTEGER,
  price_usd DECIMAL(10, 2)
)

-- Scan Jobs and Findings
scan_jobs (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  contract_source TEXT,                -- Code, GitHub URL, or deployed address
  chain TEXT,                          -- e.g., "ethereum", "solana"
  status TEXT,                         -- "pending", "running", "completed", "failed"
  risk_score_overall TEXT,             -- A-F
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
)

findings (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES scan_jobs(id),
  category TEXT,
  severity TEXT,                       -- "critical", "high", "medium", "low", "informational"
  line_number INTEGER,
  code_snippet TEXT,
  description TEXT,
  suggested_fix TEXT,
  assigned_to UUID REFERENCES users(id),
  status TEXT,                         -- "open", "in_progress", "resolved", "wont_fix"
  remediation_sla TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
)

-- Continuous Monitoring
monitored_contracts (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked TIMESTAMPTZ
)

monitoring_events (
  id UUID PRIMARY KEY,
  monitored_contract_id UUID REFERENCES monitored_contracts(id),
  event_type TEXT,                     -- e.g., "large_outflow", "unknown_caller"
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
)

-- Billing/Usage
usage_meters (
  org_id UUID REFERENCES organizations(id),
  period TEXT,                          -- YYYY-MM
  scans_used INTEGER DEFAULT 0,
  api_calls_used INTEGER DEFAULT 0
)
```

## 2. Key API Endpoints

```http
# Analysis
POST   /api/v1/scans                      # Submit code/address/repo for analysis
GET    /api/v1/scans/{id}                  # Poll status / retrieve results
GET    /api/v1/scans/{id}/report.pdf       # Download Security Posture Report

# Findings / Workflow
GET    /api/v1/findings?scan_id=...
PATCH  /api/v1/findings/{id}               # Assign owner, update status, mark resolved

# Monitoring
POST   /api/v1/monitored-contracts
GET    /api/v1/monitored-contracts/{id}/events

# Risk Score API (institutional, public-facing)
GET    /api/v1/risk-score/{chain}/{address}
GET    /api/v1/risk-score/{chain}/{address}/history

# GitHub Integration (webhook receivers)
POST   /webhooks/github/pull_request
POST   /webhooks/github/push
```
