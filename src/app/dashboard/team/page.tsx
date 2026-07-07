"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFindings } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  AlertTriangle,
  FileWarning,
  Bug,
  Info,
  UserPlus,
  CalendarDays,
} from "lucide-react";

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

export default function TeamPage() {
  const { data: allFindings, loading, error } = useFindings({});
  const findings = allFindings || [];

  const grouped = {
    open: findings.filter(f => f.status === "open"),
    in_progress: findings.filter(f => f.status === "in_progress"),
    resolved: findings.filter(f => f.status === "resolved"),
    wont_fix: findings.filter(f => f.status === "wont_fix"),
  };

  return (
    <div className="space-y-6">
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
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="h-3 w-3" />
            [ EXPORT ]
          </Button>
          <Button size="sm" className="gap-2">
            <UserPlus className="h-3 w-3" />
            [ INVITE ]
          </Button>
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
                                  <div className="flex items-center gap-1">
                                    {item.assigned_to ? (
                                      <Avatar className="h-4 w-4">
                                        <AvatarFallback className="text-[6px]">
                                          {item.assigned_to.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <Button variant="ghost" size="sm" className="h-4 px-1 text-[8px]">
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
    </div>
  );
}
