import { HttpClient } from "../client.js";
import type {
  ScanCreateRequest,
  Scan,
  ScanListResponse,
  ScanListParams,
} from "../types.js";

export class ScansEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Submit a new scan for security analysis. */
  async create(data: ScanCreateRequest): Promise<Scan> {
    return this.client.post<Scan>("/api/v1/scans", data);
  }

  /** List scans with optional filtering. */
  async list(params?: ScanListParams): Promise<ScanListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.chain) searchParams.set("chain", params.chain);

    const query = searchParams.toString();
    return this.client.get<ScanListResponse>(`/api/v1/scans${query ? `?${query}` : ""}`);
  }

  /** Get a specific scan by ID. */
  async get(id: string): Promise<Scan> {
    return this.client.get<Scan>(`/api/v1/scans/${id}`);
  }

  /** Rescan a contract. */
  async rescan(id: string): Promise<Scan> {
    return this.client.post<Scan>(`/api/v1/scans/${id}/rescan`);
  }
}
