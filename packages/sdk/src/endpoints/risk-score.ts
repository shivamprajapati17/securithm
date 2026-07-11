import { HttpClient } from "../client.js";
import type { RiskScoreResponse } from "../types.js";

export class RiskScoreEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Get the risk score for a contract address. */
  async get(chain: string, address: string): Promise<RiskScoreResponse> {
    return this.client.get<RiskScoreResponse>(
      `/api/v1/risk-score/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`
    );
  }

  /** Get historical risk scores for a contract address. */
  async getHistory(chain: string, address: string): Promise<RiskScoreResponse[]> {
    return this.client.get<RiskScoreResponse[]>(
      `/api/v1/risk-score/${encodeURIComponent(chain)}/${encodeURIComponent(address)}/history`
    );
  }
}
