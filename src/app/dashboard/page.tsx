"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanInput } from "@/components/scan-input";
import { useScans } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/utils";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "text-[var(--color-term-fg)] border-[var(--color-term-fg)]",
    running: "text-[var(--color-term-warning)] border-[var(--color-term-warning)]",
    failed: "text-[var(--color-term-error)] border-[var(--color-term-error)]",
    pending: "text-[var(--color-term-muted)] border-[var(--color-term-muted)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border uppercase tracking-wider ${variants[status] || variants.pending}`}
    >
      {status === "running" && (
        <span className="animate-blink">▶</span>
      )}
      {status === "completed" && <CheckCircle2 className="h-2.5 w-2.5" />}
      [{status.charAt(0).toUpperCase() + status.slice(1)}]
    </span>
  );
}

function RiskBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const colors: Record<string, string> = {
    A: "text-[var(--color-term-fg)]",
    B: "text-risk-b",
    C: "text-[var(--color-term-warning)]",
    D: "text-[var(--color-term-secondary)]",
    E: "text-severity-high",
    F: "text-[var(--color-term-error)]",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 border border-current text-[10px] font-bold font-mono ${colors[grade] || "text-[var(--color-term-muted)]"}`}
    >
      {grade}
    </span>
  );
}

export default function DashboardPage() {
  const { data: scansData, loading: scansLoading } = useScans({ page_size: 50 });
  const scans = scansData?.items || [];

  const completedScans = scans.filter((s) => s.status === "completed");
  const totalFindings = completedScans.reduce(
    (sum, s) => sum + (s.findings?.length || 0), 0
  );
  const criticalCount = completedScans.reduce(
    (sum, s) => sum + (s.findings?.filter((f) => f.severity === "critical").length || 0),
    0
  );
  const resolvedFindings = completedScans.reduce(
    (sum, s) => sum + (s.findings?.filter((f) => f.status === "resolved").length || 0),
    0
  );

  const stats = [
    {
      icon: Shield,
      label: "SCANS",
      value: String(scans.length),
      sub: "TOTAL",
    },
    {
      icon: AlertTriangle,
      label: "CRITICAL",
      value: String(criticalCount),
      sub: "FINDINGS",
    },
    {
      icon: CheckCircle2,
      label: "RESOLVED",
      value: String(resolvedFindings),
      sub: `${totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0}%`,
    },
    {
      icon: Clock,
      label: "CONTRACTS",
      value: String(completedScans.length),
      sub: "ANALYZED",
    },
  ];

  const recentScans = scans.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
DASHBOARD OVERVIEW
        </h1>
        <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
          LIVE DATA FROM YOUR SECURITY SCANS
        </p>
      </div>

      {/* Quick Scan */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} QUICK_SCAN</CardTitle>
        </CardHeader>
        <CardContent>
          <ScanInput variant="inline" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-7 w-7 items-center justify-center border border-[var(--color-term-border)] text-[var(--color-term-fg)]">
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[9px] text-[var(--color-term-muted)] font-mono uppercase">{stat.sub}</span>
              </div>
              <div className="text-lg font-bold text-[var(--color-term-fg)] term-glow">
                {scansLoading ? (
                  <span className="animate-blink">_</span>
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-[9px] text-[var(--color-term-muted)] mt-0.5 font-mono uppercase tracking-wider">
                [{stat.label}]
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{">"} RECENT_SCANS</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1">
            VIEW ALL
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 border border-[var(--color-term-border)] bg-[var(--color-term-dim)] animate-pulse"
                />
              ))}
            </div>
          ) : recentScans.length === 0 ? (
            <div className="text-center py-6 text-xs text-[var(--color-term-muted)] font-mono">
              NO SCANS FOUND. SUBMIT A CONTRACT FOR ANALYSIS ABOVE TO GET STARTED.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-term-border)]">
              {recentScans.map((scan) => (
                <a
                  key={scan.id}
                  href={`/dashboard/scans?id=${scan.id}`}
                  className="flex items-center justify-between py-2 first:pt-0 last:pb-0 hover:bg-[var(--color-term-dim)] px-1.5 -mx-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[var(--color-term-muted)] shrink-0" />
                    <div>
                      <span className="text-xs font-mono text-[var(--color-term-fg)]">
                        {scan.contract_name || "UNKNOWN"}
                      </span>
                      <div className="text-[9px] text-[var(--color-term-muted)] font-mono">
                        {scan.created_at ? formatRelativeTime(scan.created_at) : "just now"}
                        {scan.chain && ` · ${scan.chain}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {scan.findings && scan.findings.length > 0 && (
                      <span className="text-[9px] text-[var(--color-term-muted)] font-mono">
                        [{scan.findings.length}]
                      </span>
                    )}
                    {scan.risk_score_overall && (
                      <RiskBadge grade={scan.risk_score_overall} />
                    )}
                    <StatusBadge status={scan.status} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
