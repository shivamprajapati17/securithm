/**
 * Solvency (Proof of Reserves) store — implements the pipeline:
 * reserve wallets → valued assets → reserve snapshot, declared liabilities →
 * merkle-rooted liability snapshot, coverage ratio vs thresholds, signed
 * attestation and threshold alerts. In-memory across warm requests.
 */

import crypto from "crypto";
import { getAppSecret } from "@/lib/app-secret";

export interface SolvencyProfile {
  id: string;
  org_id: string;
  slug: string;
  display_name: string;
  website: string | null;
  description: string | null;
  is_public: boolean;
  methodology_version: string;
  currency: string;
  required_coverage: string;
  target_coverage: string;
  strong_coverage: string;
  created_at: string;
  updated_at: string | null;
}

export interface ReserveWallet {
  id: string;
  org_id: string;
  chain: string;
  address: string;
  label: string | null;
  verification_method: "signature" | "transaction" | "custodian_attestation";
  verification_status: "directly_verified" | "attested" | "unverified";
  verification_evidence: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface LiabilitySnapshot {
  id: string;
  org_id: string;
  timestamp: string;
  liability_root: string;
  total_liabilities: string;
  tree_type: string;
  methodology_version: string;
  user_count: string;
  created_at: string;
}

export interface ReserveAsset {
  id: string;
  snapshot_id: string;
  chain: string;
  wallet_address: string;
  asset_address: string | null;
  symbol: string;
  balance: string;
  price: string;
  price_source: string;
  price_timestamp: string | null;
  value_usd: string;
  block_height: string | null;
  evidence_status: "directly_verified" | "attested" | "unverified";
}

export interface ReserveSnapshot {
  id: string;
  org_id: string;
  timestamp: string;
  block_height: string | null;
  reserve_root: string | null;
  total_value_usd: string | null;
  methodology_version: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  assets: ReserveAsset[];
}

export interface SolvencyAlert {
  id: string;
  org_id: string;
  alert_type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  value: string | null;
  threshold: string | null;
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
}

export interface Attestation {
  id: string;
  org_id: string;
  snapshot_id: string | null;
  liability_snapshot_id: string | null;
  reserve_root: string | null;
  liability_root: string | null;
  reserve_value: string;
  liability_value: string;
  coverage_ratio: string;
  status: "verified" | "pending" | "expired";
  signature: string | null;
  payload: Record<string, unknown> | null;
  published_tx: string | null;
  created_at: string;
  expires_at: string | null;
}

// Deterministic demo price feed (USD). Real implementation would call an
// oracle/price API; documented as a static reference table.
const PRICES: Record<string, number> = {
  ETH: 3500, WETH: 3500, stETH: 3500, BTC: 65000, WBTC: 65000,
  USDC: 1, USDT: 1, DAI: 1, SOL: 160, MATIC: 0.6,
};

const METHODOLOGY = "securithm-por-v1";

interface OrgState {
  profile: SolvencyProfile | null;
  wallets: ReserveWallet[];
  liabilities: LiabilitySnapshot[];
  reserves: ReserveSnapshot[];
  alerts: SolvencyAlert[];
  attestations: Attestation[];
  challenges: Map<string, string>; // walletId -> nonce
  entriesBySnapshot: Map<string, LiabilityEntry[]>; // snapshotId -> entries
}

const g = globalThis as unknown as {
  __securithm_solvency?: Map<string, OrgState>;
};

function org(orgId: string): OrgState {
  g.__securithm_solvency ??= new Map();
  let state = g.__securithm_solvency.get(orgId);
  if (!state) {
    state = {
      profile: null,
      wallets: [],
      liabilities: [],
      reserves: [],
      alerts: [],
      attestations: [],
      challenges: new Map(),
      entriesBySnapshot: new Map(),
    };
    g.__securithm_solvency.set(orgId, state);
  }
  return state;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function merkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return sha256("empty");
  let level = leaves.map(sha256);
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(sha256(level[i] + (level[i + 1] ?? level[i])));
    }
    level = next;
  }
  return level[0];
}

