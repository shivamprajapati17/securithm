import { HttpClient } from "../client.js";
import type {
  NFTCollectionAnalysisResponse,
  NFTCollectionListResponse,
  NFTCollectionListParams,
} from "../types.js";

export class NFTEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Analyze an NFT collection for security risks. */
  async analyze(chain: string, address: string): Promise<NFTCollectionAnalysisResponse> {
    return this.client.get<NFTCollectionAnalysisResponse>(
      `/api/v1/nft/analyze/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`
    );
  }

  /** List analyzed NFT collections. */
  async listCollections(params?: NFTCollectionListParams): Promise<NFTCollectionListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.chain) searchParams.set("chain", params.chain);

    const query = searchParams.toString();
    return this.client.get<NFTCollectionListResponse>(
      `/api/v1/nft/collections${query ? `?${query}` : ""}`
    );
  }
}
