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
