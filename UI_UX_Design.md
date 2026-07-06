# UI/UX Design for Securithm

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

## 2. Key Screens

| Screen | Purpose | Key Elements |
|---|---|---|
| Landing/Scan | Zero-signup instant value | Code input box, drag-drop `.sol`, "Try with sample contract" |
| Report View | Core "aha" moment | Risk Score badge (A–F), findings list grouped by severity, code diff view for fixes |
| Repo Connection | CI/CD setup | Repo picker, path selector, severity threshold slider |
| Monitoring Dashboard | Ongoing value / retention driver | Live transaction feed, anomaly alerts, contract health over time |
| Team/Workflow | Remediation tracking | Kanban: New → Assigned → Fixing → Resolved, per-finding owner + SLA timer |
| Risk Score API Console | Institutional buyer self-serve | API key management, usage graphs, sample requests, portfolio view |
| Billing/Settings | Plan management | Usage-based meter (scans/mo), seat management, invoice history |

## 3. Design Principles

As an expert frontend engineer, UI/UX designer, visual design specialist, and typography expert, the goal is to integrate a design system into the existing codebase in a way that is visually consistent, maintainable, and idiomatic to the tech stack. The current system utilizes Next.js, React, TypeScript, TailwindCSS, and shadcn/ui. The design principles will focus on leveraging these technologies to create a cohesive and user-friendly experience. This includes:

- **Consistency:** Ensuring a uniform look and feel across all components and pages, adhering to established design tokens for colors, spacing, typography, radii, and shadows.
- **Maintainability:** Designing components that are modular, reusable, and easily updateable within the shadcn/ui framework and Tailwind CSS utility classes.
- **Idiomatic Implementation:** Aligning design choices with the best practices and conventions of Next.js and React to ensure optimal performance and developer experience.
- **User-Centricity:** Prioritizing clear navigation, intuitive interactions, and accessible design elements to cater to the diverse user personas (Solo Solidity Dev, Protocol Security Lead, Institutional Risk/Compliance Officer).
- **Scalability:** Building a design system that can easily accommodate future features and expansions without requiring significant overhauls.

Specific considerations will include:

- **Typography:** Establishing a clear typographic hierarchy using Tailwind's font utilities and ensuring readability across different screen sizes.
- **Color Palette:** Defining a primary and secondary color palette that aligns with the brand identity and accessibility standards.
- **Component Library:** Utilizing and extending shadcn/ui components to build consistent UI elements such as buttons, forms, tables, and navigation menus.
- **Responsiveness:** Implementing a mobile-first approach with Tailwind's responsive design features to ensure optimal viewing on various devices.
- **Accessibility:** Adhering to WCAG guidelines to make the interface usable for individuals with disabilities, including proper semantic HTML, keyboard navigation, and ARIA attributes.
