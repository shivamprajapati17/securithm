"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React, { useState, useEffect, useCallback } from "react";
import { useFindings } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import {
  Clock,
  AlertTriangle,
  FileWarning,
  Bug,
  Info,
  UserPlus,
  UserMinus,
  CalendarDays,
  Mail,
  User,
  Users,
  Crown,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const severityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  critical: AlertTriangle,
  high: FileWarning,
  medium: Bug,
  low: Info,
  informational: Info,
};

const severityColors: Record<string, string> = {
  critical: "text-[var(--color-term-error)] border-[var(--color-term-error)]",
  high: "text-[var(--color-term-warning)] border-[var(--color-term-warning)]",
  medium: "text-[var(--color-severity-medium)] border-[var(--color-severity-medium)]",
  low: "text-[var(--color-severity-low)] border-[var(--color-severity-low)]",
  informational: "text-[var(--color-term-muted)] border-[var(--color-term-border)]",
};

const columnConfig = [
  { id: "open", title: "NEW", color: "bg-[var(--color-term-error)]" },
  { id: "in_progress", title: "FIXING", color: "bg-[var(--color-term-warning)]" },
  { id: "resolved", title: "RESOLVED", color: "bg-[var(--color-term-fg)]" },
  { id: "wont_fix", title: "WONT_FIX", color: "bg-[var(--color-term-muted)]" },
];

const roleIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Crown,
  member: User,
  viewer: Eye,
};

const roleColors: Record<string, string> = {
  admin: "text-yellow-400",
  member: "text-[var(--color-term-fg)]",
  viewer: "text-[var(--color-term-muted)]",
};

