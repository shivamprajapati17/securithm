const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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
