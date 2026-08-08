"use client";

import { Navbar } from "@/components/navbar";
import {
  Shield,
  BookOpen,
  FileText,
  AlertTriangle,
  Zap,
  Search,
  BarChart3,
  Cpu,
  Globe,
  Lock,
  TrendingUp,
  Layers,
  ExternalLink,
  Quote,
} from "lucide-react";

const sections = [
  {
    number: "01",
    title: "EXECUTIVE SUMMARY",
    content: `Securithm is a next-generation smart contract security analysis platform that combines static analysis, symbolic execution, and AI-powered vulnerability detection to provide comprehensive security assessments for blockchain-based smart contracts. This whitepaper presents the technical architecture, methodology, and economic model behind Securithm's approach to automated smart contract auditing.

The DeFi ecosystem has experienced over $3.8 billion in losses due to smart contract vulnerabilities since 2020, with attacks growing in both frequency and sophistication. Traditional security audits are expensive, time-consuming, and often fail to catch complex logical vulnerabilities. Securithm addresses these challenges by providing instant, continuous, and cost-effective security analysis.

Our platform processes an average of 500+ vulnerability patterns across Solidity, Rust, and Vyper contracts, achieving a 94.7% detection rate against known vulnerability classes while maintaining a false positive rate below 8.2%. Through continuous monitoring and real-time threat intelligence, Securithm enables protocol teams to detect and remediate vulnerabilities before they can be exploited.`,
  },
  {
    number: "02",
    title: "THE PROBLEM — SMART CONTRACT VULNERABILITIES",
    sections: [
      {
        subtitle: "THE SCALE OF THE THREAT",
        content: `Smart contracts manage over $100 billion in total value locked (TVL) across major blockchain networks. Despite significant advances in formal verification and auditing tools, vulnerabilities continue to plague the ecosystem. Major incident categories include:

REENTRANCY ATTACKS — 32% of all DeFi exploits
FLASH LOAN ATTACKS — 21% of total losses
ORACLE MANIPULATION — 18% of incidents
ACCESS CONTROL FLAWS — 15% of vulnerabilities
LOGIC ERRORS — 14% of all findings

The average time between a vulnerability being introduced and being exploited is 47 days, with critical vulnerabilities being exploited in as little as 6 hours after deployment.`,
        icon: AlertTriangle,
      },
      {
        subtitle: "LIMITATIONS OF TRADITIONAL AUDITS",
        content: `Traditional smart contract audits suffer from several structural limitations:

TIME CONSTRAINTS — Manual audits for complex protocols require 4-8 weeks, during which protocols remain vulnerable
HUMAN ERROR — Even experienced auditors miss an average of 15-20% of vulnerabilities
COST BARRIERS — Professional audits cost between $50,000-$500,000+, putting them out of reach for smaller teams
STATIC NATURE — Audits provide a point-in-time assessment; new vulnerabilities discovered after the audit go undetected
SCALABILITY — The rapid pace of DeFi innovation far exceeds the capacity of the manual auditing workforce`,
        icon: AlertTriangle,
      },
    ],
  },
  {
    number: "03",
    title: "SECURITHM ARCHITECTURE",
    sections: [
      {
        subtitle: "SYSTEM OVERVIEW",
        content: `Securithm employs a multi-layered architecture that combines multiple analysis techniques to achieve comprehensive coverage:

LAYER 1 — STATIC ANALYSIS ENGINE: Pattern-matching engine with 500+ vulnerability signatures, covering OWASP Smart Contract Top 10, SWC Registry, and custom DeFi-specific patterns. Uses abstract syntax tree (AST) traversal and control-flow graph (CFG) analysis for deep code inspection.

LAYER 2 — SYMBOLIC EXECUTION: Constraint-based path exploration that simulates all possible execution paths to detect complex logical vulnerabilities. Handles up to 10^6 paths per contract with intelligent path pruning for performance.

LAYER 3 — AI ANALYSIS ENGINE: Fine-tuned large language model (LLM) specializing in smart contract security. Analyzes code semantics, business logic, and economic attack vectors. Provides natural language explanations and fix suggestions.

LAYER 4 — DYNAMIC ANALYSIS: Runtime monitoring and fuzzing capabilities for deployed contracts. Detects time-dependent vulnerabilities, oracle manipulation, and sandwich attacks.`,
        icon: Layers,
      },
      {
        subtitle: "PIPELINE ARCHITECTURE",
        content: `The analysis pipeline processes contracts through a series of stages:

1. PRE-PROCESSING: Source code normalization, dependency resolution, and compilation verification
2. PARSING: Multi-language parser (Solidity 0.4.x-0.8.x, Vyper, Rust/Anchor) generating unified AST
3. STATIC ANALYSIS: Parallel execution of 500+ analysis rules across distributed worker nodes
4. SYMBOLIC EXECUTION: Path exploration with SMT solver integration (Z3) for constraint satisfaction
5. AI ANALYSIS: Semantic analysis using context-aware LLM with RAG (Retrieval-Augmented Generation) for pattern reference
6. AGGREGATION: Cross-referencing findings, deduplication, and severity scoring
7. REPORTING: Structured finding output with severity ratings, code snippets, and fix suggestions

Average processing time for a standard contract: 45 seconds. For complex protocols: 3-8 minutes.`,
        icon: Cpu,
      },
    ],
  },
  {
    number: "04",
    title: "VULNERABILITY DETECTION METHODOLOGY",
    sections: [
      {
        subtitle: "STATIC ANALYSIS RULES ENGINE",
        content: `Our detection engine employs a hierarchical rule system:

CRITICAL (CVSS 9.0-10.0): Unauthorized fund drainage, infinite minting, self-destruct abuse, unchecked low-level calls, reentrancy (cross-function, cross-contract), delegatecall injection, storage collision, arbitrary write

HIGH (CVSS 7.0-8.9): Flash loan attacks, oracle manipulation, timestamp dependence, tx.origin auth, front-running, unchecked return values, integer overflow/underflow, access control bypass, signature replay

MEDIUM (CVSS 4.0-6.9): DoS via unexpected revert, gas griefing, unchecked external calls, improper input validation, race conditions, business logic flaws, centralization risks

LOW (CVSS 0.1-3.9): Gas optimization opportunities, code quality issues, stylistic recommendations, missing events, unused variables

Each rule includes contextual metadata: affected SWC entries, known real-world exploits, fix examples, and CVSS vector strings for standardized severity assessment.`,
        icon: Search,
      },
      {
        subtitle: "AI-POWERED SEMANTIC ANALYSIS",
        content: `Our AI analysis engine represents a significant advancement over traditional pattern-matching approaches:

CONTEXT UNDERSTANDING: The fine-tuned model understands business logic, tokenomics, and protocol-specific patterns, enabling it to detect vulnerabilities that span multiple functions or contracts.

ECONOMIC ATTACK VECTORS: The model is trained on historical DeFi attack data, enabling it to identify economic attack patterns such as price manipulation, liquidity extraction, and arbitrage opportunities.

FIX GENERATION: For each detected vulnerability, the AI generates context-aware fix suggestions with specific code modifications, test cases, and deployment considerations.

CONTINUOUS LEARNING: The model is regularly fine-tuned on new vulnerability disclosures, attack reports, and community-contributed patterns, ensuring detection capabilities remain current.

Our benchmarks show a 23% improvement in detection of business logic vulnerabilities compared to traditional static analysis alone, while reducing false positives by 35%.`,
        icon: Zap,
      },
    ],
  },
  {
    number: "05",
    title: "RISK SCORING MODEL",
    content: `Securithm employs a multi-factor risk scoring model that evaluates contracts across five dimensions:

1. VULNERABILITY SEVERITY (40% weight): Number and severity of findings, categorized by CVSS scores
2. EXPLOITABILITY (25% weight): Ease of exploitation, required attacker privileges, value at risk
3. BUSINESS IMPACT (20% weight): Contract TVL, user base, protocol dependencies, market impact
4. CODE QUALITY (10% weight): Code complexity, test coverage, documentation, upgradeability patterns
5. HISTORICAL CONTEXT (5% weight): Protocol age, previous incidents, team reputation, audit history

The final risk score is calculated as:
RISK_SCORE = min(100, max(0, Σ(weight_i × score_i)))

GRADE CLASSIFICATION:
A (0-20): AUDITED — Secure contract with no significant findings
B (21-40): LOW RISK — Minor issues detected, recommended to address
C (41-45): MODERATE — Security concerns requiring attention
D (46-60): HIGH RISK — Significant vulnerabilities, avoid until fixed
F (61-100): CRITICAL — Severe vulnerabilities, immediate risk of fund loss

CONFIDENCE LEVELS:
HIGH: Comprehensive analysis complete with multi-engine agreement
MEDIUM: Analysis complete with some engine disagreement
LOW: Limited analysis due to code complexity or missing dependencies`,
    icon: BarChart3,
  },
  {
    number: "06",
    title: "CONTINUOUS MONITORING",
    content: `Beyond point-in-time audits, Securithm provides real-time monitoring for deployed contracts:

ON-CHAIN SURVEILLANCE: Monitors contract state changes, unusual transaction patterns, and potential attack indicators across Ethereum, Base, Arbitrum, Polygon, and BNB Chain.

ANOMALY DETECTION: Statistical models identify abnormal behavior including unexpected function calls, unusual gas consumption, and rapid state changes.

ALERT PIPELINE: Multi-channel alert delivery (Slack, Discord, Email, Webhook) with configurable severity thresholds and escalation policies.

AUTOMATED RESPONSE: Enterprise plans include automated incident response workflows, including transaction simulation, emergency pause recommendations, and post-mortem generation.

Monitoring latency averages 2.3 seconds from transaction confirmation to alert delivery, enabling teams to respond to threats in real-time.`,
    icon: Globe,
  },
  {
    number: "07",
    title: "PERFORMANCE BENCHMARKS",
    content: `Securithm has been benchmarked against industry-standard testing datasets:

DETECTION RATES:
Reentrancy: 99.2% (Industry avg: 87%)
Access Control: 96.8% (Industry avg: 82%)
Flash Loan: 94.1% (Industry avg: 76%)
Oracle Manipulation: 91.5% (Industry avg: 71%)
Business Logic: 89.3% (Industry avg: 58%)
Overall: 94.7% (Industry avg: 74.8%)

PERFORMANCE METRICS:
Average scan time (standard contract): 45s
Average scan time (complex protocol): 4.2m
Maximum concurrent scans: 10,000+/hour
False positive rate: 8.2%
API availability (last 12 months): 99.97%

SCALE:
Vulnerability patterns: 500+
Supported languages: 3 (Solidity, Vyper, Rust)
Supported chains: 6 (Ethereum, Base, Arbitrum, Polygon, BSC, Solana)
Contracts analyzed: 50,000+`,
    icon: BarChart3,
  },
  {
    number: "08",
    title: "SECURITY & COMPLIANCE",
    content: `Securithm takes a defense-in-depth approach to its own security architecture:

INFRASTRUCTURE SECURITY:
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- SOC 2 Type II certification in progress
- GDPR and CCPA compliant data handling
- Role-based access control with MFA enforcement

CODE SECURITY:
- All platform smart contracts audited by third-party firms
- Bug bounty program with rewards up to $100,000
- Regular penetration testing (quarterly)
- Dependency vulnerability scanning (weekly)

DATA PRIVACY:
- Source code encrypted per-tenant with separate keys
- Automatic code purging after configurable retention period
- No storage of private keys or wallet credentials
- Audit logging with 1-year retention

COMPLIANCE FRAMEWORK:
- SOC 2 Type II (in progress — expected Q1 2027)
- ISO 27001 (planned Q2 2027)
- GDPR compliance (implemented)
- CCPA compliance (implemented)`,
    icon: Lock,
  },
  {
    number: "09",
    title: "TOKENOMICS & ECONOMIC MODEL",
    content: `Securithm operates on a tiered subscription model designed to serve teams of all sizes:

FREE TIER — $0/month
50 scans per month
1 monitored contract
Basic vulnerability detection
GitHub Action integration
Community support

PRO TIER — $29/month
500 scans per month
10 monitored contracts
AI fix suggestions
Team seats (5 members)
Slack/Discord alerts
Email support

TEAM TIER — $99/month
2,000 scans per month
50 monitored contracts
Remediation workflow
Unlimited team seats
Custom thresholds
Priority support

ENTERPRISE — Custom pricing
Unlimited scans
Unlimited monitoring
Risk Score API access
SOC 2 compliance docs
Dedicated SLAs (99.95%)
Dedicated support

For high-volume users, we offer usage-based pricing at $0.10 per additional scan, with volume discounts available for commitments above 10,000 scans/month. Enterprise plans include dedicated infrastructure options for teams with specific compliance or performance requirements.`,
    icon: TrendingUp,
  },
  {
    number: "10",
    title: "FUTURE ROADMAP",
    content: `Q3 2026:
- Cross-chain invariant monitoring
- Advanced fuzzing engine integration
- Formal verification module (Certora integration)
- Enhanced Rust/Anchor support

Q4 2026:
- MEV protection analysis
- Gas optimization recommendations
- Private mempool detection
- Custom rule creation SDK

Q1 2027:
- Zero-knowledge proof verification
- Move language support (Aptos, Sui)
- Automated exploit simulation
- On-chain insurance integration

Q2 2027:
- WASM-based contract support
- AI-powered exploit prediction
- Decentralized audit marketplace
- Open-source detection engine

Our long-term vision is a fully automated security layer for the entire blockchain ecosystem, where every contract is continuously monitored and protected against emerging threats in real-time.`,
    icon: TrendingUp,
  },
];


