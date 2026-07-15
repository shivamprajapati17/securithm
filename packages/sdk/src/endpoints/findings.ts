import { HttpClient } from "../client.js";
import type {
  Finding,
  FindingListParams,
  FindingUpdateRequest,
  PublicFindingsListParams,
  PublicFindingsListResponse,
  PublicFindingsStats,
} from "../types.js";

export class FindingsEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** List findings with optional filtering. */
  async list(params?: FindingListParams): Promise<Finding[]> {
    const searchParams = new URLSearchParams();
    if (params?.scan_id) searchParams.set("scan_id", params.scan_id);
    if (params?.severity) searchParams.set("severity", params.severity);
    if (params?.status) searchParams.set("status", params.status);

    const query = searchParams.toString();
    return this.client.get<Finding[]>(`/api/v1/findings${query ? `?${query}` : ""}`);
  }

  /** Get a single finding by ID. */
  async get(id: string): Promise<Finding> {
    return this.client.get<Finding>(`/api/v1/findings/${id}`);
  }

  /** Update a finding (status, assignment, etc.). */
  async update(id: string, data: FindingUpdateRequest): Promise<Finding> {
    return this.client.patch<Finding>(`/api/v1/findings/${id}`, data);
  }

  // ─── Public API (API Key Auth) ──────────────────────────

  /**
   * List findings via the public API. Requires an API key set on the client.
   *
   * Returns findings enriched with assignee info (name, email, role).
   * Supports pagination and filtering.
   *
   * @example
   * ```typescript
   * const result = await client.findings.listPublic({ page: 1, page_size: 20, severity: "critical" });
   * console.log(result.items, result.total);
   * ```
   */
  async listPublic(params?: PublicFindingsListParams): Promise<PublicFindingsListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.severity) searchParams.set("severity", params.severity);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.assigned_to) searchParams.set("assigned_to", params.assigned_to);

    const query = searchParams.toString();
    return this.client.get<PublicFindingsListResponse>(`/api/v1/findings/public${query ? `?${query}` : ""}`);
  }

  /**
   * Get aggregate findings statistics via the public API. Requires an API key set on the client.
   *
   * Returns total counts, severity breakdown, status breakdown, assignment stats.
   *
   * @example
   * ```typescript
   * const stats = await client.findings.getStats();
   * console.log(stats.total_findings, stats.severity_breakdown);
   * ```
   */
  async getStats(): Promise<PublicFindingsStats> {
    return this.client.get<PublicFindingsStats>("/api/v1/findings/public/stats");
  }
}
