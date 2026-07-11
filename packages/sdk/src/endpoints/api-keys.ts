import { HttpClient } from "../client.js";
import type {
  ApiKeyCreateRequest,
  ApiKeyCreatedResponse,
  ApiKeyResponse,
  ApiKeyUpdateRequest,
  ApiKeyUsageResponse,
} from "../types.js";

export class ApiKeysEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Create a new API key. */
  async create(data: ApiKeyCreateRequest): Promise<ApiKeyCreatedResponse> {
    return this.client.post<ApiKeyCreatedResponse>("/api/v1/api-keys", data);
  }

  /** List all API keys for the authenticated user. */
  async list(): Promise<ApiKeyResponse[]> {
    return this.client.get<ApiKeyResponse[]>("/api/v1/api-keys");
  }

  /** Update an API key (name or rate limit). */
  async update(keyId: string, data: ApiKeyUpdateRequest): Promise<ApiKeyResponse> {
    return this.client.patch<ApiKeyResponse>(`/api/v1/api-keys/${keyId}`, data);
  }

  /** Revoke an API key. */
  async revoke(keyId: string): Promise<void> {
    return this.client.delete<void>(`/api/v1/api-keys/${keyId}`);
  }

  /** Get API key usage statistics. */
  async getUsage(): Promise<ApiKeyUsageResponse> {
    return this.client.get<ApiKeyUsageResponse>("/api/v1/api-keys/usage");
  }
}
