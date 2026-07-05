"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repositories</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
            Scanned contracts and CI/CD integration status
          </p>
        </div>
        <Button className="gap-2">
          <Github className="h-4 w-4" />
          Connect Repository
        </Button>
      </div>

      {/* Setup Guide */}
      <Card className="border-brand-500/30 bg-brand-50/50 dark:bg-brand-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Quick Setup Guide</h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                AuditAI automatically scans every PR and push when you install the GitHub Action.
              </p>
              <ol className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">1</span>
                  <span>Click "Connect Repository" and select your repo from the GitHub OAuth flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">2</span>
                  <span>Configure severity threshold — PRs will fail CI if findings exceed this level</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">3</span>
                  <span>Push code — AuditAI posts inline PR comments and publishes SARIF reports</span>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Repos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Scanned Contracts</h2>

        {scansError && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-red-500">
              Error loading scans: {scansError}
            </CardContent>
          </Card>
        )}

        {scansLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i}><CardContent className="p-6 h-24 animate-pulse bg-surface-100 dark:bg-surface-800 rounded-xl" /></Card>
            ))}
          </div>
        ) : Object.keys(scanGroups).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-surface-400">
              No scans yet. Connect a repo or scan a contract to see results here.
            </CardContent>
          </Card>
        ) : (
          Object.entries(scanGroups).map(([name, repoScans]) => {
            const completed = repoScans.filter(s => s.status === "completed");
            const running = repoScans.filter(s => s.status === "running");
            const totalFindings = completed.reduce((sum, s) => sum + (s.findings?.length || 0), 0);
            const criticalCount = completed.reduce(
              (sum, s) => sum + (s.findings?.filter(f => f.severity === "critical").length || 0), 0
            );
            const lastScan = completed[0];

            return (
              <Card key={name}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                        <Github className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{name}</h3>
                          <Badge variant="default">active</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {repoScans.length} scans
                          </span>
                          <span>{totalFindings} findings</span>
                          {criticalCount > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              {criticalCount} critical
                            </span>
                          )}
                          <span>
                            Last: {lastScan ? formatRelativeTime(lastScan.created_at) : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm"><Settings className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="sm">View Scans</Button>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Recent scans for this repo */}
                  <div className="space-y-1 mb-4">
                    <span className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">Recent Activity</span>
                    {repoScans.slice(0, 3).map(scan => (
                      <div key={scan.id} className="flex items-center justify-between py-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            scan.status === "completed" ? "bg-green-500" :
                            scan.status === "running" ? "bg-blue-500 animate-pulse" : "bg-gray-500"
                          }`} />
                          <span className="text-surface-600 dark:text-surface-400">
                            {scan.status === "running" ? "Scan in progress..." : `Scan completed`}
                          </span>
                        </div>
                        <span className="text-surface-400">
                          {scan.created_at ? formatRelativeTime(scan.created_at) : ""}
                          {scan.risk_score_overall && ` · Score: ${scan.risk_score_overall}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CI Config Preview */}
                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-surface-500 uppercase tracking-wider">CI Configuration</span>
                      <Button variant="ghost" size="sm" className="gap-1 h-6 text-xs">
                        <Copy className="h-3 w-3" />
                        Copy YAML
                      </Button>
                    </div>
                    <pre className="rounded-lg bg-surface-950 dark:bg-surface-900 text-surface-50 p-3 overflow-x-auto text-xs leading-relaxed">
                      <code>{`name: AuditAI Scan
on: [push, pull_request]
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: auditai/action@v1
        with:
          severity-threshold: high
          github-token: \${{ secrets.AUDITAI_TOKEN }}`}</code>
                    </pre>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <span className="text-xs text-surface-500">Auto-scanning is enabled</span>
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
