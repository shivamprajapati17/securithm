import { HttpClient } from "../client.js";
import type {
  TokenAnalysisResponse,
  TokenListResponse,
  TokenListParams,
  TokenAnalysisRequest,
} from "../types.js";

export class TokenEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Analyze a token contract for security risks. */
  async analyze(
    chain: string,
    address: string,
    params?: TokenAnalysisRequest
  ): Promise<TokenAnalysisResponse> {
    const searchParams = new URLSearchParams();
    if (params?.token_type) searchParams.set("token_type", params.token_type);

    const query = searchParams.toString();
    return this.client.get<TokenAnalysisResponse>(
      `/api/v1/token/analyze/${encodeURIComponent(chain)}/${encodeURIComponent(address)}${query ? `?${query}` : ""}`
    );
  }

  /** List analyzed tokens. */
  async list(params?: TokenListParams): Promise<TokenListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.chain) searchParams.set("chain", params.chain);
    if (params?.token_type) searchParams.set("token_type", params.token_type);

    const query = searchParams.toString();
    return this.client.get<TokenListResponse>(
      `/api/v1/token/list${query ? `?${query}` : ""}`
    );
  }
}
