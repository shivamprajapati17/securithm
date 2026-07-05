"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanInput } from "@/components/scan-input";
import { Progress } from "@/components/ui/progress";
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
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    running: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400",
    pending: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || variants.pending}`}
    >
      {status === "running" && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {status === "completed" && <CheckCircle2 className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RiskBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const colors: Record<string, string> = {
    A: "bg-green-500 text-white",
    B: "bg-green-400 text-white",
    C: "bg-yellow-500 text-white",
    D: "bg-orange-500 text-white",
    E: "bg-red-500 text-white",
    F: "bg-red-600 text-white",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${colors[grade] || "bg-gray-500 text-white"}`}
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
      label: "Scans",
      value: String(scans.length),
      sub: "Total scans",
    },
    {
      icon: AlertTriangle,
      label: "Critical Findings",
      value: String(criticalCount),
      sub: "Across all scans",
    },
    {
      icon: CheckCircle2,
      label: "Resolved",
      value: String(resolvedFindings),
      sub: `${totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0}% resolution`,
    },
    {
      icon: Clock,
      label: "Contracts",
      value: String(completedScans.length),
      sub: "Analyzed",
    },
  ];

  const recentScans = scans.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
          Live data from your security scans
        </p>
      </div>

      {/* Quick Scan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <ScanInput variant="inline" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300">
                  <stat.icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl font-bold">
                {scansLoading ? (
                  <span className="text-surface-300 dark:text-surface-600 animate-pulse">
                    --
                  </span>
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {stat.label}
              </div>
              <div className="text-[10px] text-surface-400">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Scans</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1">
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-surface-100 dark:bg-surface-800 animate-pulse"
                />
              ))}
            </div>
          ) : recentScans.length === 0 ? (
            <div className="text-center py-8 text-sm text-surface-400">
              No scans yet. Paste a contract to get started.
            </div>
          ) : (
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {recentScans.map((scan) => (
                <a
                  key={scan.id}
                  href={`/dashboard/scans?id=${scan.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-surface-50 dark:hover:bg-surface-800/50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-surface-400" />
                    <div>
                      <span className="text-sm font-medium">
                        {scan.contract_name || "Unknown"}
                      </span>
                      <div className="text-xs text-surface-400">
                        {scan.created_at ? formatRelativeTime(scan.created_at) : "just now"}
                        {scan.chain && ` · ${scan.chain}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {scan.findings && scan.findings.length > 0 && (
                      <span className="text-xs text-surface-500">
                        {scan.findings.length} findings
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
