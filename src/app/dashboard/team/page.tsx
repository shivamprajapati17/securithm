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
  critical: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  informational: "text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20",
};

const columnConfig = [
  { id: "open", title: "New", color: "bg-red-500" },
  { id: "in_progress", title: "Fixing", color: "bg-blue-500" },
  { id: "resolved", title: "Resolved", color: "bg-green-500" },
  { id: "wont_fix", title: "Won't Fix", color: "bg-gray-500" },
];

export default function TeamPage() {
  // Fetch all findings for the kanban board
  const { data: allFindings, loading, error } = useFindings({});
  const findings = allFindings || [];

  const grouped = {
    open: findings.filter(f => f.status === "open"),
    in_progress: findings.filter(f => f.status === "in_progress"),
    resolved: findings.filter(f => f.status === "resolved"),
    wont_fix: findings.filter(f => f.status === "wont_fix"),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
            Remediation workflow — {findings.length} total findings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {columnConfig.map(col => (
          <Card key={col.id}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{grouped[col.id as keyof typeof grouped].length}</div>
              <div className="text-xs text-surface-500">{col.title} Findings</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid md:grid-cols-4 gap-4">
          {[1,2,3,4].map(col => (
            <div key={col} className="space-y-3">
              <div className="h-5 w-20 rounded bg-surface-100 dark:bg-surface-800 animate-pulse" />
              {[1,2].map(card => (
                <Card key={card}><CardContent className="p-3 h-24 animate-pulse bg-surface-100 dark:bg-surface-800 rounded-lg" /></Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-red-500">
            Failed to load findings: {error}
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {!loading && !error && (
        <>
          {findings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-surface-400">
                No findings yet. Scan a contract to populate the workflow board.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-4 gap-4">
              {columnConfig.map((column) => {
                const items = grouped[column.id as keyof typeof grouped];
                return (
                  <div key={column.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                        <h3 className="text-sm font-semibold">{column.title}</h3>
                      </div>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>

                    <div className="space-y-3">
                      {items.length === 0 ? (
                        <div className="text-center py-6 text-xs text-surface-400 border border-dashed border-surface-300 dark:border-surface-600 rounded-lg">
                          No findings
                        </div>
                      ) : (
                        items.map((item) => {
                          const SevIcon = severityIcons[item.severity] || Info;
                          const colorClass = severityColors[item.severity] || severityColors.informational;
                          return (
                            <Card key={item.id}>
                              <CardContent className="p-3">
                                <div className="flex items-start gap-2 mb-2">
                                  <SevIcon className={`h-3.5 w-3.5 mt-0.5 ${colorClass.split(" ")[0]}`} />
                                  <div>
                                    <div className="text-xs font-medium leading-tight">
                                      {item.category}
                                    </div>
                                    <div className="text-[10px] text-surface-400 mt-0.5">
                                      {item.line_number ? `Line ${item.line_number}` : "N/A"}
                                    </div>
                                  </div>
                                </div>

                                <p className="text-[10px] text-surface-500 leading-relaxed mb-2 line-clamp-2">
                                  {item.description}
                                </p>

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                                  <div className="flex items-center gap-2">
                                    {item.assigned_to ? (
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-[8px]">
                                          {item.assigned_to.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]">
                                        Assign
                                      </Button>
                                    )}
                                  </div>
                                  {item.remediation_sla && (
                                    <div className="flex items-center gap-1 text-[10px] text-surface-400">
                                      <Clock className="h-3 w-3" />
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
