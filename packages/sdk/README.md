# Securithm SDK

> **Ship secure contracts.** Analyze Solidity/Rust code, get risk scores, monitor deployed contracts, and manage security findings.

[![npm version](https://img.shields.io/npm/v/securithm)](https://www.npmjs.com/package/securithm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-shivamprajapati17%2Fsecurithm-blue)](https://github.com/shivamprajapati17/securithm)

---

## Installation

```bash
npm install securithm
# or
yarn add securithm
# or
pnpm add securithm
```

## Quick Start

```typescript
import { Securithm } from "securithm";

// Initialize the client
const client = new Securithm({
  apiKey: "aai_live_sk_...",       // Get from Securithm dashboard
  // baseUrl: "https://securithm.vercel.app/_/backend", // Optional, defaults to production
});

// Authenticate
const { access_token } = await client.auth.login({
  email: "dev@example.com",
  password: "password123",
});

// Set the auth token for subsequent requests
client.setAuthToken(access_token);

// Scan a contract
const scan = await client.scans.create({
  contract_source: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  chain: "ethereum",
  contract_name: "MyContract",
});
console.log(`Scan created: ${scan.id} (${scan.status})`);

// Get risk score
const risk = await client.riskScore.get("ethereum", "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
console.log(`Risk Score: ${risk.risk_score}/100 (Grade: ${risk.grade})`);

// List findings
const findings = await client.findings.list({ severity: "critical" });
console.log(`Critical findings: ${findings.length}`);

// Invite a team member
const invite = await client.team.invite({
  email: "colleague@example.com",
  message: "Join our security team!",
});
console.log(`Invited: ${invite.email} (${invite.status})`);
```

## Features

- ✅ **Full TypeScript support** — All endpoints are fully typed
- ✅ **Authentication** — Email/password login + token management
- ✅ **Smart Contract Scanning** — Submit and monitor scans
- ✅ **Risk Scoring** — Get institutional-grade risk scores
- ✅ **NFT Analysis** — Analyze NFT collections for security risks
- ✅ **Token Analysis** — Token contract security analysis
- ✅ **Monitoring** — Watch deployed contracts for anomalies
- ✅ **Findings Management** — Remediation workflow
- ✅ **Team Management** — Invite members, manage roles
- ✅ **Billing** — View plans and usage
- ✅ **API Keys** — Manage API keys programmatically
- ✅ **Browser + Node.js** — Works in both environments

## API Reference

### Authentication

```typescript
// Login with email/password
const token = await client.auth.login({ email, password });

// Get current user profile
const me = await client.auth.getMe();

// Update profile
const updated = await client.auth.updateMe({ display_name: "New Name" });
```

### Scans

```typescript
// Create a scan
const scan = await client.scans.create({
  contract_source: "contract MyContract {}",
  chain: "ethereum",
  contract_name: "MyContract",
});

// List scans
const { items, total } = await client.scans.list({ page: 1, page_size: 20 });

// Get scan details
const scan = await client.scans.get("scan-id-here");
```

### Risk Score

```typescript
// Get risk score
const risk = await client.riskScore.get("ethereum", "0x...");

// Get score history
const history = await client.riskScore.getHistory("ethereum", "0x...");
```

### Findings

```typescript
// List findings
const findings = await client.findings.list({ severity: "critical" });

// Update a finding
const updated = await client.findings.update("finding-id", {
  status: "resolved",
});
```

### Monitoring

```typescript
// Add a contract to monitor
const contract = await client.monitoring.create({
  contract_address: "0x...",
  chain: "ethereum",
  label: "Vault",
});

// List monitored contracts
const contracts = await client.monitoring.list();

// Get events for a contract
const events = await client.monitoring.getEvents("contract-id");
```

### NFT Analysis

```typescript
// Analyze NFT collection
const nft = await client.nft.analyze("ethereum", "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D");

// List analyzed collections
const collections = await client.nft.listCollections({ page: 1, chain: "ethereum" });
```

### Token Analysis

```typescript
// Analyze token
const token = await client.token.analyze("ethereum", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

// List analyzed tokens
const tokens = await client.token.list({ page: 1, token_type: "erc20" });
```

### Team

```typescript
// Invite a team member
const invite = await client.team.invite({ email: "user@example.com" });

// List team members
const members = await client.team.listMembers();

// Change a member's role
const updated = await client.team.changeMemberRole("user-id", "admin");

// Remove a member
await client.team.removeMember("user-id");

// Accept an invite
const accepted = await client.team.acceptInvite("invite-id");

// Decline an invite
await client.team.declineInvite("invite-id");

// Cancel a pending invite
await client.team.cancelInvite("invite-id");

// List pending invites
const invites = await client.team.listInvites();
```

### Billing / Payments

```typescript
// List plans
const plans = await client.payments.listPlans();

// Get usage
const usage = await client.payments.getUsage();

// Get billing dashboard
const dashboard = await client.payments.getDashboard();
```

### API Keys

```typescript
// Create an API key
const key = await client.apiKeys.create({ name: "My Key" });

// List API keys
const keys = await client.apiKeys.list();

// Update a key
const updated = await client.apiKeys.update("key-id", { rate_limit_per_hour: 100 });

// Revoke a key
await client.apiKeys.revoke("key-id");

// Get usage
const usage = await client.apiKeys.getUsage();
```

## Error Handling

All API errors throw a typed `SecurithmError`:

```typescript
import { SecurithmError } from "securithm";

try {
  await client.scans.get("invalid-id");
} catch (error) {
  if (error instanceof SecurithmError) {
    console.error(`API Error [${error.status}]: ${error.message}`);
  }
}
```

## Rate Limits

| Plan | Rate Limit |
|------|------------|
| Free | 10 requests/min |
| Pro | 100 requests/min |
| Enterprise | Custom |

## Contributing

```bash
git clone https://github.com/shivamprajapati17/securithm.git
cd securithm/packages/sdk
npm install
npm run build
```

## License

MIT © [Shivam Prajapati](https://github.com/shivamprajapati17)
