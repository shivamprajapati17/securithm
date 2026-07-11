import { HttpClient } from "../client.js";
import type {
  TeamInviteRequest,
  TeamInviteResponse,
  TeamInviteActionResponse,
  TeamMember,
  MemberRoleUpdate,
} from "../types.js";

export class TeamEndpoint {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Invite a new member to the organization. */
  async invite(data: TeamInviteRequest): Promise<TeamInviteResponse> {
    return this.client.post<TeamInviteResponse>("/api/v1/team/invite", data);
  }

  /** List all pending invites for the organization. */
  async listInvites(): Promise<TeamInviteResponse[]> {
    return this.client.get<TeamInviteResponse[]>("/api/v1/team/invites");
  }

  /** Accept a pending invitation. */
  async acceptInvite(inviteId: string): Promise<TeamInviteActionResponse> {
    return this.client.patch<TeamInviteActionResponse>(
      `/api/v1/team/invite/${inviteId}/accept`
    );
  }

  /** Decline a pending invitation. */
  async declineInvite(inviteId: string): Promise<TeamInviteActionResponse> {
    return this.client.patch<TeamInviteActionResponse>(
      `/api/v1/team/invite/${inviteId}/decline`
    );
  }

  /** Cancel a pending invitation (admin only). */
  async cancelInvite(inviteId: string): Promise<void> {
    return this.client.delete<void>(`/api/v1/team/invite/${inviteId}`);
  }

  /** List all members of the organization. */
  async listMembers(): Promise<TeamMember[]> {
    return this.client.get<TeamMember[]>("/api/v1/team/members");
  }

  /** Change a member's role (admin only). */
  async changeMemberRole(userId: string, role: MemberRoleUpdate["role"]): Promise<TeamMember> {
    return this.client.patch<TeamMember>(`/api/v1/team/members/${userId}/role`, { role });
  }

  /** Remove a member from the organization (admin only). */
  async removeMember(userId: string): Promise<void> {
    return this.client.delete<void>(`/api/v1/team/members/${userId}`);
  }
}
