"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    description: "Get current risk score for a contract address",
  },
  {
    method: "GET",
    path: "/api/v1/risk-score/{chain}/{address}/history",
    description: "Get historical risk score data",
  },
  {
    method: "GET",
    path: "/api/v1/scans/{id}",
    description: "Retrieve scan results by ID",
  },
  {
    method: "POST",
    path: "/api/v1/scans",
    description: "Submit a new contract for analysis",
  },
];

function gradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: "bg-green-500",
    B: "bg-green-400",
    C: "bg-yellow-500",
    D: "bg-orange-500",
    E: "bg-red-500",
    F: "bg-red-600",
  };
  return colors[grade] || "bg-gray-500";
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
      setError(e instanceof Error ? e.message : "Lookup failed");
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
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk API</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
            Institutional risk scoring API — due diligence for exchanges, insurers, and funds
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Enterprise Plan
        </Badge>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
              API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 font-mono text-sm border border-surface-200 dark:border-surface-700">
                aai_live_sk_••••••••••••••••••••••••••
              </code>
              <Button variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Rotate
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
              Base URL
            </label>
            <code className="block px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 font-mono text-sm">
              http://localhost:8000
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Live Risk Score Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Score Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
                Contract Address
              </label>
              <Input
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="w-36">
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5 block">
                Chain
              </label>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleLookup}
              disabled={!contractAddress.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Lookup
            </Button>
          </div>

          {/* Results */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {riskResult && !error && (
            <div className="space-y-4">
              {/* Score Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-surface-500 mb-1">Risk Score</div>
                    <div className="text-3xl font-bold">{riskResult.risk_score}</div>
                    <div className="text-[10px] text-surface-400">/ 100</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-surface-500 mb-1">Grade</div>
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold text-white ${gradeColor(riskResult.grade)}`}
                      >
                        {riskResult.grade}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-surface-500 mb-1">Confidence</div>
                    <div className="text-lg font-semibold capitalize">
                      {riskResult.confidence}
                    </div>
                    <div className="text-[10px] text-surface-400">
                      {riskResult.total_findings} findings
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-surface-500 mb-1">History Avg</div>
                    <div className="text-lg font-semibold">
                      {historyResult.length > 0 ? averageScore : "—"}
                    </div>
                    <div className="text-[10px] text-surface-400">
                      {historyResult.length} data points
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Findings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Findings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {(
                      [
                        { key: "critical_count", label: "Critical", color: "text-red-600 bg-red-500/10" },
                        { key: "high_count", label: "High", color: "text-orange-600 bg-orange-500/10" },
                        { key: "medium_count", label: "Medium", color: "text-yellow-600 bg-yellow-500/10" },
                        { key: "low_count", label: "Low", color: "text-blue-600 bg-blue-500/10" },
                        { key: "total_findings", label: "Total", color: "text-surface-600 bg-surface-500/10" },
                      ] as const
                    ).map(({ key, label, color }) => (
                      <div
                        key={key}
                        className={`p-2 rounded-lg text-center ${color}`}
                      >
                        <div className="text-lg font-bold">
                          {riskResult[key as keyof typeof riskResult]}
                        </div>
                        <div className="text-[10px]">{label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* History Chart */}
              {historyResult.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Score History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between h-24 gap-1">
                      {historyResult.slice(0, 14).reverse().map((point, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full rounded-t-md transition-all duration-300"
                            style={{
                              height: `${Math.max(8, (point.risk_score / 100) * 100)}%`,
                              backgroundColor:
                                point.risk_score >= 60
                                  ? "#ef4444"
                                  : point.risk_score >= 40
                                  ? "#f97316"
                                  : point.risk_score >= 20
                                  ? "#eab308"
                                  : "#22c55e",
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
                  <CardTitle className="text-sm">Monitored Portfolio</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Export PDF Report
                  </Button>
                </CardHeader>
                <CardContent>
                  {historyResult.length === 0 ? (
                    <div className="text-sm text-surface-400 text-center py-4">
                      No historical data for this contract
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-200 dark:divide-surface-700">
                      {historyResult.slice(0, 10).map((point, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {point.address.slice(0, 10)}...{point.address.slice(-6)}
                            </div>
                            <div className="text-xs text-surface-400">
                              {point.last_scanned
                                ? new Date(point.last_scanned).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-bold">{point.risk_score}</div>
                            </div>
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white ${gradeColor(point.grade)}`}
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
            <div className="p-6 text-center text-sm text-surface-400 border border-dashed border-surface-300 dark:border-surface-600 rounded-lg">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No risk data found. Try scanning a contract first.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiEndpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-start gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700"
              >
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    endpoint.method === "GET"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {endpoint.method}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono text-surface-900 dark:text-surface-100 block truncate">
                    {endpoint.path}
                  </code>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {endpoint.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
