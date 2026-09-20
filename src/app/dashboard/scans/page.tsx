"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScans, useScan } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/api";
import { DiffPreview } from "@/components/diff-preview";
import {
  Search,
  Clock,
  AlertTriangle,
  FileWarning,
  Info,
  Bug,
  Download,
  ArrowLeft,
  FileText,
  Bot,
  Wrench,
  GitCompare,
} from "lucide-react";

const CATEGORY_GROUPS: Record<string, string[]> = {
  "Access & Auth": ["Reentrancy", "tx.origin Authentication", "Missing Access Control"],
  "Fund Safety": ["Unprotected Selfdestruct", "Dangerous delegatecall", "Centralization Risk"],
  "Logic & Data": ["Integer Overflow/Underflow", "Timestamp Dependence", "Weak Source of Randomness"],
  "Hygiene": ["Unchecked Return Value", "Gas Griefing"],
};

function categoryToGroup(category: string): string {
  const base = category.split(" · ")[0].trim();
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(base)) return group;
  }
  return "Other";
}

function categoryBase(category: string): string {
  return category.split(" · ")[0].trim();
}

/** Categories the agent engine can auto-fix (must mirror backend rule set). */
const AUTO_FIXABLE = new Set([
  "Reentrancy",
  "tx.origin Authentication",
  "Unprotected Selfdestruct",
  "Dangerous delegatecall",
  "Unchecked Return Value",
  "Gas Griefing",
  "Integer Overflow/Underflow",
]);

function isFixable(category: string): boolean {
  return AUTO_FIXABLE.has(categoryBase(category));
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    label: "CRITICAL",
    color: "text-[var(--color-term-error)] border-[var(--color-term-error)]",
  },
  high: {
    icon: FileWarning,
    label: "HIGH",
    color: "text-[var(--color-term-warning)] border-[var(--color-term-warning)]",
  },
  medium: {
    icon: Bug,
    label: "MEDIUM",
    color: "text-[var(--color-severity-medium)] border-[var(--color-severity-medium)]",
  },
  low: {
    icon: Info,
    label: "LOW",
    color: "text-[var(--color-severity-low)] border-[var(--color-severity-low)]",
  },
  informational: {
    icon: Info,
    label: "INFO",
    color: "text-[var(--color-term-muted)] border-[var(--color-term-border)]",
  },
};

const statusColors: Record<string, string> = {
  open: "text-[var(--color-term-error)] border-[var(--color-term-error)]",
  in_progress: "text-[var(--color-term-warning)] border-[var(--color-term-warning)]",
  resolved: "text-[var(--color-term-fg)] border-[var(--color-term-fg)]",
  wont_fix: "text-[var(--color-term-muted)] border-[var(--color-term-muted)]",
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="border border-[var(--color-term-border)] bg-[var(--color-ex-obsidian)] text-[#e8ebe8] p-3 overflow-x-auto text-xs leading-relaxed rounded-[2px]">
      <code>{code}</code>
    </pre>
  );
}

