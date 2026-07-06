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

export interface FindingUpdateRequest {
  status?: string;
  assigned_to?: string;
  remediation_sla?: string;
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

export interface MonitoringEvent {
  id: string;
  monitored_contract_id: string;
  event_type: string;
  severity: string;
  message: string;
  event_data: Record<string, unknown> | null;
  tx_hash: string | null;
  timestamp: string;
  acknowledged: boolean;
}

async function request<T>(
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

export async function rescanContract(id: string): Promise<Scan> {
  return request<Scan>(`/api/v1/scans/${id}/rescan`, {
    method: "POST",
  });
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

export async function updateFinding(
  id: string,
  data: FindingUpdateRequest
): Promise<Finding> {
  return request<Finding>(`/api/v1/findings/${id}`, {
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

export async function getContractEvents(
  contractId: string
): Promise<MonitoringEvent[]> {
  return request<MonitoringEvent[]>(
    `/api/v1/monitored-contracts/${contractId}/events`
  );
}

export async function addMonitoredContract(data: {
  contract_address: string;
  chain: string;
  label?: string;
}): Promise<MonitoredContract> {
  return request<MonitoredContract>("/api/v1/monitored-contracts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── NFT API ─────────────────────────────────────────────────

export interface NFTSecurityFinding {
  category: string;
  severity: string;
  description: string;
  recommendation?: string;
}

export interface NFTCollectionAnalysis {
  contract_address: string;
  chain: string;
  collection_name: string | null;
  total_supply: number | null;
  security_score: number;
  risk_level: string;
  findings: NFTSecurityFinding[];
  is_verified: boolean;
  has_royalty_enforcement: boolean;
  has_allowlist: boolean;
  has_mint_authority_risk: boolean;
  analyzed_at: string;
}

export async function analyzeNFTCollection(
  chain: string,
  address: string
): Promise<NFTCollectionAnalysis> {
  return request<NFTCollectionAnalysis>(
    `/api/v1/nft/analyze/${chain}/${address}`
  );
}

// ─── Token API ───────────────────────────────────────────────

export interface TokenRiskFinding {
  category: string;
  severity: string;
  description: string;
  recommendation?: string;
}

export interface TokenAnalysis {
  contract_address: string;
  chain: string;
  token_name: string | null;
  token_symbol: string | null;
  token_type: string;
  total_supply: string | null;
  holder_count: number | null;
  security_score: number;
  risk_level: string;
  findings: TokenRiskFinding[];
  is_renounced: boolean | null;
  has_honeypot_risk: boolean;
  has_blacklist: boolean;
  has_tax: boolean;
  has_mint_function: boolean;
  analyzed_at: string;
}

export async function analyzeToken(
  chain: string,
  address: string,
  tokenType?: string
): Promise<TokenAnalysis> {
  const params = tokenType ? `?token_type=${tokenType}` : "";
  return request<TokenAnalysis>(
    `/api/v1/token/analyze/${chain}/${address}${params}`
  );
}

// ─── Payments / Billing API ──────────────────────────────────

export interface BillingPlan {
  id: string;
  name: string;
  max_scans_per_month: number;
  max_monitored_contracts: number;
  price_usd: number;
  features: string[];
}

export interface UsageMeter {
  period: string;
  scans_used: number;
  scans_limit: number;
  api_calls_used: number;
  api_calls_limit: number;
}

export interface Invoice {
  id: string;
  amount_usd: number;
  status: string;
  issued_at: string;
  paid_at: string | null;
  description: string;
  pdf_url: string | null;
}

export interface PaymentsDashboard {
  plans: BillingPlan[];
  current_plan: BillingPlan | null;
  usage: UsageMeter | null;
  payment_methods: unknown[];
  invoices: Invoice[];
}

export async function listPlans(): Promise<BillingPlan[]> {
  return request<BillingPlan[]>("/api/v1/payments/plans");
}

export async function getUsage(): Promise<UsageMeter> {
  return request<UsageMeter>("/api/v1/payments/usage");
}

export async function getPaymentsDashboard(): Promise<PaymentsDashboard> {
  return request<PaymentsDashboard>("/api/v1/payments/dashboard");
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
  display_name?: string
): Promise<{ access_token: string; token_type: string; user_id: string }> {
  return request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name }),
  });
}

export async function getMe(): Promise<{
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login: string | null;
  org_id: string | null;
}> {
  return request("/api/v1/auth/me");
}

export type AuthUser = Awaited<ReturnType<typeof getMe>>;
