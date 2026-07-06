"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useScans } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/utils";
import {
  Github,
  BookOpen,
  AlertTriangle,
  Settings,
  Copy,
  FileText,
} from "lucide-react";

export default function ReposPage() {
  const { data: scansData, loading: scansLoading, error: scansError } = useScans({ page_size: 100 });
  const scans = scansData?.items || [];

  // Group scans by inferred repo name (contract name acts as repo context)
  const scanGroups: Record<string, typeof scans> = {};
  scans.forEach((scan) => {
    const name = scan.contract_name || "Unknown";
    if (!scanGroups[name]) scanGroups[name] = [];
    scanGroups[name].push(scan);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
            $ REPOS --LIST
          </h1>
          <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
            # SCANNED CONTRACTS AND CI/CD INTEGRATION STATUS
          </p>
        </div>
        <Button className="gap-2">
          <Github className="h-3.5 w-3.5" />
          [ CONNECT_REPO ]
        </Button>
      </div>

      {/* Setup Guide */}
      <Card className="border-[var(--color-term-fg)] bg-[var(--color-term-dim)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--color-term-fg)] text-[var(--color-term-fg)]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider mb-1">
                $ QUICK_SETUP --GUIDE
              </h3>
              <p className="text-[10px] text-[var(--color-term-muted)] mb-2 font-mono">
                SECURITHM AUTOMATICALLY SCANS EVERY PR AND PUSH WHEN YOU INSTALL THE GITHUB ACTION.
              </p>
              <ol className="space-y-1.5 text-[10px] text-[var(--color-term-muted)] font-mono">
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center border border-[var(--color-term-fg)] text-[var(--color-term-fg)] text-[8px] font-bold">1</span>
                  <span>$ CONNECT_REPO — SELECT FROM GITHUB OAUTH FLOW</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center border border-[var(--color-term-fg)] text-[var(--color-term-fg)] text-[8px] font-bold">2</span>
                  <span>$ CONFIG_THRESHOLD — PRs WILL FAIL CI IF EXCEEDED</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center border border-[var(--color-term-fg)] text-[var(--color-term-fg)] text-[8px] font-bold">3</span>
                  <span>$ PUSH_CODE — SECURITHM POSTS INLINE COMMENTS + SARIF</span>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Repos */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
          {">"} SCANNED_CONTRACTS
        </h2>

        {scansError && (
          <Card>
            <CardContent className="p-4 text-center text-xs text-[var(--color-term-error)] font-mono">
              [!] ERROR: {scansError}
            </CardContent>
          </Card>
        )}

        {scansLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-[var(--color-term-dim)]" /></Card>
            ))}
          </div>
        ) : Object.keys(scanGroups).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
              $ NO_SCANS_YET
            </CardContent>
          </Card>
        ) : (
          Object.entries(scanGroups).map(([name, repoScans]) => {
            const completed = repoScans.filter(s => s.status === "completed");
            const totalFindings = completed.reduce((sum, s) => sum + (s.findings?.length || 0), 0);
            const criticalCount = completed.reduce(
              (sum, s) => sum + (s.findings?.filter(f => f.severity === "critical").length || 0), 0
            );
            const lastScan = completed[0];

            return (
              <Card key={name}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--color-term-border)] text-[var(--color-term-fg)]">
                        <Github className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-[var(--color-term-fg)] uppercase">{name}</h3>
                          <Badge variant="default" className="text-[9px]">[ACTIVE]</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[9px] text-[var(--color-term-muted)] font-mono">
                          <span className="flex items-center gap-1">
                            <FileText className="h-2.5 w-2.5" />
                            {repoScans.length} SCANS
                          </span>
                          <span>{totalFindings} FINDINGS</span>
                          {criticalCount > 0 && (
                            <span className="flex items-center gap-1 text-[var(--color-term-error)]">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {criticalCount} CRITICAL
                            </span>
                          )}
                          <span>
                            LAST: {lastScan ? formatRelativeTime(lastScan.created_at) : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Settings className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="text-[9px] h-7">[ VIEW ]</Button>
                    </div>
                  </div>

                  <hr className="border-t border-dashed border-[var(--color-term-border)] my-3" />

                  {/* Recent scans for this repo */}
                  <div className="space-y-1 mb-3">
                    <span className="text-[8px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">{">"} RECENT_ACTIVITY</span>
                    {repoScans.slice(0, 3).map(scan => (
                      <div key={scan.id} className="flex items-center justify-between py-0.5 text-[9px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 ${
                            scan.status === "completed" ? "bg-[var(--color-term-fg)]" :
                            scan.status === "running" ? "bg-[var(--color-term-warning)] animate-blink" : "bg-[var(--color-term-muted)]"
                          }`} />
                          <span className="text-[var(--color-term-muted)]">
                            {scan.status === "running" ? "SCANNING..." : "[COMPLETED]"}
                          </span>
                        </div>
                        <span className="text-[var(--color-term-muted)]">
                          {scan.created_at ? formatRelativeTime(scan.created_at) : ""}
                          {scan.risk_score_overall && ` · ${scan.risk_score_overall}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CI Config Preview */}
                  <div className="text-[10px] font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] text-[var(--color-term-muted)] uppercase tracking-wider">{">"} CI_CONFIG</span>
                      <Button variant="ghost" size="sm" className="gap-1 h-5 text-[8px]">
                        <Copy className="h-2.5 w-2.5" />
                        [ COPY ]
                      </Button>
                    </div>
                    <pre className="border border-[var(--color-term-border)] bg-[#050505] text-[var(--color-term-fg)] p-2 overflow-x-auto text-[9px] leading-relaxed">
                      <code>{"name: SECURITHM_SCAN\non: [push, pull_request]\njobs:\n  security-scan:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: securithm/action@v1\n        with:\n          threshold: HIGH\n          token: ${{ secrets.SECURITHM_TOKEN }}"}</code>
                    </pre>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-[var(--color-term-border)]">
                    <span className="text-[9px] text-[var(--color-term-muted)] font-mono">$ AUTO_SCAN: ENABLED</span>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
