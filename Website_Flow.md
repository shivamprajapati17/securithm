# Website Flow for AuditAI

## 1. Core User Flows

### Flow A — Solo Dev First Scan (PLG onboarding)
```
Landing page → "Paste your contract" (no signup required)
   → Instant scan runs → Results shown (blurred detail on Medium/Low findings)
   → "Sign up free to see all findings + get the fix" (soft paywall)
   → Signup (GitHub OAuth, 1-click) → Full report unlocked
   → CTA: "Install the GitHub Action to scan every PR automatically"
```

### Flow B — Protocol Team CI/CD Setup
```
Dashboard → Connect GitHub repo → Select contracts path
   → Configure severity threshold (fail CI on High+)
   → Push code → GitHub Action runs → PR comment posted inline
   → Team reviews findings in PR → Merge or fix
   → Dashboard shows historical trend: bugs caught over time, MTTR per severity
```

### Flow C — Continuous Monitoring Setup
```
Dashboard → "Monitor a deployed contract" → Paste address + select chain
   → Configure alert channels (Slack/Discord/email)
   → Real-time feed begins → Anomaly detected → Alert fires
   → Click alert → Transaction detail view → Assign owner → Mark resolved
```

### Flow D — Institutional Risk Score API (Persona C)
```
Sales-assisted signup → API key issued → Query endpoint with contract address
   → Returns: Risk Score (0-100), findings summary, monitoring history, confidence interval
   → Optional: Portfolio dashboard showing risk trend across N monitored protocols
   → Monthly PDF compliance report auto-generated for internal audit trail
```
