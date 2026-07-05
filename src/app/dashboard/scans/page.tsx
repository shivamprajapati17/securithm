"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useScans, useScan } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/utils";
import {
  Search,
  Clock,
  AlertTriangle,
  FileWarning,
  Info,
  Bug,
  CheckCircle2,
  Download,
  ArrowLeft,
  FileText,
} from "lucide-react";

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  high: {
    icon: FileWarning,
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  medium: {
    icon: Bug,
    label: "Medium",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  low: {
    icon: Info,
    label: "Low",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  informational: {
    icon: Info,
    label: "Info",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/20",
  },
};

const statusColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-600 dark:text-red-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  resolved: "bg-green-500/10 text-green-600 dark:text-green-400",
  wont_fix: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-lg bg-surface-950 dark:bg-surface-900 text-surface-50 p-4 overflow-x-auto text-xs leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}

function ScanList({
  scans,
  onSelect,
}: {
  scans: { id: string; contract_name: string | null; status: string; risk_score_overall: string | null; created_at: string; chain: string | null; findings?: { severity: string }[] }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-surface-200 dark:divide-surface-700">
      {scans.map((scan) => (
        <button
          key={scan.id}
          onClick={() => onSelect(scan.id)}
          className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-surface-50 dark:hover:bg-surface-800/50 px-3 -mx-3 rounded-lg transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-surface-400 shrink-0" />
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
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold text-white ${
                  scan.risk_score_overall === "F" || scan.risk_score_overall === "E"
                    ? "bg-red-500"
                    : scan.risk_score_overall === "D" || scan.risk_score_overall === "C"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              >
                {scan.risk_score_overall}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                scan.status === "completed"
                  ? "bg-green-500/10 text-green-600"
                  : scan.status === "running"
                  ? "bg-blue-500/10 text-blue-600"
                  : scan.status === "failed"
                  ? "bg-red-500/10 text-red-600"
                  : "bg-gray-500/10 text-gray-600"
              }`}
            >
              {scan.status === "running" && (
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              )}
              {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function ScansPage() {
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: scansData, loading: scansLoading, error: scansError } = useScans({ page_size: 50 });
  const { data: scanDetail, loading: detailLoading, error: detailError } = useScan(selectedScanId);

  const allScans = scansData?.items || [];
  const filteredScans = searchQuery
    ? allScans.filter((s) =>
        (s.contract_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allScans;

  // Detail view with error handling
  if (detailError) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedScanId(null)}
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all scans
        </button>
        <Card>
          <CardContent className="p-12 text-center text-sm text-red-500">
            Failed to load scan details: {detailError}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedScanId && scanDetail) {
    const findings = scanDetail.findings || [];
    const severityCounts = {
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      informational: findings.filter((f) => f.severity === "informational").length,
    };

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedScanId(null)}
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all scans
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {scanDetail.contract_name || "Unknown Contract"}
              </h1>
              {scanDetail.risk_score_overall && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    scanDetail.risk_score_overall === "F" || scanDetail.risk_score_overall === "E"
                      ? "bg-red-500/10 text-red-600 border-red-500/20"
                      : scanDetail.risk_score_overall === "D" || scanDetail.risk_score_overall === "C"
                      ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      : "bg-green-500/10 text-green-600 border-green-500/20"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Risk Score {scanDetail.risk_score_overall}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-surface-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {scanDetail.created_at ? formatRelativeTime(scanDetail.created_at) : "Unknown"}
              </span>
              <span>{scanDetail.chain || "ethereum"}</span>
              <span>{findings.length} findings</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {detailLoading ? (
          <div className="grid grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => (
              <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-surface-100 dark:bg-surface-800 rounded-xl" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(severityConfig).map(([key, config]) => {
              const count = severityCounts[key as keyof typeof severityCounts] || 0;
              const Icon = config.icon;
              return (
                <Card key={key}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-4.5 w-4.5 ${config.color}`} />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{count}</div>
                      <div className={`text-xs font-medium ${config.color}`}>{config.label}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Findings */}
        {detailLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Card key={i}><CardContent className="p-6 h-32 animate-pulse bg-surface-100 dark:bg-surface-800 rounded-xl" /></Card>)}
          </div>
        ) : findings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-surface-400">
              No findings in this scan.
            </CardContent>
          </Card>
        ) : (
          findings.map((finding) => {
            const config = severityConfig[finding.severity as keyof typeof severityConfig];
            const Icon = config.icon;
            return (
              <Card key={finding.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg} mt-0.5`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{finding.category}</h3>
                          <Badge variant={finding.severity as "critical" | "high" | "medium" | "low" | "info"}>{config.label}</Badge>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[finding.status]}`}>
                            {finding.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-xs text-surface-400 mt-1">
                          Line {finding.line_number}
                          {finding.remediation_sla && ` · SLA: ${new Date(finding.remediation_sla).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">Assign</Button>
                      <Button variant="outline" size="sm">Mark Resolved</Button>
                    </div>
                  </div>

                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 leading-relaxed">
                    {finding.description}
                  </p>

                  <div className="space-y-3">
                    {finding.code_snippet && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Vulnerable Code</span>
                        </div>
                        <CodeBlock code={finding.code_snippet} />
                      </div>
                    )}
                    {finding.suggested_fix && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">Suggested Fix</span>
                        </div>
                        <CodeBlock code={finding.suggested_fix} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  }

  // Scan list view
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scans</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
            {allScans.length} total scans
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {scansError && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-red-500">
            Error loading scans: {scansError}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          {scansLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-12 rounded-lg bg-surface-100 dark:bg-surface-800 animate-pulse" />
              ))}
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-8 text-sm text-surface-400">
              {searchQuery ? "No scans match your search." : "No scans yet. Submit a contract to get started."}
            </div>
          ) : (
            <ScanList scans={filteredScans} onSelect={setSelectedScanId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
