# Securithm Proof of Reserves & Proof of Solvency — Build Blueprint

**Version:** 0.1  
**Date:** August 2026  
**Project:** Securithm  
**Purpose:** Technical/product blueprint for adding verifiable Proof of Reserves (PoR), Proof of Liabilities (PoL), and Proof of Solvency (PoS) to Securithm.

---

## 1. Executive Summary

Securithm can evolve from an AI smart-contract security platform into a broader **Web3 Security & Solvency Infrastructure** platform.

The new module should verify three separate claims:

1. **Proof of Reserves (PoR):** the custodian/protocol controls the declared reserve assets.
2. **Proof of Liabilities (PoL):** the declared customer liabilities are committed to cryptographically and users can verify inclusion.
3. **Proof of Solvency:** the verified reserve value is sufficient to cover the verified liabilities under a clearly defined valuation policy.

Important: PoR alone is not proof of solvency. A complete solvency system must account for liabilities and clearly define what assets and liabilities are included.

---

# 2. Product Vision

## New Securithm modules

### Securithm Audit
Smart-contract vulnerability analysis.

### Securithm Monitor
Continuous on-chain anomaly monitoring.

### Securithm Solvency
Verifiable reserve, liability, and solvency infrastructure.

### Proposed positioning

> **Securithm — Security and Solvency Infrastructure for Web3**

---

# 3. Target Customers

- Centralized exchanges
- Crypto custodians
- Stablecoin issuers
- Lending protocols
- DeFi protocols
- Treasury managers
- Web3 funds
- Wallet/custody providers
- Institutional digital-asset platforms

---

# 4. Core User Flow

```text
Organization
    |
    +--> Connect reserve wallets
    |
    +--> Configure supported assets
    |
    +--> Import / calculate liabilities
    |
    +--> Generate cryptographic commitments
    |
    +--> Generate proofs
    |
    +--> Securithm verification engine
    |
    +--> Solvency calculation
    |
    +--> Publish attestation
    |
    +--> Continuous monitoring
```

---

# 5. What Securithm Must Prove

## 5.1 Reserves

For each reserve asset:

- wallet/address
- chain
- token/asset
- block height
- balance
- ownership/control evidence
- valuation source
- timestamp
- proof status

Example:

```json
{
  "asset": "ETH",
  "chain": "Ethereum",
  "wallet": "0x...",
  "balance": "1250.42",
  "blockHeight": 23456789,
  "valuationUsd": 4200000,
  "timestamp": 1780000000
}
```

---

## 5.2 Liabilities

Do not expose raw customer balances publicly.

Use a cryptographic commitment structure.

Recommended MVP:

**Merkle Sum Tree**

Each leaf contains a commitment derived from:

```text
user_id
balance
nonce
```

The tree commits to the aggregate liability.

Users should receive a private proof that their balance is included without exposing other users' balances.

For a stronger privacy architecture, evaluate Pedersen commitments and zero-knowledge proofs in Phase 2.

---

## 5.3 Solvency

The basic model:

```text
Verified Reserve Value
---------------------- >= 1.00
Verified Liability Value
```

Example:

```text
Verified reserves:     $125,000,000
Verified liabilities:  $100,000,000

Reserve Ratio = 125%

Solvency Status = SOLVENT
```

Do not label a system "solvent" based solely on this ratio. The product must disclose:

- included assets
- excluded assets
- valuation timestamp
- included liabilities
- excluded liabilities
- debt/encumbrances if known
- methodology
- proof freshness

---

# 6. Architecture

```text
                    Securithm Solvency
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
   Reserve Engine                     Liability Engine
          |                                 |
          v                                 v
 On-chain balances                    Liability dataset
 Wallet ownership                     Merkle Sum Tree
 Block snapshots                      ZK proof (future)
          |                                 |
          +---------------+-----------------+
                          |
                          v
                 Verification Engine
                          |
              +-----------+-----------+
              |                       |
              v                       v
       Valuation Engine        Proof Engine
              |                       |
              +-----------+-----------+
                          |
                          v
                  Solvency Engine
                          |
                          v
                  Attestation Layer
                          |
             +------------+------------+
             |                         |
             v                         v
        Public Dashboard          API / SDK
             |
             v
       Continuous Monitor
```

---

# 7. Reserve Engine

## Responsibilities

- Read blockchain balances
- Support multiple chains
- Support native assets
- Support ERC-20 style tokens
- Track block height
- Store historical snapshots
- Verify wallet ownership/control
- Detect reserve changes

