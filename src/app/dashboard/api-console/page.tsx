"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  CheckCircle2,
  Search,
  RefreshCw,
  Download,
  Info,
} from "lucide-react";
import * as api from "@/lib/api";

const apiEndpoints = [
  {
    method: "GET",
    path: "/api/v1/risk-score/{chain}/{address}",
    description: "GET CURRENT RISK SCORE FOR A CONTRACT ADDRESS",
  },
  {
    method: "GET",
    path: "/api/v1/risk-score/{chain}/{address}/history",
    description: "GET HISTORICAL RISK SCORE DATA",
  },
  {
    method: "GET",
    path: "/api/v1/scans/{id}",
    description: "RETRIEVE SCAN RESULTS BY ID",
  },
  {
    method: "POST",
    path: "/api/v1/scans",
    description: "SUBMIT A NEW CONTRACT FOR ANALYSIS",
  },
  {
    method: "GET",
    path: "/api/v1/nft/analyze/{chain}/{address}",
    description: "ANALYZE NFT COLLECTION SECURITY (NEW)",
    isNew: true,
  },
  {
    method: "GET",
    path: "/api/v1/nft/collections",
    description: "LIST ANALYZED NFT COLLECTIONS (NEW)",
    isNew: true,
  },
  {
    method: "GET",
    path: "/api/v1/token/analyze/{chain}/{address}",
    description: "ANALYZE TOKEN CONTRACT SECURITY (NEW)",
    isNew: true,
  },
  {
    method: "GET",
    path: "/api/v1/token/list",
    description: "LIST ANALYZED TOKENS (NEW)",
    isNew: true,
  },
  {
    method: "GET",
    path: "/api/v1/payments/plans",
    description: "LIST BILLING PLANS AND PRICING (NEW)",
    isNew: true,
  },
  {
    method: "GET",
    path: "/api/v1/payments/usage",
    description: "GET CURRENT USAGE STATISTICS (NEW)",
    isNew: true,
  },
  {
    method: "GET",
    path: "/api/v1/payments/dashboard",
    description: "FULL PAYMENTS DASHBOARD WITH PLAN + USAGE (NEW)",
    isNew: true,
  },
];

function gradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: "text-[var(--color-term-fg)] border-[var(--color-term-fg)]",
    B: "text-risk-b border-risk-b",
    C: "text-[var(--color-term-warning)] border-[var(--color-term-warning)]",
    D: "text-[var(--color-term-secondary)] border-[var(--color-term-secondary)]",
    E: "text-severity-high border-severity-high",
    F: "text-[var(--color-term-error)] border-[var(--color-term-error)]",
  };
  return colors[grade] || "text-[var(--color-term-muted)] border-[var(--color-term-border)]";
}

