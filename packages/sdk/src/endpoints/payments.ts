import { HttpClient } from "../client.js";
import type {
  BillingPlanResponse,
  UsageMeterResponse,
  PaymentsListResponse,
  InvoiceResponse,
} from "../types.js";

export class PaymentsEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** List all available billing plans. */
  async listPlans(): Promise<BillingPlanResponse[]> {
    return this.client.get<BillingPlanResponse[]>("/api/v1/payments/plans");
  }

  /** Get current usage for the organization. */
  async getUsage(): Promise<UsageMeterResponse> {
    return this.client.get<UsageMeterResponse>("/api/v1/payments/usage");
  }

  /** Get the full billing dashboard (plans, usage, invoices). */
  async getDashboard(): Promise<PaymentsListResponse> {
    return this.client.get<PaymentsListResponse>("/api/v1/payments/dashboard");
  }

  /** List invoices. */
  async listInvoices(): Promise<InvoiceResponse[]> {
    return this.client.get<InvoiceResponse[]>("/api/v1/payments/invoices");
  }
}