## MVP chains

Reuse Securithm's existing supported ecosystems:

- Ethereum
- Base
- Arbitrum
- Polygon
- BNB Smart Chain
- Solana

---

# 8. Wallet Ownership Verification

A wallet balance is not automatically proof that an organization owns the wallet.

The system should support:

### Method A — Message signature

Organization signs a Securithm challenge.

```text
Securithm Challenge
        |
        v
Organization Wallet
        |
   Sign message
        |
        v
Signature verification
```

### Method B — Transaction proof

For wallets unable to sign messages, use controlled verification procedures.

### Method C — Custodian attestation

For institutional custodians, accept signed third-party attestations with clear trust labels.

Every reserve should show an evidence type:

```text
DIRECTLY_VERIFIED
ATTESTED
UNVERIFIED
```

---

# 9. Liability Engine

## MVP

Build a Merkle Sum Tree.

Conceptually:

```text
                     Root
                  /        \
              Node A       Node B
             /     \       /     \
           L1       L2    L3       L4
```

Each leaf contains:

```text
commitment = H(user_id || balance || nonce)
amount = balance
```

Each parent contains:

```text
parent_amount = left_amount + right_amount
parent_hash   = H(left_hash || right_hash || parent_amount)
```

The root becomes the liability commitment.

---

# 10. User Verification

A user receives:

```json
{
  "snapshotId": "snap_001",
  "leafIndex": 1234,
  "balance": "2500.00",
  "nonce": "...",
  "merkleProof": ["...", "..."],
  "liabilityRoot": "0x..."
}
```

The user can independently verify:

```text
User balance
      |
      v
Leaf commitment
      |
      v
Merkle proof
      |
      v
Published root
```

The result should be:

```text
INCLUDED
```

or

```text
INVALID
```

---

# 11. Privacy Upgrade

The MVP Merkle Sum Tree can reveal more aggregate information than desired.

Phase 2 should evaluate:

- Pedersen commitments
- Zero-knowledge range proofs
- ZK Merkle inclusion proofs
- ZK proof of total liabilities
- Hidden total user count
- Negative-balance prevention
- Overflow protection

The goal:

```text
User knows:
"My balance is included."

Public does NOT learn:
- other users' balances
- individual identities
- unnecessary account information
```

---

# 12. Valuation Engine

Solvency requires a common valuation unit.

Recommended base currency:

**USD**

For every asset:

```text
token balance
      x
reference price
      =
USD reserve value
```

The valuation record should contain:

- price
- price source
- timestamp
- confidence/freshness
- chain
- asset identifier

Avoid allowing the organization to manually choose arbitrary prices without labeling them.

---

# 13. Price Source Architecture

```text
             Asset
               |
       +-------+-------+
       |               |
       v               v
  Primary Source   Secondary Source
       |               |
       +-------+-------+
               |
               v
        Price Validator
               |
               v
        Valuation Engine
```

Use multiple sources where practical.

Future integration options:

- Oracle networks
- Exchange reference prices
- Institutional market-data providers

---

# 14. Solvency Engine

## Core calculation

```text
Total Verified Reserve Value
/
Total Verified Liability Value
=
Reserve Ratio
```

Example:

```text
Assets      = $150M
Liabilities = $120M

Ratio = 1.25

Coverage = 125%
```

## Status

```text
ratio >= 1.00
    |
    +--> SOLVENT

ratio < 1.00
    |
    +--> UNDER-COLLATERALIZED
```

For production, add configurable buffers:

```text
Required Coverage = 100%
Target Coverage   = 110%
Strong Coverage   = 120%+
```

Do not use these thresholds as universal financial standards; they are product policy and should be configurable.

---

# 15. Attestation Model

Each snapshot should create a signed, immutable record.

Example:

```json
{
  "attestationId": "att_001",
  "snapshotId": "snap_001",
  "chain": "multi-chain",
  "reserveRoot": "0x...",
  "liabilityRoot": "0x...",
  "reserveValueUsd": "150000000",
  "liabilityValueUsd": "120000000",
  "coverageRatio": "1.25",
  "generatedAt": "2026-08-11T00:00:00Z",
  "expiresAt": "2026-08-12T00:00:00Z",
  "methodologyVersion": "0.1",
  "status": "VERIFIED"
}
```

---

# 16. On-Chain Attestation Contract

Deploy a minimal smart contract that stores attestation hashes.

Conceptual interface:

