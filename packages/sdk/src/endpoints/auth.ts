import { HttpClient } from "../client.js";
import type {
  LoginRequest,
  TokenResponse,
  RegisterRequest,
  UserResponse,
  UserUpdateRequest,
} from "../types.js";

export class AuthEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Log in with email and password. */
  async login(data: LoginRequest): Promise<TokenResponse> {
    return this.client.post<TokenResponse>("/api/v1/auth/login", data);
  }

  /** Register a new account. */
  async register(data: RegisterRequest): Promise<TokenResponse> {
    return this.client.post<TokenResponse>("/api/v1/auth/register", data);
  }

  /** Get the currently authenticated user's profile. */
  async getMe(): Promise<UserResponse> {
    return this.client.get<UserResponse>("/api/v1/auth/me");
  }

  /** Update the current user's profile. */
  async updateMe(data: UserUpdateRequest): Promise<UserResponse> {
    return this.client.patch<UserResponse>("/api/v1/auth/me", data);
  }
}
