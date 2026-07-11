import { SecurithmError } from "./types.js";

export interface ClientOptions {
  /** API key for authentication */
  apiKey?: string;
  /** Base URL for the API (defaults to production) */
  baseUrl?: string;
}

/**
 * Low-level HTTP client for the Securithm API.
 * Handles authentication headers, JSON parsing, and error responses.
 */
export class HttpClient {
  private authToken: string | null = null;
  private apiKey: string | undefined;
  public readonly baseUrl: string;

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://securithm.vercel.app/_/backend";
  }

  /** Set the Bearer token for subsequent requests. */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /** Get the current auth token. */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Make an HTTP request to the Securithm API.
   *
   * @param path - API path (e.g., "/api/v1/scans")
   * @param options - Fetch options (method, body, etc.)
   * @returns Parsed JSON response
   */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Prefer auth token, fall back to API key
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    } else if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        ...options,
      });
    } catch (err) {
      throw new SecurithmError(
        0,
        `Network error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // Use default detail
      }
      throw new SecurithmError(response.status, detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /** Make a GET request. */
  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  /** Make a POST request. */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /** Make a PATCH request. */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /** Make a DELETE request. */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}