```solidity
interface ISecurithmAttestation {
    function publishAttestation(
        bytes32 attestationId,
        bytes32 reserveRoot,
        bytes32 liabilityRoot,
        uint256 reserveValue,
        uint256 liabilityValue,
        uint256 timestamp
    ) external;

    function getAttestation(
        bytes32 attestationId
    ) external view returns (
        bytes32 reserveRoot,
        bytes32 liabilityRoot,
        uint256 reserveValue,
        uint256 liabilityValue,
        uint256 timestamp
    );
}
```

The contract should store commitments and metadata, not private customer data.

---

# 17. Public Dashboard

## Main screen

```text
SECURITHM SOLVENCY

Verified Reserves
$150.2M

Verified Liabilities
$120.1M

Coverage
125.0%

Status
✓ VERIFIED

Last Snapshot
11 Aug 2026
```

---

# 18. Transparency Panel

Every organization should have a public methodology section.

Display:

### Reserves

- Wallets
- Chains
- Assets
- Block heights
- Verification method

### Liabilities

- Snapshot time
- Commitment root
- Methodology
- Number of eligible accounts, if disclosure is acceptable

### Valuation

- Price sources
- Pricing timestamp
- Currency

### Solvency

- Formula
- Coverage ratio
- Threshold
- Exceptions

---

# 19. API

## Create snapshot

```http
POST /api/v1/snapshots
```

## Get snapshot

```http
GET /api/v1/snapshots/:id
```

## Get reserves

```http
GET /api/v1/reserves/:snapshotId
```

## Get liability root

```http
GET /api/v1/liabilities/:snapshotId
```

## Verify user proof

```http
POST /api/v1/liabilities/verify
```

## Get solvency result

```http
GET /api/v1/solvency/:snapshotId
```

## Get public attestation

```http
GET /api/v1/attestations/:id
```

---

# 20. Suggested Database Model

## organizations

```text
id
name
slug
created_at
```

## reserve_wallets

```text
id
organization_id
chain
address
verification_method
verification_status
created_at
```

## reserve_snapshots

```text
id
organization_id
timestamp
block_height
reserve_root
total_value_usd
methodology_version
status
```

## reserve_assets

```text
id
snapshot_id
chain
asset_address
symbol
balance
price
price_source
value_usd
```

## liability_snapshots

```text
id
organization_id
timestamp
liability_root
total_liabilities
tree_type
methodology_version
```

## attestations

```text
id
organization_id
snapshot_id
reserve_root
liability_root
reserve_value
liability_value
coverage_ratio
signature
published_tx
created_at
```

## alerts

```text
id
organization_id
type
severity
value
threshold
status
created_at
```

---

# 21. Continuous Monitoring

After the first attestation, Securithm should continuously monitor:

### Reserves

- Large outflows
- Reserve wallet changes
- Unexpected balance drops
- New reserve addresses
- Asset concentration

### Liabilities

- New snapshot
- Liability growth
- Liability/reserve divergence

### Solvency

```text
Coverage ratio falls below threshold
             |
             v
          Alert
             |
       +-----+-----+
       |           |
       v           v
 Dashboard      Webhook
```

---

# 22. Alert Examples

```text
CRITICAL

Coverage ratio dropped from 121% to 97%.

Verified reserves:
$97M

Verified liabilities:
$100M

Action:
Review reserve movement immediately.
```

```text
HIGH

Reserve wallet 0xABC... moved
$12.4M USDC to an unknown address.

Action:
Verify transaction and wallet ownership.
```

---

# 23. Security Requirements

The system must defend against:

- Double-counted reserves
- Fake reserve addresses
- Borrowed temporary assets
- Negative liability balances
- Duplicate user entries
- Integer overflow
- Stale prices
- Stale snapshots
- Manipulated price feeds
- Incorrect chain balances
- Fake wallet ownership
- Replay attacks
- Malformed proofs
- Unauthorized attestation publication

---

# 24. Critical Design Rule

Never make the statement:

> "Securithm proves the company is financially solvent."

Instead state:

> "Securithm verifies a defined set of reserves and liabilities under the published methodology and calculates the resulting coverage ratio."

This distinction is critical.

Proof systems can verify cryptographic claims, but they do not automatically prove that all real-world liabilities or legal obligations have been disclosed.

---

# 25. MVP Scope

Build these first:

### Phase 1

- Ethereum
- ERC-20 + native ETH
- Wallet ownership signature
- Reserve snapshots
- Merkle Sum Tree
- User inclusion proof
- Reserve valuation
- Liability valuation
- Solvency ratio
- Public dashboard
- PDF/JSON attestation
- API