export default function TeamPage() {
  const { data: allFindings, loading, error, refetch: refetchFindings } = useFindings({});
  const findings = allFindings || [];
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState<string | null>(null);
  const [members, setMembers] = useState<api.TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Array<{
    id: string;
    email: string;
    status: string;
    message: string | null;
    expires_at: string | null;
    created_at: string;
  }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<"board" | "members">("board");
  const [assigningFinding, setAssigningFinding] = useState<api.Finding | null>(null);
  const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [activityLog, setActivityLog] = useState<Array<{
    id: string;
    type: "assigned" | "unassigned" | "status_changed";
    findingCategory: string;
    memberName: string;
    timestamp: Date;
  }>>([]);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const getMemberName = useCallback((memberId: string | null) => {
    if (!memberId) return null;
    const member = members.find(m => m.id === memberId);
    if (!member) return memberId.slice(0, 8);
    return member.display_name || member.email.split("@")[0];
  }, [members]);

  const addActivity = useCallback((type: "assigned" | "unassigned" | "status_changed", findingCategory: string, memberName: string) => {
    setActivityLog(prev => [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      findingCategory,
      memberName,
      timestamp: new Date(),
    }, ...prev]);
  }, []);

  const isAdmin = user?.role === "admin";

  const loadMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      const token = localStorage.getItem("securithm_token");
      if (token) {
        api.setAuthToken(token);
        const [membersData, invitesData] = await Promise.all([
          api.listTeamMembers(),
          api.listTeamInvites(),
        ]);
        setMembers(membersData);
        setPendingInvites(invitesData.filter((i) => i.status === "pending"));
      }
    } catch {
      // Silently fail — auth might not be ready
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadMembers();
    }
  }, [user, loadMembers]);

  const grouped = {
    open: findings.filter(f => f.status === "open"),
    in_progress: findings.filter(f => f.status === "in_progress"),
    resolved: findings.filter(f => f.status === "resolved"),
    wont_fix: findings.filter(f => f.status === "wont_fix"),
  };

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="flex items-center gap-3 border border-[var(--color-term-border)] p-3">
        <div className="flex h-8 w-8 items-center justify-center border border-[var(--color-term-fg)] text-[var(--color-term-fg)]">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--color-term-fg)] font-mono uppercase truncate">
              {user?.display_name || user?.email?.split("@")[0] || "DEVELOPER"}
            </span>
            {user?.role && (
              <Badge variant="outline" className={`text-[8px] px-1 h-4 flex items-center gap-0.5 ${roleColors[user.role] || ""}`}>
                {React.createElement(roleIcon[user.role] || User, { className: "h-2.5 w-2.5" })}
                {user.role.toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-term-muted)] font-mono">
            <Mail className="h-2.5 w-2.5" />
            <span>{user?.email || "—"}</span>
          </div>
        </div>
        {inviteSent && (
          <div className="text-[9px] text-[var(--color-term-fg)] font-mono animate-pulse shrink-0">
            ✓ INVITATION SENT TO {inviteSent}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-[var(--color-term-border)] pb-0">
        <button
          onClick={() => setActiveTab("board")}
          className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
            activeTab === "board"
              ? "text-[var(--color-term-fg)] border-b-2 border-[var(--color-term-fg)]"
              : "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)]"
          }`}
        >
          [ FINDINGS BOARD ]
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === "members"
              ? "text-[var(--color-term-fg)] border-b-2 border-[var(--color-term-fg)]"
              : "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)]"
          }`}
        >
          <Users className="h-3 w-3" />
          [ TEAM MEMBERS ]
          {members.length > 0 && (
            <span className="text-[8px] text-[var(--color-term-muted)]">({members.length})</span>
          )}
        </button>
      </div>

      {activeTab === "board" ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
                TEAM BOARD
              </h1>
              <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
                REMEDIATION WORKFLOW — {findings.length} TOTAL FINDINGS
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                if (findings.length === 0) { alert('NO FINDINGS TO EXPORT'); return; }
                const blob = new Blob([JSON.stringify(findings, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'securithm-findings.json'; a.click();
                URL.revokeObjectURL(url);
              }}>
                <CalendarDays className="h-3 w-3" />
                [ EXPORT ]
              </Button>
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    id="invite-email-board"
                    name="invite_email"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteSent(null); }}
                    placeholder="EMAIL TO INVITE"
                    className="w-44 h-7 bg-transparent border border-[var(--color-term-border)] text-[var(--color-term-fg)] font-mono text-[10px] px-2 placeholder:text-[var(--color-term-muted)] outline-none"
                  />
                  <Button
                    size="sm"
                    className="gap-1.5 h-7"
                    disabled={!inviteEmail.includes("@")}
                    onClick={async () => {
                      if (!inviteEmail) return;
                      try {
                        const token = localStorage.getItem("securithm_token");
                        if (token) {
                          api.setAuthToken(token);
                          await api.inviteTeamMember({ email: inviteEmail });
                          setInviteSent(inviteEmail);
                          setInviteEmail("");
                          loadMembers();
                          setTimeout(() => setInviteSent(null), 4000);
                        }
                      } catch (err) {
                        setInviteSent(`FAILED: ${err instanceof Error ? err.message : "Unknown error"}`);
                        setTimeout(() => setInviteSent(null), 4000);
                      }
                    }}
                  >
                    <UserPlus className="h-3 w-3" />
                    [ INVITE ]
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {columnConfig.map(col => (
              <Card key={col.id}>
                <CardContent className="p-3">
                  <div className="text-sm font-bold text-[var(--color-term-fg)]">{grouped[col.id as keyof typeof grouped].length}</div>
                  <div className="text-[9px] text-[var(--color-term-muted)] font-mono uppercase tracking-wider">[{col.title}]</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid md:grid-cols-4 gap-3">
              {[1,2,3,4].map(col => (
                <div key={col} className="space-y-2">
                  <div className="h-4 w-16 border border-[var(--color-term-border)] bg-[var(--color-term-dim)] animate-pulse" />
                  {[1,2].map(card => (
                    <Card key={card}><CardContent className="p-3 h-20 animate-pulse bg-[var(--color-term-dim)]" /></Card>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <Card>
              <CardContent className="p-4 text-center text-xs text-[var(--color-term-error)] font-mono">
                [!] ERROR: {error}
              </CardContent>
            </Card>
          )}

          {/* Kanban Board */}
          {!loading && !error && (
            <>
              {findings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
                    $ NO_FINDINGS_YET
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-4 gap-3">
                  {columnConfig.map((column) => {
                    const items = grouped[column.id as keyof typeof grouped];
                    return (
                      <div key={column.id} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 ${column.color}`} />
                            <h3 className="text-[10px] font-bold text-[var(--color-term-fg)] font-mono uppercase tracking-wider">
                              {column.title}
                            </h3>
                          </div>
                          <Badge variant="default" className="text-[8px] px-1 py-0">
                            [{items.length}]
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {items.length === 0 ? (
                            <div className="text-center py-4 text-[9px] text-[var(--color-term-muted)] font-mono border border-dashed border-[var(--color-term-border)]">
                              $ EMPTY
                            </div>
                          ) : (
                            items.map((item) => {
                              const SevIcon = severityIcons[item.severity] || Info;
                              const colorClass = severityColors[item.severity] || severityColors.informational;
                              return (
                                <Card key={item.id}>
                                  <CardContent className="p-2.5">
                                    <div className="flex items-start gap-1.5 mb-1.5">
                                      <SevIcon className={`h-3 w-3 mt-0.5 ${colorClass.split(" ")[0]}`} />
                                      <div>
                                        <div className="text-[10px] font-bold text-[var(--color-term-fg)] font-mono uppercase leading-tight">
                                          {item.category}
                                        </div>
                                        <div className="text-[8px] text-[var(--color-term-muted)] font-mono">
                                          {item.line_number ? `LINE ${item.line_number}` : "N/A"}
                                        </div>
                                      </div>
                                    </div>

                                    <p className="text-[9px] text-[var(--color-term-muted)] leading-relaxed mb-1.5 font-mono line-clamp-2">
                                      {item.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-dashed border-[var(--color-term-border)]">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {item.assigned_to ? (
                                          <div className="flex items-center gap-1.5 group/assignee min-w-0">
                                            <Avatar className="h-4 w-4 shrink-0">
                                              <AvatarFallback className="text-[6px]">
                                                {(getMemberName(item.assigned_to) || "??").slice(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-[8px] text-[var(--color-term-fg)] font-mono truncate max-w-[70px]">
                                              {getMemberName(item.assigned_to)}
                                            </span>
                                            <button
                                              onClick={async () => {
                                                if (!confirm(`UNASSIGN ${getMemberName(item.assigned_to)} FROM THIS FINDING?`)) return;
                                                try {
                                                  const token = localStorage.getItem("securithm_token");
                                                  if (token) api.setAuthToken(token);
                                                  await api.updateFinding(item.id, { assigned_to: null });
                                                  addActivity("unassigned", item.category, getMemberName(item.assigned_to) || "Unknown");
                                                  refetchFindings();
                                                  loadMembers();
                                                } catch (err) {
                                                  alert(`UNASSIGN FAILED: ${err instanceof Error ? err.message : "Unknown error"}`);
                                                }
                                              }}
                                              className="h-3 w-3 p-0 opacity-0 group-hover/assignee:opacity-100 text-[var(--color-term-error)] hover:text-[var(--color-term-error)] transition-opacity shrink-0"
                                              title="Unassign"
                                            >
                                              <X className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 px-1 text-[8px]"
                                            onClick={() => setAssigningFinding(item)}
                                          >
                                            $ ASSIGN
                                          </Button>
                                        )}
                                      </div>
                                      {item.remediation_sla && (
                                        <div className="flex items-center gap-0.5 text-[8px] text-[var(--color-term-muted)] font-mono">
                                          <Clock className="h-2 w-2" />
                                          {formatDate(item.remediation_sla)}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {/* ─── Activity Log ──────────────────────── */}
          <div className="border border-[var(--color-term-border)]">
            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <History className="h-3 w-3" />
                ACTIVITY LOG ({activityLog.length})
              </div>
              {showActivityLog ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showActivityLog && (
              <div className="border-t border-[var(--color-term-border)] max-h-48 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <div className="px-3 py-4 text-[9px] text-[var(--color-term-muted)] font-mono text-center">
                    $ NO_ACTIVITY_YET —
                    {' '}ASSIGN A FINDING TO START
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-term-border)]">
                    {activityLog.map((event) => (
                      <div key={event.id} className="flex items-start gap-2 px-3 py-1.5">
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                          event.type === "assigned" ? "bg-[var(--color-term-fg)]" :
                          event.type === "unassigned" ? "bg-[var(--color-term-error)]" :
                          "bg-[var(--color-term-warning)]"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-mono text-[var(--color-term-fg)] leading-tight">
                            {event.type === "assigned" && (
                              <>ASSIGNED <span className="text-[var(--color-term-fg)] font-bold">{event.findingCategory}</span> → <span className="text-[var(--color-term-fg)] font-bold">{event.memberName}</span></>
                            )}
                            {event.type === "unassigned" && (
                              <>UNASSIGNED <span className="text-[var(--color-term-error)]">{event.memberName}</span> FROM <span className="text-[var(--color-term-fg)] font-bold">{event.findingCategory}</span></>
                            )}
                            {event.type === "status_changed" && (
                              <>{event.findingCategory} → {event.memberName}</>
                            )}
                          </div>
                          <div className="text-[7px] text-[var(--color-term-muted)] font-mono">
                            {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ─── Members Tab ──────────────────────────── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
                TEAM MEMBERS
              </h1>
              <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
                {members.length} MEMBER{members.length !== 1 ? "S" : ""} IN YOUR ORGANIZATION
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  id="invite-email-members"
                  name="invite_email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteSent(null); }}
                  placeholder="EMAIL TO INVITE"
                  className="w-44 h-7 bg-transparent border border-[var(--color-term-border)] text-[var(--color-term-fg)] font-mono text-[10px] px-2 placeholder:text-[var(--color-term-muted)] outline-none"
                />
                <Button
                  size="sm"
                  className="gap-1.5 h-7"
                  disabled={!inviteEmail.includes("@")}
                  onClick={async () => {
                    if (!inviteEmail) return;
                    try {
                      const token = localStorage.getItem("securithm_token");
                      if (token) {
                        api.setAuthToken(token);
                        await api.inviteTeamMember({ email: inviteEmail });
                        setInviteSent(inviteEmail);
                        setInviteEmail("");
                        loadMembers();
                        setTimeout(() => setInviteSent(null), 4000);
                      }
                    } catch (err) {
                      setInviteSent(`FAILED: ${err instanceof Error ? err.message : "Unknown error"}`);
                      setTimeout(() => setInviteSent(null), 4000);
                    }
                  }}
                >
                  <UserPlus className="h-3 w-3" />
                  [ INVITE ]
                </Button>
              </div>
            )}
          </div>

          {/* Members list */}
          {loadingMembers ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 border border-[var(--color-term-border)] bg-[var(--color-term-dim)] animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
                $ NO_MEMBERS_FOUND
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {members.map((member) => {
                const RoleIcon = roleIcon[member.role] || User;
                const isCurrentUser = member.id === user?.id;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between border border-[var(--color-term-border)] p-2.5 hover:border-[var(--color-term-fg)] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-[10px] font-mono">
                          {(member.display_name || member.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[var(--color-term-fg)] font-mono uppercase truncate">
                            {member.display_name || member.email.split("@")[0]}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[8px] text-[var(--color-term-muted)] font-mono">(YOU)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-[var(--color-term-muted)] font-mono">
                          <span className="truncate">{member.email}</span>
                          <span>·</span>
                          <span className="shrink-0">JOINED {formatDate(member.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Role badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 border border-[var(--color-term-border)] ${roleColors[member.role] || ""}`}>
                        <RoleIcon className="h-3 w-3" />
                        <span className="text-[9px] font-mono font-bold uppercase">{member.role}</span>
                      </div>

                      {/* Admin actions */}
                      {isAdmin && !isCurrentUser && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Role dropdown */}
                          <div className="relative">
                            <select
                              value={member.role}
                              onChange={async (e) => {
                                const newRole = e.target.value as "admin" | "member" | "viewer";
                                try {
                                  const token = localStorage.getItem("securithm_token");
                                  if (token) api.setAuthToken(token);
                                  await api.changeMemberRole(member.id, newRole);
                                  loadMembers();
                                } catch (err) {
                                  alert(`FAILED TO UPDATE ROLE: ${err instanceof Error ? err.message : "Unknown error"}`);
                                }
                              }}
                              className="appearance-none bg-transparent border border-[var(--color-term-border)] text-[var(--color-term-fg)] text-[9px] font-mono px-1.5 py-0.5 outline-none cursor-pointer hover:border-[var(--color-term-fg)]"
                            >
                              <option value="admin">ADMIN</option>
                              <option value="member">MEMBER</option>
                              <option value="viewer">VIEWER</option>
                            </select>
                            <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-[var(--color-term-muted)] pointer-events-none" />
                          </div>

                          {/* Remove */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-[var(--color-term-error)] hover:text-[var(--color-term-error)]"
                            onClick={async () => {
                              if (!confirm(`REMOVE ${member.email} FROM ORGANIZATION?`)) return;
                              try {
                                const token = localStorage.getItem("securithm_token");
                                if (token) api.setAuthToken(token);
                                await api.removeMember(member.id);
                                loadMembers();
                              } catch (err) {
                                alert(`FAILED TO REMOVE: ${err instanceof Error ? err.message : "Unknown error"}`);
                              }
                            }}
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[11px] font-bold text-[var(--color-term-muted)] font-mono uppercase mb-2 flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                PENDING INVITATIONS ({pendingInvites.length})
              </h3>
              <div className="space-y-1">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between border border-dashed border-[var(--color-term-border)] p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-3 w-3 text-[var(--color-term-muted)] shrink-0" />
                      <span className="text-[10px] font-mono text-[var(--color-term-fg)] truncate">{invite.email}</span>
                      {invite.message && (
                        <span className="text-[8px] text-[var(--color-term-muted)] font-mono truncate hidden sm:inline">
                          — "{invite.message}"
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[8px] px-1 text-[var(--color-term-warning)]">
                        <Clock className="h-2 w-2 mr-0.5" />
                        PENDING
                      </Badge>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-[var(--color-term-error)]"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("securithm_token");
                              if (token) api.setAuthToken(token);
                              await api.cancelInvite(invite.id);
                              loadMembers();
                            } catch (err) {
                              alert(`FAILED: ${err instanceof Error ? err.message : "Unknown error"}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* ─── Assign Finding Dialog ──────────────────────── */}
      <Dialog open={!!assigningFinding} onOpenChange={(open) => { if (!open) { setAssigningFinding(null); setAssigningMemberId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                ASSIGN FINDING
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-3 space-y-3">
            <div className="text-[9px] text-[var(--color-term-muted)] font-mono">
              {assigningFinding && (
                <>
                  <span className="text-[var(--color-term-fg)]">{assigningFinding.category}</span>
                  {assigningFinding.line_number && (
                    <> — LINE {assigningFinding.line_number}</>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1">
              {members.length === 0 ? (
                <div className="text-[10px] text-[var(--color-term-muted)] font-mono italic">
                  $ NO_TEAM_MEMBERS
                </div>
              ) : (
                members.map((member) => {
                  const isSelected = assigningMemberId === member.id;
                  return (
                    <button
                      key={member.id}
                      disabled={assignLoading}
                      onClick={async () => {
                        if (!assigningFinding) return;
                        setAssigningMemberId(member.id);
                        setAssignLoading(true);
                        try {
                          const token = localStorage.getItem("securithm_token");
                          if (token) api.setAuthToken(token);
                          await api.updateFinding(assigningFinding.id, {
                            assigned_to: member.id,
                          });
                          addActivity("assigned", assigningFinding.category, member.display_name || member.email.split("@")[0]);
                          setAssigningFinding(null);
                          setAssigningMemberId(null);
                          refetchFindings();
                          loadMembers();
                        } catch (err) {
                          alert(`ASSIGN FAILED: ${err instanceof Error ? err.message : "Unknown error"}`);
                        } finally {
                          setAssignLoading(false);
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 border text-left transition-all ${
                        isSelected && assignLoading
                          ? "border-[var(--color-term-fg)] bg-[var(--color-term-dim)]"
                          : "border-[var(--color-term-border)] hover:border-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)]"
                      }`}
                    >
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[8px] font-mono">
                          {(member.display_name || member.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-[var(--color-term-fg)] font-mono uppercase truncate">
                          {member.display_name || member.email.split("@")[0]}
                        </div>
                        <div className="text-[8px] text-[var(--color-term-muted)] font-mono truncate">
                          {member.email}
                        </div>
                      </div>
                      {isSelected && assignLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-[var(--color-term-fg)] shrink-0" />
                      ) : (
                        <User className="h-3 w-3 text-[var(--color-term-muted)] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