function signPayload(payload: string): string {
  const secret = getAppSecret();
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ─── Profile ────────────────────────────────────────────────────────────────

export function getSolvencyProfile(orgId: string): SolvencyProfile | null {
  return org(orgId).profile;
}

export function upsertSolvencyProfile(
  orgId: string,
  data: Partial<SolvencyProfile> & { display_name: string }
): SolvencyProfile {
  const state = org(orgId);
  const existing = state.profile;
  const now = new Date().toISOString();
  if (existing) {
    Object.assign(existing, data, { updated_at: now });
    return existing;
  }
  const profile: SolvencyProfile = {
    id: crypto.randomUUID(),
    org_id: orgId,
    slug: (data.slug || data.display_name || "org")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "org",
    display_name: data.display_name,
    website: data.website ?? null,
    description: data.description ?? null,
    is_public: data.is_public ?? true,
    methodology_version: METHODOLOGY,
    currency: "USD",
    required_coverage: data.required_coverage ?? "100",
    target_coverage: data.target_coverage ?? "150",
    strong_coverage: data.strong_coverage ?? "200",
    created_at: now,
    updated_at: null,
  };
  state.profile = profile;
  return profile;
}

// ─── Wallets ────────────────────────────────────────────────────────────────

export function listWallets(orgId: string): ReserveWallet[] {
  return org(orgId).wallets;
}

export function addWallet(
  orgId: string,
  data: { chain: string; address: string; label?: string | null; verification_method?: ReserveWallet["verification_method"] }
): ReserveWallet {
  const wallet: ReserveWallet = {
    id: crypto.randomUUID(),
    org_id: orgId,
    chain: data.chain || "ethereum",
    address: data.address,
    label: data.label ?? null,
    verification_method: data.verification_method ?? "unverified" as unknown as ReserveWallet["verification_method"],
    verification_status: "unverified",
    verification_evidence: null,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  org(orgId).wallets.push(wallet);
  return wallet;
}

export function deleteWallet(orgId: string, walletId: string): boolean {
  const state = org(orgId);
  const idx = state.wallets.findIndex((w) => w.id === walletId);
  if (idx === -1) return false;
  state.wallets.splice(idx, 1);
  return true;
}

export function getWalletChallenge(orgId: string, walletId: string): string | null {
  const wallet = org(orgId).wallets.find((w) => w.id === walletId);
  if (!wallet) return null;
  const nonce = crypto.randomBytes(16).toString("hex");
  org(orgId).challenges.set(walletId, nonce);
  return nonce;
}

export function attestWallet(orgId: string, walletId: string): ReserveWallet | null {
  const wallet = org(orgId).wallets.find((w) => w.id === walletId);
  if (!wallet) return null;
  wallet.verification_status = "attested";
  wallet.verification_method = "custodian_attestation";
  wallet.verification_evidence = { attested_at: new Date().toISOString() };
  return wallet;
}

// ─── Liabilities ────────────────────────────────────────────────────────────

export interface LiabilityEntry {
  user_ref: string;
  balance: string;
}

export function parseLiabilities(text: string): LiabilityEntry[] {
  const entries: LiabilityEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/[,\t;]/).map((p) => p.trim());
    if (parts.length < 2) continue;
    const balance = Number(parts[1]);
    if (!Number.isFinite(balance)) continue;
    entries.push({ user_ref: parts[0], balance: String(balance) });
  }
  return entries;
}

export function createLiabilitySnapshot(
  orgId: string,
  entries: LiabilityEntry[]
): LiabilitySnapshot {
  const leaves = entries.map((e) => `${e.user_ref}:${e.balance}`);
  const total = entries.reduce((sum, e) => sum + Number(e.balance || 0), 0);
  const snap: LiabilitySnapshot = {
    id: crypto.randomUUID(),
    org_id: orgId,
    timestamp: new Date().toISOString(),
    liability_root: merkleRoot(leaves),
    total_liabilities: total.toFixed(2),
    tree_type: "sha256-merkle",
    methodology_version: METHODOLOGY,
    user_count: String(entries.length),
    created_at: new Date().toISOString(),
  };
  org(orgId).liabilities.unshift(snap);
  org(orgId).entriesBySnapshot.set(snap.id, entries);
  return snap;
}

