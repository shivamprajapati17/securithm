import { HttpClient } from "../client.js";
import type {
  Finding,
  FindingListParams,
  FindingUpdateRequest,
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
}
