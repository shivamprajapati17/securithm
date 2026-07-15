import { HttpClient, type ClientOptions } from "./client.js";

import { AuthEndpoint } from "./endpoints/auth.js";
import { ScansEndpoint } from "./endpoints/scans.js";
import { FindingsEndpoint } from "./endpoints/findings.js";
import { RiskScoreEndpoint } from "./endpoints/risk-score.js";
import { MonitoringEndpoint } from "./endpoints/monitoring.js";
import { NFTEndpoint } from "./endpoints/nft.js";
import { TokenEndpoint } from "./endpoints/token.js";
import { PaymentsEndpoint } from "./endpoints/payments.js";
import { TeamEndpoint } from "./endpoints/team.js";
import { ApiKeysEndpoint } from "./endpoints/api-keys.js";

export * from "./types.js";
export { HttpClient, type ClientOptions };

/**
 * Securithm SDK Client.
 *
 * Provides a typed interface to the Securithm API for smart contract
 * security analysis, monitoring, and team management.
 *
 * @example
 * ```typescript
 * import { Securithm } from "securithm";
 *
 * const client = new Securithm({ apiKey: "aai_live_sk_..." });
 *
 * // Auth
 * const { access_token } = await client.auth.login({
 *   email: "dev@example.com",
 *   password: "password123",
 * });
 * client.setAuthToken(access_token);
 *
 * // Scan a contract
 * const scan = await client.scans.create({
 *   contract_source: "0x...",
 *   chain: "ethereum",
 * });
 * ```
 */
export class Securithm {
  /** Auth endpoints — login, register, profile */
  readonly auth: AuthEndpoint;
  /** Scan endpoints — submit and monitor security scans */
  readonly scans: ScansEndpoint;
  /** Findings endpoints — manage security findings */
  readonly findings: FindingsEndpoint;
  /** Risk score endpoints — get contract risk scores */
  readonly riskScore: RiskScoreEndpoint;
  /** Monitoring endpoints — watch deployed contracts */
  readonly monitoring: MonitoringEndpoint;
  /** NFT endpoints — analyze NFT collections */
  readonly nft: NFTEndpoint;
  /** Token endpoints — analyze token contracts */
  readonly token: TokenEndpoint;
  /** Payments endpoints — billing plans and usage */
  readonly payments: PaymentsEndpoint;
  /** Team endpoints — invite and manage team members */
  readonly team: TeamEndpoint;
  /** API Keys endpoints — manage API keys */
  readonly apiKeys: ApiKeysEndpoint;

  private http: HttpClient;

  /**
   * @param options - Client configuration
   * @param options.apiKey - API key from the Securithm dashboard
   * @param options.baseUrl - API base URL (defaults to production)
   */
  constructor(options: ClientOptions = {}) {
    this.http = new HttpClient(options);
    this.auth = new AuthEndpoint(this.http);
    this.scans = new ScansEndpoint(this.http);
    this.findings = new FindingsEndpoint(this.http);
    this.riskScore = new RiskScoreEndpoint(this.http);
    this.monitoring = new MonitoringEndpoint(this.http);
    this.nft = new NFTEndpoint(this.http);
    this.token = new TokenEndpoint(this.http);
    this.payments = new PaymentsEndpoint(this.http);
    this.team = new TeamEndpoint(this.http);
    this.apiKeys = new ApiKeysEndpoint(this.http);
  }

  /**
   * Set the Bearer auth token for subsequent API requests.
   * After logging in, call this with the `access_token` from the response.
   */
  setAuthToken(token: string | null): void {
    this.http.setAuthToken(token);
  }

  /**
   * Get the current auth token, if any.
   */
  getAuthToken(): string | null {
    return this.http.getAuthToken();
  }

  /**
   * Convenience method to authenticate and set the token in one call.
   *
   * @example
   * ```typescript
   * await client.login({ email: "dev@example.com", password: "password123" });
   * // client is now authenticated — no need to call setAuthToken separately
   * ```
   */
  async login(data: { email: string; password: string }): Promise<{
    access_token: string;
    token_type: string;
    user_id: string;
  }> {
    const result = await this.auth.login(data);
    this.setAuthToken(result.access_token);
    return result;
  }

  /**
   * Convenience method to register and set the token in one call.
   */
  async register(data: {
    email: string;
    password: string;
    display_name?: string;
    invite_id?: string;
  }): Promise<{
    access_token: string;
    token_type: string;
    user_id: string;
  }> {
    const result = await this.auth.register(data);
    this.setAuthToken(result.access_token);
    return result;
  }
}

/** Default export for convenience. */
export default Securithm;