export function listLiabilitySnapshots(orgId: string): LiabilitySnapshot[] {
  return org(orgId).liabilities;
}

export function buildUserProof(
  orgId: string,
  snapshotId: string,
  userRef: string
): { proof: string[]; index: number; balance: string; root: string; nonce: string } | null {
  const snap = org(orgId).liabilities.find((s) => s.id === snapshotId);
  if (!snap) return null;
  // Entries are persisted alongside the snapshot for proof generation.
  const entries = org(orgId).entriesBySnapshot.get(snapshotId) ?? [];
  const leaves = entries.map((e) => `${e.user_ref}:${e.balance}`);
  const index = entries.findIndex((e) => e.user_ref === userRef);
  if (index === -1) return null;
  const proof: string[] = [];
  let level = leaves.map(sha256);
  let i = index;
  while (level.length > 1) {
    const sibling = i ^ 1;
    if (sibling < level.length) proof.push(level[sibling]);
    const next: string[] = [];
    for (let j = 0; j < level.length; j += 2) {
      next.push(sha256(level[j] + (level[j + 1] ?? level[j])));
    }
    level = next;
    i = Math.floor(i / 2);
  }
  const nonce = sha256(`${userRef}:${snap.id}`).slice(0, 32);
  return {
    proof,
    index,
    balance: entries[index].balance,
    root: snap.liability_root,
    nonce,
  };
}

// ─── Reserve snapshot pipeline ──────────────────────────────────────────────

function valueWallet(wallet: ReserveWallet, snapshotId: string): ReserveAsset[] {
  const assets: ReserveAsset[] = [];
  // Demo balances per wallet (deterministic). A live implementation would
  // query the chain RPC for each declared asset.
  const demoBalances: Array<{ symbol: string; balance: number }> = [
    { symbol: "ETH", balance: 420.5 },
    { symbol: "USDC", balance: 8_250_000 },
    { symbol: "WBTC", balance: 18.4 },
  ];
  for (const { symbol, balance } of demoBalances) {
    const price = PRICES[symbol] ?? 0;
    assets.push({
      id: crypto.randomUUID(),
      snapshot_id: snapshotId,
      chain: wallet.chain,
      wallet_address: wallet.address,
      asset_address: null,
      symbol,
      balance: String(balance),
      price: String(price),
      price_source: "static-reference",
      price_timestamp: new Date().toISOString(),
      value_usd: (balance * price).toFixed(2),
      block_height: null,
      evidence_status: wallet.verification_status === "directly_verified"
        ? "directly_verified"
        : wallet.verification_status === "attested"
        ? "attested"
        : "unverified",
    });
  }
  return assets;
}

export interface SnapshotResult {
  snapshot: ReserveSnapshot;
  attestation: Attestation;
  solvency: {
    reserveValueUsd: string;
    liabilityValueUsd: string;
    coverageRatio: string;
    coveragePercent: string;
    status: "solvent" | "under-collateralized";
    requiredCoverage: string;
    targetCoverage: string;
    strongCoverage: string;
  };
}

