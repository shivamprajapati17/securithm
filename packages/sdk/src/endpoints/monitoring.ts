import { HttpClient } from "../client.js";
import type {
  MonitoredContractCreateRequest,
  MonitoredContract,
  MonitoringEvent,
} from "../types.js";

export class MonitoringEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Add a contract to monitoring. */
  async create(data: MonitoredContractCreateRequest): Promise<MonitoredContract> {
    return this.client.post<MonitoredContract>("/api/v1/monitored-contracts", data);
  }

  /** List all monitored contracts. */
  async list(): Promise<MonitoredContract[]> {
    return this.client.get<MonitoredContract[]>("/api/v1/monitored-contracts");
  }

  /** Get a specific monitored contract by ID. */
  async get(id: string): Promise<MonitoredContract> {
    return this.client.get<MonitoredContract>(`/api/v1/monitored-contracts/${id}`);
  }

  /** Get events for a monitored contract. */
  async getEvents(contractId: string): Promise<MonitoringEvent[]> {
    return this.client.get<MonitoringEvent[]>(
      `/api/v1/monitored-contracts/${contractId}/events`
    );
  }

  /** Remove a contract from monitoring. */
  async remove(id: string): Promise<void> {
    return this.client.delete<void>(`/api/v1/monitored-contracts/${id}`);
  }
}
