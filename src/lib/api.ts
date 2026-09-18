const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}


export interface Scan {
  id: string;
  org_id: string | null;
  user_id: string | null;
  contract_source: string | null;
  chain: string | null;
  status: "pending" | "running" | "completed" | "failed";
  risk_score_overall: string | null;
  contract_name: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  findings: Finding[];
}

export interface Finding {
  id: string;
  scan_id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "informational";
  severity_order: number;
  line_number: number | null;
  code_snippet: string | null;
  description: string;
  suggested_fix: string | null;
  fixed_code: string | null;
  assigned_to: string | null;
  status: "open" | "in_progress" | "resolved" | "wont_fix";
  remediation_sla: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ScanListResponse {
  items: Scan[];
  total: number;
  page: number;
  page_size: number;
}

export interface ScanCreateRequest {
  contract_source: string;
  chain: string;
  contract_name?: string;
  input_mode?: string;
}

export interface RiskScoreResponse {
  chain: string;
  address: string;
  risk_score: number;
  grade: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  last_scanned: string | null;
  confidence: string;
}

export interface MonitoredContract {
  id: string;
  org_id: string;
  contract_address: string;
  chain: string;
  label: string | null;
  status: "healthy" | "warning" | "critical";
  created_at: string;
  last_checked: string | null;
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}`,
    }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}

// ─── Scans ───────────────────────────────────────────────────

export async function createScan(
  data: ScanCreateRequest
): Promise<Scan> {
  return request<Scan>("/api/v1/scans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listScans(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  chain?: string;
}): Promise<ScanListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.page_size) searchParams.set("page_size", String(params.page_size));
  if (params?.status) searchParams.set("status", params.status);
  if (params?.chain) searchParams.set("chain", params.chain);

  const query = searchParams.toString();
  return request<ScanListResponse>(`/api/v1/scans${query ? `?${query}` : ""}`);
}

export async function getScan(id: string): Promise<Scan> {
  return request<Scan>(`/api/v1/scans/${id}`);
}


// ─── Findings ────────────────────────────────────────────────

export async function listFindings(params?: {
  scan_id?: string;
  severity?: string;
  status?: string;
}): Promise<Finding[]> {
  const searchParams = new URLSearchParams();
  if (params?.scan_id) searchParams.set("scan_id", params.scan_id);
  if (params?.severity) searchParams.set("severity", params.severity);
  if (params?.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return request<Finding[]>(`/api/v1/findings${query ? `?${query}` : ""}`);
}


// ─── Findings Update ─────────────────────────────────────────

export async function updateFinding(
  findingId: string,
  data: {
    status?: string;
    assigned_to?: string | null;
    remediation_sla?: string | null;
  }
): Promise<Finding> {
  return request<Finding>(`/api/v1/findings/${findingId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}


// ─── Risk Score ──────────────────────────────────────────────

export async function getRiskScore(
  chain: string,
  address: string
): Promise<RiskScoreResponse> {
  return request<RiskScoreResponse>(
    `/api/v1/risk-score/${chain}/${address}`
  );
}

export async function getRiskScoreHistory(
  chain: string,
  address: string
): Promise<RiskScoreResponse[]> {
  return request<RiskScoreResponse[]>(
    `/api/v1/risk-score/${chain}/${address}/history`
  );
}

// ─── Monitoring ──────────────────────────────────────────────

export async function listMonitoredContracts(): Promise<MonitoredContract[]> {
  return request<MonitoredContract[]>("/api/v1/monitored-contracts");
}

// ─── Team ────────────────────────────────────────────────────

export async function inviteTeamMember(data: {
  email: string;
  message?: string;
}): Promise<{
  id: string;
  email: string;
  status: string;
  message: string | null;
  created_at: string;
}> {
  return request("/api/v1/team/invite", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listTeamInvites(): Promise<
  Array<{
    id: string;
    email: string;
    status: string;
    message: string | null;
    expires_at: string | null;
    created_at: string;
  }>
> {
  return request("/api/v1/team/invites");
}

export async function acceptInvite(inviteId: string): Promise<{
  id: string;
  email: string;
  status: string;
  message: string | null;
}> {
  return request(`/api/v1/team/invite/${inviteId}/accept`, {
    method: "PATCH",
  });
}

export async function declineInvite(inviteId: string): Promise<{
  id: string;
  email: string;
  status: string;
  message: string | null;
}> {
  return request(`/api/v1/team/invite/${inviteId}/decline`, {
    method: "PATCH",
  });
}

export async function cancelInvite(inviteId: string): Promise<void> {
  return request(`/api/v1/team/invite/${inviteId}`, {
    method: "DELETE",
  });
}

export interface TeamMember {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  last_login: string | null;
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  return request("/api/v1/team/members");
}

export async function changeMemberRole(
  userId: string,
  role: "admin" | "member" | "viewer"
): Promise<TeamMember> {
  return request(`/api/v1/team/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(userId: string): Promise<void> {
  return request(`/api/v1/team/members/${userId}`, {
    method: "DELETE",
  });
}

// ─── Auth ────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{
  access_token: string;
  token_type: string;
  user_id: string;
}> {
  return request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
  display_name?: string,
  invite_id?: string
): Promise<{ access_token: string; token_type: string; user_id: string }> {
  return request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name, invite_id }),
  });
}

export async function getMe(): Promise<{
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  role: string | null;
  org_name: string | null;
  created_at: string;
  last_login: string | null;
  org_id: string | null;
}> {
  return request("/api/v1/auth/me");
}

export async function updateMe(data: {
  display_name?: string;
  email?: string;
  wallet_address?: string | null;
}): Promise<{
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  created_at: string;
  last_login: string | null;
  org_id: string | null;
}> {
  return request("/api/v1/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export type AuthUser = Awaited<ReturnType<typeof getMe>>;

// ─── Solvency (Proof of Reserves & Solvency) ───────────────

export interface SolvencyOrg {
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

export interface DeclaredAsset {
  asset_address?: string | null;
  symbol: string;
  decimals: number;
  balance?: string | null;
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

export interface UserProof {
  snapshotId: string;
  leafIndex: number;
  balance: string;
  nonce: string;
  commitment: string;
  merkleProof: string[];
  liabilityRoot: string;
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

export interface SnapshotCreateResponse {
  snapshotId: string;
  orgSlug: string;
  orgName: string;
  status: string;
  message: string;
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
  attestationId: string;
  public_url: string;
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

export interface PublicDashboard {
  orgSlug: string;
  orgName: string;
  website: string | null;
  description: string | null;
  methodologyVersion: string;
  currency: string;
  hasAttestation: boolean;
  latestAttestation: {
    id: string;
    reserveRoot: string | null;
    liabilityRoot: string | null;
    coverageRatio: string;
    status: string;
    createdAt: string;
    expiresAt: string | null;
    signature: string | null;
    payload: Record<string, unknown> | null;
  } | null;
  solvency: {
    reserveValueUsd: string;
    liabilityValueUsd: string;
    coverageRatio: string;
    coveragePercent: string;
    status: string;
  } | null;
  reserves: Array<{
    wallet: string;
    symbol: string;
    balance: string;
    price: string;
    priceSource: string;
    valueUsd: string;
    evidenceStatus: string;
    blockHeight: string | null;
  }>;
  wallets: Array<{
    address: string;
    label: string | null;
    chain: string;
    verificationStatus: string;
    verificationMethod: string;
  }>;
  liabilityRoot: string | null;
  liabilityTotal: string | null;
  liabilityUserCount: string | null;
  snapshotTimestamp: string | null;
  blockHeight: string | null;
  priceSources: string[];
  requiredCoverage: string;
  targetCoverage: string;
  strongCoverage: string;
}

export async function createSolvencyProfile(data: {
  slug: string;
  display_name: string;
  website?: string;
  description?: string;
  is_public?: boolean;
  required_coverage?: string;
  target_coverage?: string;
  strong_coverage?: string;
}): Promise<SolvencyOrg> {
  return request<SolvencyOrg>("/api/v1/solvency/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSolvencyProfile(): Promise<SolvencyOrg> {
  return request<SolvencyOrg>("/api/v1/solvency/profile");
}

export async function updateSolvencyProfile(
  data: Partial<{
    slug: string;
    display_name: string;
    website: string | null;
    description: string | null;
    is_public: boolean;
    required_coverage: string;
    target_coverage: string;
    strong_coverage: string;
  }>
): Promise<SolvencyOrg> {
  return request<SolvencyOrg>("/api/v1/solvency/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function addReserveWallet(data: {
  chain?: string;
  address: string;
  label?: string;
  verification_method?: string;
  declared_assets?: DeclaredAsset[];
}): Promise<ReserveWallet> {
  return request<ReserveWallet>("/api/v1/solvency/wallets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listReserveWallets(): Promise<ReserveWallet[]> {
  return request<ReserveWallet[]>("/api/v1/solvency/wallets");
}

export async function deleteReserveWallet(walletId: string): Promise<void> {
  return request(`/api/v1/solvency/wallets/${walletId}`, {
    method: "DELETE",
  });
}

export async function getWalletChallenge(walletId: string): Promise<{
  message: string;
  walletAddress: string;
}> {
  return request(`/api/v1/solvency/wallets/${walletId}/challenge`);
}

export async function verifyWalletSignature(
  walletId: string,
  message: string,
  signature: string
): Promise<ReserveWallet> {
  return request<ReserveWallet>(
    `/api/v1/solvency/wallets/${walletId}/verify-signature`,
    {
      method: "POST",
      body: JSON.stringify({ message, signature }),
    }
  );
}

export async function attestReserveWallet(walletId: string): Promise<ReserveWallet> {
  return request<ReserveWallet>(`/api/v1/solvency/wallets/${walletId}/attest`, {
    method: "POST",
  });
}

export async function createLiabilitySnapshot(data: {
  entries: Array<{ user_ref: string; balance: string }>;
}): Promise<LiabilitySnapshot> {
  return request<LiabilitySnapshot>("/api/v1/solvency/liabilities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listLiabilitySnapshots(): Promise<LiabilitySnapshot[]> {
  return request<LiabilitySnapshot[]>("/api/v1/solvency/liabilities");
}

export async function getUserProof(
  snapshotId: string,
  userRef: string
): Promise<UserProof> {
  return request<UserProof>(
    `/api/v1/solvency/liabilities/${snapshotId}/proof?user_ref=${encodeURIComponent(
      userRef
    )}`
  );
}

export async function verifyUserProof(data: {
  snapshotId: string;
  leafIndex: number;
  balance: string;
  nonce: string;
  commitment: string;
  liabilityRoot: string;
  merkleProof: string[];
}): Promise<{ result: "INCLUDED" | "INVALID"; detail: string; snapshotId: string; liabilityRoot: string }> {
  return request("/api/v1/solvency/liabilities/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function generateSolvencySnapshot(): Promise<SnapshotCreateResponse> {
  return request<SnapshotCreateResponse>("/api/v1/solvency/snapshots", {
    method: "POST",
  });
}

export async function listReserveSnapshots(): Promise<ReserveSnapshot[]> {
  return request<ReserveSnapshot[]>("/api/v1/solvency/snapshots");
}

export async function getReserveSnapshot(snapshotId: string): Promise<ReserveSnapshot> {
  return request<ReserveSnapshot>(`/api/v1/solvency/snapshots/${snapshotId}`);
}

export async function listSolvencyAlerts(): Promise<SolvencyAlert[]> {
  return request<SolvencyAlert[]>("/api/v1/solvency/alerts");
}

export async function getPublicDashboard(slug: string): Promise<PublicDashboard> {
  return request<PublicDashboard>(`/api/v1/solvency/public/${slug}`);
}

export async function getAttestation(
  attestationId: string,
  verify = false
): Promise<Attestation> {
  return request<Attestation>(
    `/api/v1/solvency/attestation/${attestationId}${verify ? "?verify=true" : ""}`
  );
}

export async function seedSolvencyDemo(): Promise<{
  orgSlug: string;
  orgName: string;
  reused: boolean;
  public_url: string;
  attestationId: string | null;
  solvency?: {
    reserveValueUsd: string;
    liabilityValueUsd: string;
    coverageRatio: string;
    coveragePercent: string;
    status: string;
  };
}> {
  return request("/api/v1/solvency/demo", {
    method: "POST",
  });
}

export interface PublishOnChainResponse {
  attestationId: string;
  chain: string;
  contractAddress: string;
  txHash: string;
  explorerUrl: string;
  status: string;
}

export interface OnChainStatus {
  published: boolean;
  txHash: string | null;
  chain: string | null;
  contractAddress: string | null;
  explorerUrl: string | null;
  verified: boolean | null;
  stored: {
    reserveRoot: string;
    liabilityRoot: string;
    reserveValueUsd: string;
    liabilityValueUsd: string;
    timestamp: string | null;
  } | null;
  detail: string | null;
}

/**
 * Download the attestation export (JSON or PDF) as a file attachment.
 * Public endpoint — no auth required, but the token is attached when present.
 */
export async function downloadAttestation(
  attestationId: string,
  format: "json" | "pdf"
): Promise<void> {
  const url = `${API_BASE}/api/v1/solvency/attestation/${attestationId}/export?format=${format}`;
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `Download failed: ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `attestation_${attestationId}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function publishAttestationOnChain(
  attestationId: string,
  body: { chain?: string; rpc_url?: string; contract_address?: string }
): Promise<PublishOnChainResponse> {
  return request<PublishOnChainResponse>(
    `/api/v1/solvency/attestation/${attestationId}/publish`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function getAttestationOnChain(
  attestationId: string
): Promise<OnChainStatus> {
  return request<OnChainStatus>(
    `/api/v1/solvency/attestation/${attestationId}/onchain`
  );
}