export function generateReserveSnapshot(orgId: string): SnapshotResult {
  const state = org(orgId);
  const profile = state.profile ?? upsertSolvencyProfile(orgId, { display_name: "Securithm Demo Org" });

  // Ensure wallets + liabilities exist (first run on a fresh org).
  if (state.wallets.length === 0) {
    addWallet(orgId, {
      chain: "ethereum",
      address: "0x8E6Cb2B987f163B2E63Ad0AB92d3b8CDb8e5E4F1",
      label: "Demo cold storage",
      verification_method: "custodian_attestation",
    });
  }
  if (state.liabilities.length === 0) {
    createLiabilitySnapshot(
      orgId,
      parseLiabilities(
        "user_001,1200000\nuser_002,4500000\nuser_003,850000\nuser_004,2300000\nuser_005,15000000\nuser_006,300000"
      )
    );
  }

  const latestLiability = state.liabilities[0];
  const snapshotId = crypto.randomUUID();
  const now = new Date().toISOString();

  const assets = state.wallets.flatMap((w) => valueWallet(w, snapshotId));
  const totalValue = assets.reduce((sum, a) => sum + Number(a.value_usd || 0), 0);
  const reserveRoot = merkleRoot(assets.map((a) => `${a.wallet_address}:${a.symbol}:${a.balance}`));

  const snapshot: ReserveSnapshot = {
    id: snapshotId,
    org_id: orgId,
    timestamp: now,
    block_height: null,
    reserve_root: reserveRoot,
    total_value_usd: totalValue.toFixed(2),
    methodology_version: METHODOLOGY,
    status: "completed",
    created_at: now,
    assets,
  };
  state.reserves.unshift(snapshot);

  const liabilityValue = Number(latestLiability?.total_liabilities ?? 0);
  const coverageRatio = liabilityValue > 0 ? totalValue / liabilityValue : 0;
  const required = Number(profile.required_coverage || 100);

  const payload = {
    methodology: METHODOLOGY,
    reserve_root: reserveRoot,
    liability_root: latestLiability?.liability_root ?? null,
    reserve_value_usd: totalValue.toFixed(2),
    liability_value_usd: liabilityValue.toFixed(2),
    coverage_ratio: coverageRatio.toFixed(4),
    generated_at: now,
  };
  const attestation: Attestation = {
    id: crypto.randomUUID(),
    org_id: orgId,
    snapshot_id: snapshotId,
    liability_snapshot_id: latestLiability?.id ?? null,
    reserve_root: reserveRoot,
    liability_root: latestLiability?.liability_root ?? null,
    reserve_value: totalValue.toFixed(2),
    liability_value: liabilityValue.toFixed(2),
    coverage_ratio: coverageRatio.toFixed(4),
    status: "verified",
    signature: signPayload(JSON.stringify(payload)),
    payload,
    published_tx: null,
    created_at: now,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  };
  state.attestations.unshift(attestation);

  // Threshold alerts
  const target = Number(profile.target_coverage || 150);
  if (coverageRatio * 100 < required) {
    state.alerts.unshift({
      id: crypto.randomUUID(),
      org_id: orgId,
      alert_type: "coverage_breach",
      severity: "critical",
      message: `Coverage ${(coverageRatio * 100).toFixed(1)}% is below the required ${required}%`,
      value: (coverageRatio * 100).toFixed(1),
      threshold: String(required),
      status: "open",
      created_at: now,
    });
  } else if (coverageRatio * 100 < target) {
    state.alerts.unshift({
      id: crypto.randomUUID(),
      org_id: orgId,
      alert_type: "coverage_warning",
      severity: "medium",
      message: `Coverage ${(coverageRatio * 100).toFixed(1)}% is below the ${target}% target`,
      value: (coverageRatio * 100).toFixed(1),
      threshold: String(target),
      status: "open",
      created_at: now,
    });
  }

  return {
    snapshot,
    attestation,
    solvency: {
      reserveValueUsd: totalValue.toFixed(2),
      liabilityValueUsd: liabilityValue.toFixed(2),
      coverageRatio: coverageRatio.toFixed(4),
      coveragePercent: (coverageRatio * 100).toFixed(1),
      status: coverageRatio * 100 >= required ? "solvent" : "under-collateralized",
      requiredCoverage: profile.required_coverage,
      targetCoverage: profile.target_coverage,
      strongCoverage: profile.strong_coverage,
    },
  };
}

export function listReserveSnapshots(orgId: string): ReserveSnapshot[] {
  return org(orgId).reserves;
}

export function listSolvencyAlerts(orgId: string): SolvencyAlert[] {
  return org(orgId).alerts;
}

export function latestAttestation(orgId: string): Attestation | null {
  return org(orgId).attestations[0] ?? null;
}
