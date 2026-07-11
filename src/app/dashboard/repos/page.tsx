"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useScans } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/api";
import {
  Github,
  BookOpen,
  AlertTriangle,
  Settings,
  Copy,
  FileText,
  Unlink,
  RefreshCw,
  CheckCircle2,
  Lock,
  Globe,
  ExternalLink,
  GitBranch,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  language: string;
  updated_at: string;
  default_branch: string;
}

interface GithubReposResponse {
  repos: GithubRepo[];
  connected: boolean;
  message: string;
}

export default function ReposPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: scansData, loading: scansLoading, error: scansError } = useScans({ page_size: 100 });
  const scans = scansData?.items || [];

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Check for github_connected param in URL (returned from OAuth callback)
  useEffect(() => {
    const ghConnected = searchParams.get("github_connected");
    const errorParam = searchParams.get("error");
    if (ghConnected) {
      setGithubLogin(ghConnected);
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/repos");
    }
    if (errorParam === "github_connection_failed") {
      setReposError("GitHub connection failed. Make sure you logged in with GitHub first.");
      window.history.replaceState({}, "", "/dashboard/repos");
    }
  }, [searchParams]);

  // Fetch GitHub connection status + repos on mount
  const fetchGithubRepos = async () => {
    setReposLoading(true);
    setReposError(null);
    try {
      const token = localStorage.getItem("securithm_token");
      if (!token) return;
      api.setAuthToken(token);

      const data = await api.request<GithubReposResponse>("/api/v1/auth/github/repos");
      setGithubConnected(data.connected);
      setRepos(data.repos);
      if (data.message) {
        setReposError(data.message);
      }
    } catch (e) {
      setReposError(e instanceof Error ? e.message : "Failed to fetch repos");
    } finally {
      setReposLoading(false);
    }
  };

  useEffect(() => {
    fetchGithubRepos();
  }, []);

  // Initiate GitHub OAuth for repo connection
  const handleConnect = async () => {
    setConnecting(true);
    setReposError(null);
    try {
      const token = localStorage.getItem("securithm_token");
      if (!token) throw new Error("Not authenticated");
      api.setAuthToken(token);

      const data = await api.request<{ authorization_url: string }>("/api/v1/auth/github/connect");
      // Redirect to GitHub OAuth page
      window.location.href = data.authorization_url;
    } catch (e) {
      setReposError(e instanceof Error ? e.message : "Failed to initiate connection");
      setConnecting(false);
    }
  };

  // Disconnect GitHub
  const handleDisconnect = async () => {
    setReposLoading(true);
    try {
      const token = localStorage.getItem("securithm_token");
      if (!token) return;
      api.setAuthToken(token);
      await api.request("/api/v1/auth/github/disconnect");
      setGithubConnected(false);
      setRepos([]);
      setGithubLogin(null);
    } catch (e) {
      setReposError(e instanceof Error ? e.message : "Failed to disconnect");
    } finally {
      setReposLoading(false);
    }
  };

  // Group scans by inferred repo name
  const scanGroups: Record<string, typeof scans> = {};
  scans.forEach((scan) => {
    const name = scan.contract_name || "Unknown";
    if (!scanGroups[name]) scanGroups[name] = [];
    scanGroups[name].push(scan);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
            GITHUB REPOS
          </h1>
          <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
            CONNECT YOUR GITHUB ACCOUNT TO AUTO-SCAN REPOS VIA CI/CD
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[9px]"
            onClick={fetchGithubRepos}
            disabled={reposLoading}
          >
            <RefreshCw className={`h-3 w-3 ${reposLoading ? "animate-spin" : ""}`} />
            [ REFRESH ]
          </Button>
          {githubConnected ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[9px] text-[var(--color-term-error)]"
              onClick={handleDisconnect}
            >
              <Unlink className="h-3 w-3" />
              [ DISCONNECT ]
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 text-[9px]"
              onClick={handleConnect}
              disabled={connecting}
            >
              <Github className="h-3.5 w-3.5" />
              {connecting ? "CONNECTING..." : "[ CONNECT GITHUB ]"}
            </Button>
          )}
        </div>
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
                  <span>$ CLICK [CONNECT GITHUB] — AUTHORIZE VIA OAUTH (REPO SCOPE)</span>
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

      {/* GitHub Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-[var(--color-term-fg)]" />
              <div>
                <div className="text-xs font-bold text-[var(--color-term-fg)] font-mono uppercase">
                  GITHUB CONNECTION
                </div>
                <div className="text-[9px] font-mono text-[var(--color-term-muted)] mt-0.5">
                  {githubConnected
                    ? `CONNECTED${githubLogin ? ` AS @${githubLogin}` : ""}`
                    : "NOT CONNECTED"}
                </div>
              </div>
            </div>
            <Badge
              variant="default"
              className={`text-[9px] gap-1 ${githubConnected ? "" : "opacity-40"}`}
            >
              {githubConnected ? (
                <><CheckCircle2 className="h-2.5 w-2.5" /> [CONNECTED]</>
              ) : (
                <><Unlink className="h-2.5 w-2.5" /> [DISCONNECTED]</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Repos List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
          {">"} CONNECTED_REPOS
        </h2>

        {reposError && (
          <Card>
            <CardContent className="p-4 text-center text-xs text-[var(--color-term-error)] font-mono">
              [!] {reposError}
            </CardContent>
          </Card>
        )}

        {reposLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-[var(--color-term-dim)]" /></Card>
            ))}
          </div>
        ) : !githubConnected ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
              <Github className="h-8 w-8 mx-auto mb-3 opacity-30" />
              NO GITHUB CONNECTION. CLICK [CONNECT GITHUB] ABOVE TO AUTHORIZE.
              <div className="mt-3 space-y-1 text-[9px] text-[var(--color-term-muted)]">
                <div>1. YOU WILL BE REDIRECTED TO GITHUB OAUTH</div>
                <div>2. GRANT ACCESS TO YOUR REPOS (REPO SCOPE)</div>
                <div>3. WE WILL FETCH YOUR REPOS AND ENABLE CI/CD</div>
              </div>
            </CardContent>
          </Card>
        ) : repos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-[var(--color-term-fg)]" />
              GITHUB CONNECTED, BUT NO REPOS FOUND.
              <div className="mt-2 text-[9px] text-[var(--color-term-muted)]">
                MAKE SURE YOUR ACCOUNT HAS AT LEAST ONE REPO.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y divide-[var(--color-term-border)] border border-[var(--color-term-border)]">
            {repos.map((repo) => (
              <div key={repo.id} className="p-3 hover:bg-[var(--color-term-dim)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--color-term-border)] mt-0.5">
                      {repo.private ? (
                        <Lock className="h-3.5 w-3.5 text-[var(--color-term-muted)]" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[var(--color-term-fg)] font-mono uppercase hover:underline truncate"
                        >
                          {repo.full_name}
                        </a>
                        <Badge variant="default" className={`text-[8px] px-1 ${repo.private ? "" : "opacity-50"}`}>
                          [{repo.private ? "PRIVATE" : "PUBLIC"}]
                        </Badge>
                      </div>
                      {repo.description && (
                        <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-0.5 truncate">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[8px] text-[var(--color-term-muted)] font-mono">
                        {repo.language && (
                          <span>{repo.language}</span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <GitBranch className="h-2.5 w-2.5" />
                          {repo.default_branch}
                        </span>
                        <span>
                          UPDATED: {repo.updated_at ? formatRelativeTime(repo.updated_at) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)]"
                      onClick={() => window.open(repo.html_url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scanned Contracts Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
          {">"} SCANNED_CONTRACTS
        </h2>

        {scansError && (
          <Card>
            <CardContent className="p-4 text-center text-xs text-[var(--color-term-error)] font-mono">
              [!] API CONNECTION ERROR: {scansError}. MAKE SURE THE BACKEND IS RUNNING ON PORT 8000.
            </CardContent>
          </Card>
        )}

        {scansLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-[var(--color-term-dim)]" /></Card>
            ))}
          </div>
        ) : !scansError && Object.keys(scanGroups).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
              NO SCANNED CONTRACTS YET. SUBMIT A CONTRACT IN THE SCANS PAGE TO GET STARTED.
            </CardContent>
          </Card>
        ) : (
          Object.entries(scanGroups).map(([name, repoScans]) => {
            const completed = repoScans.filter((s) => s.status === "completed");
            const totalFindings = completed.reduce(
              (sum, s) => sum + (s.findings?.length || 0), 0
            );
            const criticalCount = completed.reduce(
              (sum, s) =>
                sum +
                (s.findings?.filter((f) => f.severity === "critical").length || 0),
              0
            );
            const lastScan = completed[0];

            return (
              <Card key={name}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--color-term-border)] text-[var(--color-term-fg)]">
                        <FileText className="h-4 w-4" />
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
                            LAST:{" "}
                            {lastScan
                              ? formatRelativeTime(lastScan.created_at)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[9px] h-7"
                        onClick={() => {
                          const firstScan = repoScans[0];
                          if (firstScan)
                            router.push(
                              `/dashboard/scans?id=${firstScan.id}`
                            );
                        }}
                      >
                        [ VIEW ]
                      </Button>
                    </div>
                  </div>

                  <hr className="border-t border-dashed border-[var(--color-term-border)] my-3" />

                  {/* Recent scans */}
                  <div className="space-y-1 mb-3">
                    <span className="text-[8px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
                      {">"} RECENT_ACTIVITY
                    </span>
                    {repoScans.slice(0, 3).map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between py-0.5 text-[9px] font-mono"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 ${
                              scan.status === "completed"
                                ? "bg-[var(--color-term-fg)]"
                                : scan.status === "running"
                                ? "bg-[var(--color-term-warning)] animate-blink"
                                : "bg-[var(--color-term-muted)]"
                            }`}
                          />
                          <span className="text-[var(--color-term-muted)]">
                            {scan.status === "running"
                              ? "SCANNING..."
                              : "[COMPLETED]"}
                          </span>
                        </div>
                        <span className="text-[var(--color-term-muted)]">
                          {scan.created_at
                            ? formatRelativeTime(scan.created_at)
                            : ""}
                          {scan.risk_score_overall &&
                            ` · ${scan.risk_score_overall}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CI Config */}
                  <div className="text-[10px] font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] text-[var(--color-term-muted)] uppercase tracking-wider">
                        {">"} CI_CONFIG
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-5 text-[8px]"
                        onClick={() => {
                          const config = `name: SECURITHM_SCAN\non: [push, pull_request]\njobs:\n  security-scan:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: securithm/action@v1\n        with:\n          threshold: HIGH\n          token: \${{ secrets.SECURITHM_TOKEN }}`;
                          navigator.clipboard.writeText(config);
                          alert("CI CONFIG COPIED TO CLIPBOARD");
                        }}
                      >
                        <Copy className="h-2.5 w-2.5" />
                        [ COPY ]
                      </Button>
                    </div>
                    <pre className="border border-[var(--color-term-border)] bg-[#050505] text-[var(--color-term-fg)] p-2 overflow-x-auto text-[9px] leading-relaxed">
                      <code>{"name: SECURITHM_SCAN\non: [push, pull_request]\njobs:\n  security-scan:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: securithm/action@v1\n        with:\n          threshold: HIGH\n          token: ${{ secrets.SECURITHM_TOKEN }}"}</code>
                    </pre>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-[var(--color-term-border)]">
                    <span className="text-[9px] text-[var(--color-term-muted)] font-mono">
                      $ AUTO_SCAN: ENABLED
                    </span>
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