function ScanList({
  scans,
  onSelect,
}: {
  scans: { id: string; contract_name: string | null; status: string; risk_score_overall: string | null; created_at: string; chain: string | null; origin?: string | null; findings?: { severity: string }[] }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-[var(--color-term-border)]">
      {scans.map((scan) => (
        <button
          key={scan.id}
          onClick={() => onSelect(scan.id)}
          className="w-full flex items-center justify-between py-2 first:pt-0 last:pb-0 hover:bg-[var(--color-term-dim)] px-1.5 -mx-1.5 transition-colors text-left"
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
                {scan.origin === "cli" && " · CLI"}
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
              <span
                className={`inline-flex items-center justify-center w-5 h-5 border text-[9px] font-bold font-mono ${
                  scan.risk_score_overall === "F" || scan.risk_score_overall === "E"
                    ? "text-[var(--color-term-error)] border-[var(--color-term-error)]"
                    : scan.risk_score_overall === "D" || scan.risk_score_overall === "C"
                    ? "text-[var(--color-term-warning)] border-[var(--color-term-warning)]"
                    : "text-[var(--color-term-fg)] border-[var(--color-term-fg)]"
                }`}
              >
                {scan.risk_score_overall}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono border uppercase tracking-wider ${
                scan.status === "completed"
                  ? "text-[var(--color-term-fg)] border-[var(--color-term-fg)]"
                  : scan.status === "running"
                  ? "text-[var(--color-term-warning)] border-[var(--color-term-warning)]"
                  : scan.status === "failed"
                  ? "text-[var(--color-term-error)] border-[var(--color-term-error)]"
                  : "text-[var(--color-term-muted)] border-[var(--color-term-muted)]"
              }`}
            >
              {scan.status === "running" && (
                <span className="animate-blink">▶</span>
              )}
              [{scan.status.toUpperCase()}]
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [diffPreview, setDiffPreview] = useState<api.DiffPreviewResponse | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const { data: scansData, loading: scansLoading, error: scansError } = useScans({ page_size: 50 });
  const { data: scanDetail, loading: detailLoading, error: detailError } = useScan(selectedScanId);

  const handleDownload = async (fn: () => Promise<void>, key: string) => {
    setDownloading(key);
    try {
      await fn();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const toggleDiffPreview = async () => {
    if (diffPreview) {
      setDiffPreview(null);
      return;
    }
    if (!selectedScanId) return;
    setDiffLoading(true);
    try {
      const data = await api.getDiffPreview(selectedScanId);
      setDiffPreview(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to load diff preview");
    } finally {
      setDiffLoading(false);
    }
  };

  const allScans = scansData?.items || [];
  const filteredScans = allScans
    .filter((s) =>
      searchQuery
        ? (s.contract_name || "").toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .filter((s) =>
      categoryFilter === "all"
        ? true
        : (s.findings || []).some((f) => categoryToGroup(f.category) === categoryFilter)
    );

  // Detail view with error handling
  if (detailError) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedScanId(null)}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </button>
        <Card>
          <CardContent className="p-6 text-center text-xs text-[var(--color-term-error)] font-mono">
            [!] ERROR: {detailError}
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
          className="inline-flex items-center gap-1 text-xs text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-[var(--color-term-fg)] term-glow">
                {scanDetail.contract_name || "UNKNOWN_CONTRACT"}
              </h1>
              {scanDetail.risk_score_overall && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border uppercase tracking-wider ${
                    scanDetail.risk_score_overall === "F" || scanDetail.risk_score_overall === "E"
                      ? "text-[var(--color-term-error)] border-[var(--color-term-error)]"
                      : scanDetail.risk_score_overall === "D" || scanDetail.risk_score_overall === "C"
                      ? "text-[var(--color-term-warning)] border-[var(--color-term-warning)]"
                      : "text-[var(--color-term-fg)] border-[var(--color-term-fg)]"
                  }`}
                >
                  RISK: {scanDetail.risk_score_overall}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[9px] text-[var(--color-term-muted)] font-mono">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {scanDetail.created_at ? formatRelativeTime(scanDetail.created_at) : "UNKNOWN"}
              </span>
              <span>{scanDetail.chain || "ethereum"}</span>
              <span>{findings.length} FINDINGS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={downloading === "fixed"}
              onClick={() =>
                handleDownload(
                  () => api.downloadFixedContract(scanDetail),
                  "fixed"
                )
              }
            >
              <Wrench className="h-3 w-3" />
              {downloading === "fixed" ? "FIXING..." : "FIXED .SOL"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={downloading === "patch"}
              onClick={() =>
                handleDownload(
                  () => api.downloadFullPatch(scanDetail),
                  "patch"
                )
              }
            >
              <Download className="h-3 w-3" />
              {downloading === "patch" ? "PATCH..." : "FULL PATCH"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={toggleDiffPreview}
            >
              <GitCompare className="h-3 w-3" />
              {diffLoading ? "LOADING..." : diffPreview ? "HIDE DIFF" : "VIEW DIFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const blob = new Blob([JSON.stringify(scanDetail, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${scanDetail.contract_name || "scan"}-${scanDetail.id.slice(0, 8)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              [ EXPORT ]
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {detailLoading ? (
          <div className="grid grid-cols-5 gap-3">
            {[1,2,3,4,5].map(i => (
              <Card key={i}><CardContent className="p-3 h-16 animate-pulse bg-[var(--color-term-dim)]" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(severityConfig).map(([key, config]) => {
              const count = severityCounts[key as keyof typeof severityCounts] || 0;
              const Icon = config.icon;
              return (
                <Card key={key}>
                  <CardContent className="p-3 flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${config.color.split(" ")[0]}`} />
                    <div>
                      <div className="text-sm font-bold text-[var(--color-term-fg)]">{count}</div>
                      <div className={`text-[9px] font-mono ${config.color.split(" ")[0]}`}>{config.label}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Findings */}
        {detailLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Card key={i}><CardContent className="p-4 h-24 animate-pulse bg-[var(--color-term-dim)]" /></Card>)}
          </div>
        ) : findings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
              NO FINDINGS DETECTED IN THIS SCAN. THE CONTRACT APPEARS CLEAN.
            </CardContent>
          </Card>
        ) : (
          findings.map((finding) => {
            const config = severityConfig[finding.severity as keyof typeof severityConfig];
            const Icon = config.icon;
            return (
              <Card key={finding.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center border mt-0.5 ${config.color}`}>
                        <Icon className={`h-3 w-3 ${config.color.split(" ")[0]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-[var(--color-term-fg)] uppercase">{finding.category}</h3>
                          <Badge variant={finding.severity as "critical" | "high" | "medium" | "low" | "info"} className="text-[9px]">
                            [{config.label}]
                          </Badge>
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-mono border ${statusColors[finding.status]}`}>
                            [{finding.status.replace("_", " ").toUpperCase()}]
                          </span>
                        </div>
                        <div className="text-[9px] text-[var(--color-term-muted)] mt-0.5 font-mono">
                          LINE {finding.line_number || "N/A"}
                          {" · "}
                          {categoryBase(finding.category).toUpperCase()}
                          {isFixable(finding.category) ? " · AUTO-FIX READY" : " · MANUAL REVIEW"}
                          {finding.remediation_sla && ` · SLA: ${new Date(finding.remediation_sla).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isFixable(finding.category) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[9px] h-6 gap-1"
                          disabled={downloading === finding.id}
                          onClick={() =>
                            handleDownload(
                              () => api.downloadFindingPatch(scanDetail, finding),
                              finding.id
                            )
                          }
                        >
                          <Download className="h-2.5 w-2.5" />
                          {downloading === finding.id ? "..." : ".PATCH"}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-[9px] h-6" onClick={() => {
                        const name = prompt("ASSIGN TO (ENTER EMAIL):");
                        if (name) alert(`ASSIGNED TO ${name}`);
                      }}>ASSIGN</Button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-term-muted)] mb-3 leading-relaxed font-mono">
                    {finding.description}
                  </p>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Bot className="h-3 w-3 text-[var(--color-term-muted)]" />
                    <span className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
                      REPORTED BY {finding.category.includes(" · ") ? finding.category.split(" · ")[1] : "AGENT"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {finding.code_snippet && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[9px] font-bold text-[var(--color-term-error)] font-mono uppercase tracking-wider">! VULNERABLE_CODE</span>
                        </div>
                        <CodeBlock code={finding.code_snippet} />
                      </div>
                    )}
                    {finding.suggested_fix && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[9px] font-bold text-[var(--color-term-fg)] font-mono uppercase tracking-wider">{'>'} SUGGESTED_FIX</span>
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

        {/* Before/after fixed-contract preview */}
        {diffPreview && (
          <DiffPreview
            original={diffPreview.original}
            fixed={diffPreview.fixed}
            fixesApplied={diffPreview.fixesApplied}
            fixesManual={diffPreview.fixesManual}
          />
        )}
      </div>
    );
  }

  // Scan list view
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
            SCANS LIST
          </h1>
          <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
            {allScans.length} TOTAL SCANS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[var(--color-term-border)] bg-[var(--color-term-bg)] text-[var(--color-term-fg)] font-mono text-xs px-2 py-2 outline-none"
            aria-label="Filter by category"
          >
            <option value="all">ALL CATEGORIES</option>
            <option value="Access & Auth">ACCESS & AUTH</option>
            <option value="Fund Safety">FUND SAFETY</option>
            <option value="Logic & Data">LOGIC & DATA</option>
            <option value="Hygiene">HYGIENE</option>
          </select>
          <div className="relative flex items-center border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-2 w-48">
            <Search className="h-3 w-3 text-[var(--color-term-muted)] mr-1" />
            <input
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-xs py-1.5 placeholder:text-[var(--color-term-muted)]"
            />
          </div>
        </div>
      </div>

      {scansError && (
        <Card>
          <CardContent className="p-4 text-center text-xs text-[var(--color-term-error)] font-mono">
            [!] ERROR: {scansError}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3">
          {scansLoading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-8 border border-[var(--color-term-border)] bg-[var(--color-term-dim)] animate-pulse" />
              ))}
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-6 text-xs text-[var(--color-term-muted)] font-mono">
              {searchQuery ? "NO SCANS MATCH YOUR SEARCH. TRY A DIFFERENT QUERY." : "NO SCANS YET. USE THE SCAN INPUT ABOVE TO ANALYZE YOUR FIRST CONTRACT."}
            </div>
          ) : (
            <ScanList scans={filteredScans} onSelect={setSelectedScanId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