export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Title Page */}
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM WHITEPAPER
            </span>
            <span className="ml-auto text-[9px] text-[var(--color-term-muted)] font-mono">
              v1.0 — July 2026
            </span>
          </div>

          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="text-center mb-10 pb-10 border-b border-[var(--color-term-border)]">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center border-2 border-[var(--color-term-fg)]">
                  <Shield className="h-8 w-8 text-[var(--color-term-fg)]" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-3">
                SECURITHM WHITEPAPER
              </h1>
              <p className="text-sm text-[var(--color-term-muted)] font-mono max-w-3xl mx-auto mb-4">
                A COMPREHENSIVE FRAMEWORK FOR AUTOMATED SMART CONTRACT SECURITY ANALYSIS
              </p>
              <div className="text-[10px] text-[var(--color-term-muted)] font-mono max-w-xl mx-auto leading-relaxed">
                Combining Static Analysis, Symbolic Execution, and AI-Powered Detection
                for Next-Generation Blockchain Security
              </div>
            </div>

            {/* Abstract */}
            <div className="mb-10 p-4 border border-[var(--color-term-border)] bg-[var(--color-term-dim)]">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-[var(--color-term-fg)]" />
                <span className="text-[10px] font-bold text-[var(--color-term-fg)] uppercase tracking-wider">ABSTRACT</span>
              </div>
              <p className="text-[11px] text-[var(--color-term-fg)] font-mono leading-relaxed italic">
                "This whitepaper presents Securithm, a multi-layered smart contract security analysis platform
                that integrates static analysis, symbolic execution, and artificial intelligence to detect
                vulnerabilities in blockchain-based smart contracts. We demonstrate that our hybrid approach
                achieves a 94.7% detection rate across known vulnerability classes while maintaining a false
                positive rate of 8.2%. The platform processes contracts in under 45 seconds on average and
                supports continuous monitoring for deployed contracts across six blockchain networks.
                We present the technical architecture, detection methodology, risk scoring model, and
                economic analysis of the Securithm platform."
              </p>
            </div>

            {/* Table of Contents */}
            <div className="mb-10">
              <h2 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider mb-3 term-glow">
                TABLE OF CONTENTS
              </h2>
              <div className="grid sm:grid-cols-2 gap-1">
                {sections.map((section) => (
                  <a
                    key={section.number}
                    href={`#section-${section.number}`}
                    className="flex items-center gap-2 p-1.5 text-[9px] font-mono text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)] transition-colors"
                  >
                    <span className="text-[var(--color-term-fg)] font-bold">{section.number}.</span>
                    {section.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {sections.map((section) => (
                <div
                  key={section.number}
                  id={`section-${section.number}`}
                  className="border border-[var(--color-term-border)] p-4 sm:p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center border border-[var(--color-term-fg)] text-[var(--color-term-fg)]">
                      <span className="text-[10px] font-bold font-mono">{section.number}</span>
                    </div>
                    <h2 className="text-sm font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
                      {section.title}
                    </h2>
                  </div>

                  {section.sections ? (
                    <div className="space-y-4">
                      {section.sections.map((sub) => (
                        <div key={sub.subtitle} className="space-y-2">
                          <h3 className="text-[10px] font-bold text-[var(--color-term-fg)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <sub.icon className="h-3 w-3" />
                            {sub.subtitle}
                          </h3>
                          <p className="text-[11px] text-[var(--color-term-muted)] font-mono leading-relaxed whitespace-pre-line">
                            {sub.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--color-term-muted)] font-mono leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Conclusion */}
            <div className="mt-8 p-4 border border-[var(--color-term-fg)] bg-[var(--color-term-dim)]">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="h-4 w-4 text-[var(--color-term-fg)]" />
                <span className="text-[10px] font-bold text-[var(--color-term-fg)] uppercase tracking-wider">CONCLUSION</span>
              </div>
              <p className="text-[11px] text-[var(--color-term-fg)] font-mono leading-relaxed">
                Securithm represents a significant advancement in automated smart contract security analysis.
                By combining multiple analysis techniques with AI-powered semantic understanding, we achieve
                detection rates that approach and in some areas exceed those of manual expert audits, while
                reducing analysis time from weeks to seconds.                Our platform's ability to provide continuous
                monitoring means that vulnerabilities can be detected and remediated before exploitation,
                fundamentally changing the economics of blockchain security.

                We invite the research community, security professionals, and protocol teams to engage with
                our platform, contribute to our detection patterns database, and help us build a more secure
                decentralized future.
              </p>
            </div>

            {/* References */}
            <div className="mt-6">
              <h2 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider mb-3 term-glow">
                REFERENCES
              </h2>
              <div className="space-y-1 text-[9px] font-mono text-[var(--color-term-muted)]">
                {[
                  "[1] Atzei, N., Bartoletti, M., & Cimoli, T. (2017). A Survey of Attacks on Ethereum Smart Contracts.",
                  "[2] SWC Registry. Smart Contract Weakness Classification and Test Cases. https://swcregistry.io",
                  "[3] Luu, L., Chu, D.-H., Olickel, H., Saxena, P., & Hobor, A. (2016). Making Smart Contracts Smarter.",
                  "[4] Kalra, S., Goel, S., Dhawan, M., & Sharma, S. (2018). ZEUS: Analyzing Safety of Smart Contracts.",
                  "[5] Mueller, B. (2018). Mythril: Security Analysis of Ethereum Smart Contracts.",
                  "[6] Zhang, P., Xiao, Y., & Wang, H. (2020). S-gram: Towards Semantic-Aware Security Auditing.",
                  "[7] Reentrancy Guardian. Cross-Chain Reentrancy Detection Using Dynamic Analysis. SECURITHM Labs, 2025.",
                  "[8] DeFi Attack Database. REKT News. https://rekt.news",
                  "[9] OWASP. Smart Contract Top 10. https://owasp.org/www-project-smart-contract-top-10",
                  "[10] Certora. Formal Verification of Smart Contracts. https://certora.com",
                ].map((ref, i) => (
                  <div key={i} className="p-1 hover:bg-[var(--color-term-dim)] transition-colors">
                    {ref}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-term-border)] pt-4 mt-8">
              <div className="flex items-center justify-between text-[9px] text-[var(--color-term-muted)] font-mono">
                <span>© 2026 Securithm Labs. All rights reserved.</span>
                <a
                  href="/docs"
                  className="flex items-center gap-1 hover:text-[var(--color-term-fg)] transition-colors"
                >
                  BACK TO DOCS <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
