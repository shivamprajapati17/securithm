// ─── Auth Types ──────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string;
  invite_id?: string;
}

export interface UserResponse {
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
}

export interface UserUpdateRequest {
  display_name?: string;
  email?: string;
  wallet_address?: string | null;
}

// ─── Scan Types ──────────────────────────────────────────

export type ScanStatus = "pending" | "running" | "completed" | "failed";
export type FindingSeverity = "critical" | "high" | "medium" | "low" | "informational";
export type FindingStatus = "open" | "in_progress" | "resolved" | "wont_fix";
export type MonitoringStatus = "healthy" | "warning" | "critical";

export interface ScanCreateRequest {
  contract_source: string;
  chain: string;
  contract_name?: string;
  input_mode?: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  category: string;
  severity: FindingSeverity;
  severity_order: number;
  line_number: number | null;
  code_snippet: string | null;
  description: string;
  suggested_fix: string | null;
  fixed_code: string | null;
  assigned_to: string | null;
  status: FindingStatus;
  remediation_sla: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  org_id: string | null;
  user_id: string | null;
  contract_source: string | null;
  chain: string | null;
  status: ScanStatus;
  risk_score_overall: string | null;
  contract_name: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  findings: Finding[];
}

export interface ScanListResponse {
  items: Scan[];
  total: number;
  page: number;
  page_size: number;
}

export interface ScanListParams {
  page?: number;
  page_size?: number;
  status?: ScanStatus;
  chain?: string;
}

// ─── Finding Types ────────────────────────────────────────

export interface FindingListParams {
  scan_id?: string;
  severity?: FindingSeverity;
  status?: FindingStatus;
}

export interface FindingUpdateRequest {
  status?: FindingStatus;
  assigned_to?: string | null;
}

// ─── Risk Score Types ──────────────────────────────────────

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

// ─── Monitoring Types ─────────────────────────────────────

export interface MonitoredContractCreateRequest {
  contract_address: string;
  chain: string;
  label?: string;
}

export interface MonitoredContract {
  id: string;
  org_id: string;
  contract_address: string;
  chain: string;
  label: string | null;
  status: MonitoringStatus;
  created_at: string;
  last_checked: string | null;
}

export interface MonitoringEvent {
  id: string;
  monitored_contract_id: string;
  event_type: string;
  severity: string;
  message: string;
  tx_hash: string | null;
  timestamp: string;
  acknowledged: boolean;
}

// ─── NFT Types ─────────────────────────────────────────────

export interface NFTCollectionAnalysisResponse {
  contract_address: string;
  chain: string;
  collection_name: string;
  total_supply: number;
  security_score: number;
  risk_level: string;
  findings: Array<{
    category: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  is_verified: boolean;
  has_royalty_enforcement: boolean;
  has_allowlist: boolean;
  has_mint_authority_risk: boolean;
  analyzed_at: string;
}

export interface NFTCollectionListResponse {
  items: NFTCollectionAnalysisResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface NFTCollectionListParams {
  page?: number;
  page_size?: number;
  chain?: string;
}

// ─── Token Types ───────────────────────────────────────────

export interface TokenAnalysisRequest {
  token_type?: string;
}

export interface TokenAnalysisResponse {
  contract_address: string;
  chain: string;
  token_name: string;
  token_symbol: string;
  token_type: string;
  security_score: number;
  risk_level: string;
  findings: Array<{
    category: string;
    severity: string;
    description: string;
  }>;
  is_renounced: boolean;
  has_honeypot_risk: boolean;
  has_blacklist: boolean;
  has_tax: boolean;
  has_mint_function: boolean;
  analyzed_at: string;
}

export interface TokenListResponse {
  items: TokenAnalysisResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface TokenListParams {
  page?: number;
  page_size?: number;
  chain?: string;
  token_type?: string;
}

// ─── Payment / Billing Types ───────────────────────────────

export interface BillingPlanResponse {
  id: string;
  name: string;
  max_scans_per_month: number;
  max_monitored_contracts: number;
  price_usd: number;
}

export interface UsageMeterResponse {
  id: string;
  org_id: string;
  period: string;
  scans_used: number;
  api_calls_used: number;
}

export interface InvoiceResponse {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface PaymentsListResponse {
  plans: BillingPlanResponse[];
  current_plan: BillingPlanResponse | null;
  usage: UsageMeterResponse | null;
  invoices: InvoiceResponse[];
}

// ─── Team Types ────────────────────────────────────────────

export interface TeamInviteRequest {
  email: string;
  message?: string;
}

export interface TeamInviteResponse {
  id: string;
  email: string;
  status: string;
  message: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface TeamInviteActionResponse {
  id: string;
  email: string;
  status: string;
  message: string | null;
}

export interface TeamMember {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "admin" | "member" | "viewer";
  created_at: string;
  last_login: string | null;
}

export interface MemberRoleUpdate {
  role: "admin" | "member" | "viewer";
}

// ─── API Key Types ─────────────────────────────────────────

export interface ApiKeyCreateRequest {
  name: string;
  rate_limit_per_hour?: number;
}

export interface ApiKeyCreatedResponse {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  created_at: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit_per_hour: number;
  created_at: string;
  last_used_at: string | null;
}

export interface ApiKeyUpdateRequest {
  name?: string;
  rate_limit_per_hour?: number;
}

export interface ApiKeyUsageResponse {
  [keyId: string]: number;
}

// ─── Error Type ────────────────────────────────────────────

export class SecurithmError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "SecurithmError";
    this.status = status;
    this.detail = detail;
  }
}