### Phase 2

- Base
- Arbitrum
- Polygon
- BNB Chain
- Solana
- On-chain attestation
- Continuous monitoring
- Alerts
- Webhooks

### Phase 3

- ZK liabilities
- Private balance verification
- Advanced oracle architecture
- Institutional APIs
- Portfolio solvency
- Third-party auditor workflow

---

# 26. Recommended Tech Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Recharts

## Backend

- Node.js
- TypeScript
- PostgreSQL
- Redis
- BullMQ

## Blockchain

- viem / ethers
- Solana web3 libraries
- RPC providers

## Cryptography

MVP:

- Keccak-256
- Merkle Sum Tree

Future:

- Pedersen commitments
- ZK circuits
- Noir / equivalent ZK framework
- Solidity verifier contracts

## Storage

- PostgreSQL for metadata
- Object storage for signed reports
- IPFS optional for public attestations

---

# 27. Repository Structure

```text
securithm/
│
├── apps/
│   ├── web/
│   ├── api/
│   └── verifier/
│
├── packages/
│   ├── crypto/
│   ├── merkle-sum-tree/
│   ├── valuation/
│   ├── chains/
│   └── sdk/
│
├── contracts/
│   └── SecurithmAttestation.sol
│
├── circuits/
│   └── liabilities/
│
├── workers/
│   ├── reserve-snapshot/
│   ├── valuation/
│   └── monitoring/
│
├── docs/
│   ├── methodology.md
│   ├── security.md
│   └── verification.md
│
└── tests/
```

---

# 28. Verification Philosophy

Every published result should answer:

1. What was measured?
2. When was it measured?
3. Which block was used?
4. Which wallets were included?
5. How was wallet control verified?
6. How were liabilities committed?
7. Which prices were used?
8. Which liabilities were excluded?
9. Can a user independently verify inclusion?
10. Can an external party reproduce the calculation?

---

# 29. Roadmap

## Q3 2026

- Architecture
- Reserve engine
- Ethereum MVP
- Merkle Sum Tree
- Solvency dashboard

## Q4 2026

- Multi-chain reserves
- On-chain attestations
- Continuous monitoring
- API/SDK

## Q1 2027

- ZK Proof of Liabilities
- Privacy-preserving user verification
- Institutional dashboard
- Portfolio solvency

## Future

- Standardized attestations
- Ecosystem integrations
- Third-party verification marketplace
- Cross-chain reserve intelligence

---

# 30. Success Metrics

Do not optimize only for number of scans.

Track:

- Verified organizations
- Verified reserve value
- Verified liability value
- Number of attestations
- Proof verification success rate
- Average snapshot generation time
- Average proof verification time
- Monitoring alerts detected
- Time to detect reserve anomalies
- Time to resolve solvency alerts

---

# 31. Investor/Product Narrative

Securithm can evolve from:

> **"AI-powered smart-contract security."**

into:

> **"The security and solvency layer for Web3."**

The product stack becomes:

```text
             SECURITHM
                 |
       +---------+---------+
       |         |         |
       v         v         v
     AUDIT    MONITOR   SOLVENCY
       |         |         |
       v         v         v
    Code Risk  Live Risk Financial Risk
       |         |         |
       +---------+---------+
                 |
                 v
        WEB3 TRUST INFRASTRUCTURE
```

---

# 32. Important References

Ethereum's cryptographic state structures demonstrate how Merkle-based commitments can provide independently verifiable proofs of state. See Ethereum's Merkle Patricia Trie documentation.

Chainlink's technical discussion of Proof of Solvency explains the distinction between Proof of Reserves, Proof of Liabilities, and solvency, and discusses Summation Merkle Trees and privacy-preserving variants.

OKX's open-source Proof of Reserves implementation provides a practical reference for combining reserve/liability verification with zk-STARK-based validation.

These references should inform the implementation but should not be copied as a security design without independent review.

---

# 33. Final Build Principle

Securithm Solvency should not simply publish a number.

It should publish a **verifiable evidence chain**:

```text
Wallet
  ↓
Balance
  ↓
Ownership Proof
  ↓
Reserve Snapshot
  ↓
Asset Valuation
  ↓
Liability Commitment
  ↓
User Inclusion Proof
  ↓
Liability Total
  ↓
Solvency Calculation
  ↓
Cryptographic Attestation
  ↓
Public Verification
  ↓
Continuous Monitoring
```

That is the foundation for turning Securithm from a smart-contract security tool into a broader **Web3 trust infrastructure platform**.