export default function ApiConsolePage() {
  const [contractAddress, setContractAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("ethereum");
  const [riskResult, setRiskResult] = useState<api.RiskScoreResponse | null>(null);
  const [historyResult, setHistoryResult] = useState<api.RiskScoreResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleLookup = async () => {
    if (!contractAddress.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const [score, history] = await Promise.all([
        api.getRiskScore(selectedChain, contractAddress.trim()),
        api.getRiskScoreHistory(selectedChain, contractAddress.trim()),
      ]);
      setRiskResult(score);
      setHistoryResult(history);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LOOKUP FAILED");
      setRiskResult(null);
      setHistoryResult([]);
    } finally {
      setLoading(false);
    }
  };

  const averageScore =
    historyResult.length > 0
      ? Math.round(
          historyResult.reduce((sum, h) => sum + h.risk_score, 0) /
            historyResult.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
            $ RISK_API --CONSOLE
          </h1>
          <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
            # INSTITUTIONAL RISK SCORING API — DUE DILIGENCE FOR EXCHANGES, INSURERS, AND FUNDS
          </p>
        </div>
        <Badge variant="default" className="gap-1 text-[9px]">
          <CheckCircle2 className="h-2.5 w-2.5 text-[var(--color-term-fg)]" />
          [ENTERPRISE]
        </Badge>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} API_CREDENTIALS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
              $ API_KEY
            </label>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-term-fg)]">
                aai_live_sk_••••••••••••••••••••••••••
              </code>
              <Button variant="outline" size="icon" className="h-7 w-7">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-[9px] h-7">
                <RefreshCw className="h-3 w-3" />
                [ ROTATE ]
              </Button>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
              $ BASE_URL
            </label>
            <code className="block border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-term-fg)]">
              http://localhost:8000
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Live Risk Score Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} RISK_SCORE_LOOKUP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
                $ CONTRACT_ADDRESS
              </label>
              <div className="flex items-center border border-[var(--color-term-border)] px-2">
                <span className="text-[var(--color-term-muted)] text-xs mr-1">$</span>
                <input
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-sm py-1.5 placeholder:text-[var(--color-term-muted)]"
                />
              </div>
            </div>
            <div className="w-32">
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
                $ CHAIN
              </label>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">ETHEREUM</SelectItem>
                  <SelectItem value="base">BASE</SelectItem>
                  <SelectItem value="arbitrum">ARBITRUM</SelectItem>
                  <SelectItem value="polygon">POLYGON</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                  <SelectItem value="solana">SOLANA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleLookup}
              disabled={!contractAddress.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <span className="animate-blink">▶</span>
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              [ LOOKUP ]
            </Button>
          </div>

          {/* Results */}
          {error && (
            <div className="p-2.5 border border-[var(--color-term-error)] text-xs text-[var(--color-term-error)] font-mono">
              [!] {error}
            </div>
          )}

          {riskResult && !error && (
            <div className="space-y-4">
              {/* Score Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-[9px] text-[var(--color-term-muted)] font-mono mb-1">RISK_SCORE</div>
                    <div className="text-lg font-bold text-[var(--color-term-fg)] term-glow">{riskResult.risk_score}</div>
                    <div className="text-[8px] text-[var(--color-term-muted)] font-mono">/ 100</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-[9px] text-[var(--color-term-muted)] font-mono mb-1">GRADE</div>
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 border text-sm font-bold font-mono ${gradeColor(riskResult.grade)}`}
                      >
                        {riskResult.grade}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-[9px] text-[var(--color-term-muted)] font-mono mb-1">CONFIDENCE</div>
                    <div className="text-xs font-bold text-[var(--color-term-fg)] font-mono uppercase">
                      {riskResult.confidence}
                    </div>
                    <div className="text-[8px] text-[var(--color-term-muted)] font-mono">
                      {riskResult.total_findings} FINDINGS
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-[9px] text-[var(--color-term-muted)] font-mono mb-1">AVG_HISTORY</div>
                    <div className="text-xs font-bold text-[var(--color-term-fg)] font-mono">
                      {historyResult.length > 0 ? averageScore : "—"}
                    </div>
                    <div className="text-[8px] text-[var(--color-term-muted)] font-mono">
                      {historyResult.length} PTS
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Findings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>{">"} FINDINGS_BREAKDOWN</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {(
                      [
                        { key: "critical_count", label: "CRITICAL", color: "text-[var(--color-term-error)] border-[var(--color-term-error)]" },
                        { key: "high_count", label: "HIGH", color: "text-[var(--color-term-warning)] border-[var(--color-term-warning)]" },
                        { key: "medium_count", label: "MEDIUM", color: "text-[var(--color-severity-medium)] border-[var(--color-severity-medium)]" },
                        { key: "low_count", label: "LOW", color: "text-[var(--color-severity-low)] border-[var(--color-severity-low)]" },
                        { key: "total_findings", label: "TOTAL", color: "text-[var(--color-term-muted)] border-[var(--color-term-border)]" },
                      ] as const
                    ).map(({ key, label, color }) => (
                      <div
                        key={key}
                        className={`p-2 text-center border ${color}`}
                      >
                        <div className="text-xs font-bold text-[var(--color-term-fg)]">
                          {riskResult[key as keyof typeof riskResult]}
                        </div>
                        <div className="text-[8px] font-mono">{label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* History Chart */}
              {historyResult.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{">"} SCORE_HISTORY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between h-20 gap-0.5">
                      {historyResult.slice(0, 14).reverse().map((point, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-0.5"
                        >
                          <div
                            className="w-full transition-all duration-300"
                            style={{
                              height: `${Math.max(8, (point.risk_score / 100) * 100)}%`,
                              backgroundColor:
                                point.risk_score >= 60
                                  ? "var(--color-term-error)"
                                  : point.risk_score >= 40
                                  ? "var(--color-term-warning)"
                                  : point.risk_score >= 20
                                  ? "var(--color-severity-medium)"
                                  : "var(--color-term-fg)",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Monitored Portfolio */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{">"} MONITORED_PORTFOLIO</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5 text-[9px]">
                    <Download className="h-3 w-3" />
                    [ EXPORT_PDF ]
                  </Button>
                </CardHeader>
                <CardContent>
                  {historyResult.length === 0 ? (
                    <div className="text-xs text-[var(--color-term-muted)] text-center py-3 font-mono">
                      $ NO_HISTORY_DATA
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--color-term-border)]">
                      {historyResult.slice(0, 10).map((point, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0"
                        >
                          <div>
                            <div className="text-[10px] font-mono text-[var(--color-term-fg)]">
                              {point.address.slice(0, 10)}...{point.address.slice(-6)}
                            </div>
                            <div className="text-[8px] text-[var(--color-term-muted)] font-mono">
                              {point.last_scanned
                                ? new Date(point.last_scanned).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-[var(--color-term-fg)]">{point.risk_score}</div>
                            </div>
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 border text-[8px] font-bold font-mono ${gradeColor(point.grade)}`}
                            >
                              {point.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {!riskResult && !error && !loading && searched && (
            <div className="p-4 text-center text-xs text-[var(--color-term-muted)] font-mono border border-dashed border-[var(--color-term-border)]">
              <Info className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
              $ NO_RISK_DATA_FOUND
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} API_ENDPOINTS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {apiEndpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-start gap-2 p-2.5 border border-[var(--color-term-border)]"
              >
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold font-mono border ${
                    endpoint.method === "GET"
                      ? "text-[var(--color-term-fg)] border-[var(--color-term-fg)]"
                      : "text-[var(--color-severity-low)] border-[var(--color-severity-low)]"
                  }`}
                >
                  {endpoint.method}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-[10px] font-mono text-[var(--color-term-fg)] block truncate">
                    {endpoint.path}
                  </code>
                  <p className="text-[8px] text-[var(--color-term-muted)] font-mono mt-0.5">
                    {endpoint.description}
                  </p>
                </div>
                {'isNew' in endpoint && endpoint.isNew && (
                  <span className="inline-flex items-center px-1 py-0.5 text-[8px] font-bold font-mono border border-[var(--color-term-fg)] text-[var(--color-term-fg)] animate-pulse">
                    [NEW]
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
