"use client";

import { useState, useEffect, useRef } from "react";
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
  Info,
  Plus,
  Trash2,
  Key,
  Gauge,
  Terminal,
} from "lucide-react";
import * as api from "@/lib/api";
import { WalletButton } from "@/components/wallet-button";

// ─── API Key Types ──────────────────────────────────────

interface ApiKeyData {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  rate_limit_per_hour: number;
}

interface ApiKeyCreatedData extends ApiKeyData {
  full_key: string;
}

interface UsageStats {
  [keyId: string]: number;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  example?: string;
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/v1/risk-score/{chain}/{address}",
    description: "GET CURRENT RISK SCORE FOR A CONTRACT ADDRESS",
    example: "curl -H \"Authorization: Bearer YOUR_API_KEY\" https://api.securithm.dev/api/v1/risk-score/ethereum/0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  {
    method: "GET",
    path: "/api/v1/risk-score/{chain}/{address}/history",
    description: "GET HISTORICAL RISK SCORE DATA",
    example: "curl -H \"Authorization: Bearer YOUR_API_KEY\" https://api.securithm.dev/api/v1/risk-score/ethereum/0xdAC17F958D2ee523a2206206994597C13D831ec7/history",
  },
  {
    method: "GET",
    path: "/api/v1/scans/{id}",
    description: "RETRIEVE SCAN RESULTS BY ID",
    example: "curl -H \"Authorization: Bearer YOUR_API_KEY\" https://api.securithm.dev/api/v1/scans/YOUR_SCAN_ID",
  },
  {
    method: "POST",
    path: "/api/v1/scans",
    description: "SUBMIT A NEW CONTRACT FOR ANALYSIS",
    example: "curl -X POST -H \"Authorization: Bearer YOUR_API_KEY\" -H \"Content-Type: application/json\" -d '{\"contract_source\":\"0xdAC17F958D2ee523a2206206994597C13D831ec7\",\"chain\":\"ethereum\"}' https://api.securithm.dev/api/v1/scans",
  },
  {
    method: "GET",
    path: "/api/v1/payments/plans",
    description: "LIST BILLING PLANS AND PRICING",
    example: "curl -H \"Authorization: Bearer YOUR_API_KEY\" https://api.securithm.dev/api/v1/payments/plans",
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

  // API Key state
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({});
  const [keysLoading, setKeysLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState("100");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreatedData | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  // cURL copy feedback
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Fetch existing API keys and usage stats on mount
  const fetchApiKeys = async () => {
    setKeysLoading(true);
    try {
      const token = localStorage.getItem("securithm_token");
      if (!token) {
        setApiKeys([]);
        return;
      }
      api.setAuthToken(token);
      const [keys, usage] = await Promise.all([
        api.request<ApiKeyData[]>("/api/v1/auth/api-keys"),
        api.request<UsageStats>("/api/v1/auth/api-keys/usage"),
      ]);
      setApiKeys(keys);
      setUsageStats(usage);
    } catch {
      setApiKeys([]);
      setUsageStats({});
    } finally {
      setKeysLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
    // Auto-refresh usage stats every 30 seconds to show live rate limit consumption
    const interval = setInterval(() => {
      // Only refresh usage silently (don't show loading skeleton)
      const refreshUsage = async () => {
        try {
          const token = localStorage.getItem("securithm_token");
          if (!token) return;
          api.setAuthToken(token);
          const [keys, usage] = await Promise.all([
            api.request<ApiKeyData[]>("/api/v1/auth/api-keys"),
            api.request<UsageStats>("/api/v1/auth/api-keys/usage"),
          ]);
          setApiKeys(keys);
          setUsageStats(usage);
        } catch {
          // Silent — don't disrupt the UX with background refresh errors
        }
      };
      refreshUsage();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Create new API key
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setKeyError(null);
    setCreatedKey(null);

    try {
      const token = localStorage.getItem("securithm_token");
      if (!token) throw new Error("Not authenticated");
      api.setAuthToken(token);

      const res = await api.request<ApiKeyCreatedData>("/api/v1/auth/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name: newKeyName.trim(),
          rate_limit_per_hour: parseInt(newKeyRateLimit) || 100,
        }),
      });

      setCreatedKey(res);
      setNewKeyName("");
      setNewKeyRateLimit("100");
      setShowCreateForm(false);
      await fetchApiKeys();
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  // Revoke API key
  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("REVOKE THIS API KEY? THIS ACTION CANNOT BE UNDONE.")) return;
    try {
      const token = localStorage.getItem("securithm_token");
      if (!token) return;
      api.setAuthToken(token);
      await api.request(`/api/v1/auth/api-keys/${keyId}`, { method: "DELETE" });
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : "Failed to revoke key");
    }
  };

  // Update rate limit (debounced to avoid rapid-fire PATCH calls)
  const rateLimitTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleUpdateRateLimit = (keyId: string, rateLimit: number) => {
    if (rateLimitTimers.current[keyId]) {
      clearTimeout(rateLimitTimers.current[keyId]);
    }
    rateLimitTimers.current[keyId] = setTimeout(async () => {
      try {
        const token = localStorage.getItem("securithm_token");
        if (!token) return;
        api.setAuthToken(token);
        await api.request(`/api/v1/auth/api-keys/${keyId}`, {
          method: "PATCH",
          body: JSON.stringify({ rate_limit_per_hour: rateLimit }),
        });
        await fetchApiKeys();
      } catch (e) {
        setKeyError(e instanceof Error ? e.message : "Failed to update rate limit");
      }
    }, 800);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(rateLimitTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Risk score lookup
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

  // ─── cURL snippet copy ─────────────────────────────────

  const handleCopyCurl = async (endpoint: ApiEndpoint) => {
    setCopiedEndpoint(endpoint.path);
    await navigator.clipboard.writeText(endpoint.example || "");
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  // ─── Usage bar helper ─────────────────────────────────

  const usagePercent = (keyId: string, limit: number): number => {
    const used = usageStats[keyId] || 0;
    if (limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
            RISK API CONSOLE
          </h1>
          <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
            INSTITUTIONAL RISK SCORING API — MANAGE KEYS & RATE LIMITS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WalletButton />
          <Badge variant="default" className="gap-1 text-[9px]">
            <CheckCircle2 className="h-2.5 w-2.5 text-[var(--color-term-fg)]" />
            [ENTERPRISE]
          </Badge>
        </div>
      </div>

      {/* ── API Key Management ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{" >"} API_KEYS</CardTitle>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 text-[9px]"
            onClick={() => {
              setShowCreateForm(true);
              setCreatedKey(null);
              setKeyError(null);
            }}
          >
            <Plus className="h-3 w-3" />
            [ NEW KEY ]
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Create key form */}
          {showCreateForm && (
            <div className="border border-[var(--color-term-border)] p-3 space-y-3">
              <div className="text-[10px] font-bold text-[var(--color-term-fg)] font-mono uppercase tracking-wider">
                $ CREATE_API_KEY
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[8px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
                    NAME
                  </label>
                  <input
                    placeholder="My API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full border border-[var(--color-term-border)] bg-transparent px-2 py-1 text-[11px] font-mono text-[var(--color-term-fg)] outline-none placeholder:text-[var(--color-term-muted)]"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
                    RATE LIMIT (REQ/HR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={newKeyRateLimit}
                    onChange={(e) => setNewKeyRateLimit(e.target.value)}
                    className="w-full border border-[var(--color-term-border)] bg-transparent px-2 py-1 text-[11px] font-mono text-[var(--color-term-fg)] outline-none"
                  />
                </div>
                <div className="flex items-end gap-1">
                  <Button
                    size="sm"
                    className="text-[9px]"
                    disabled={creating || !newKeyName.trim()}
                    onClick={handleCreateKey}
                  >
                    {creating ? "CREATING..." : "[ GENERATE ]"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[9px]"
                    onClick={() => {
                      setShowCreateForm(false);
                      setKeyError(null);
                    }}
                  >
                    [ CANCEL ]
                  </Button>
                </div>
              </div>
              {keyError && (
                <div className="text-[9px] text-[var(--color-term-error)] font-mono">
                  [!] {keyError}
                </div>
              )}
            </div>
          )}

          {/* Newly created key (display once) */}
          {createdKey && (
            <div className="border border-[var(--color-term-fg)] bg-[var(--color-term-dim)] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
                <span className="text-[10px] font-bold text-[var(--color-term-fg)] font-mono uppercase tracking-wider">
                  KEY CREATED — COPY NOW (WONT SHOW AGAIN)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-term-fg)] break-all">
                  {createdKey.full_key}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(createdKey.full_key);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-[9px] text-[var(--color-term-warning)] font-mono">
                [!] RATE LIMIT: {createdKey.rate_limit_per_hour} REQ/HR
              </div>
            </div>
          )}

          {/* Existing keys list */}
          {keysLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 border border-[var(--color-term-border)] bg-[var(--color-term-dim)] animate-pulse" />
              ))}
            </div>
          ) : apiKeys.length === 0 && !showCreateForm && !createdKey ? (
            <div className="text-center py-4 text-[10px] text-[var(--color-term-muted)] font-mono">
              NO API KEYS. CLICK [ NEW KEY ] TO GENERATE ONE WITH RATE LIMITING.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-term-border)]">
              {apiKeys.map((key) => {
                const used = usageStats[key.id] || 0;
                const pct = usagePercent(key.id, key.rate_limit_per_hour);
                return (
                  <div key={key.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Key className="h-3.5 w-3.5 text-[var(--color-term-muted)] shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-[var(--color-term-fg)] font-bold uppercase truncate">
                              {key.name}
                            </span>
                            <Badge
                              variant="default"
                              className={`text-[8px] px-1 ${key.is_active ? "" : "opacity-40"}`}
                            >
                              [{key.is_active ? "ACTIVE" : "REVOKED"}]
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-[var(--color-term-muted)] font-mono">
                            <span>{key.key_prefix}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Gauge className="h-2.5 w-2.5" />
                              {used}/{key.rate_limit_per_hour} USED
                            </span>
                            {key.last_used_at && (
                              <>
                                <span>·</span>
                                <span>LAST: {new Date(key.last_used_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Select
                          value={String(key.rate_limit_per_hour)}
                          onValueChange={(val) => handleUpdateRateLimit(key.id, parseInt(val))}
                        >
                          <SelectTrigger className="w-20 h-6 text-[9px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10/HR</SelectItem>
                            <SelectItem value="50">50/HR</SelectItem>
                            <SelectItem value="100">100/HR</SelectItem>
                            <SelectItem value="500">500/HR</SelectItem>
                            <SelectItem value="1000">1K/HR</SelectItem>
                            <SelectItem value="5000">5K/HR</SelectItem>
                            <SelectItem value="10000">10K/HR</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-[var(--color-term-muted)] hover:text-[var(--color-term-error)]"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {/* Usage bar */}
                    <div className="mt-1.5 ml-5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--color-term-dim)]">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              pct >= 90
                                ? "var(--color-term-error)"
                                : pct >= 70
                                ? "var(--color-term-warning)"
                                : "var(--color-term-fg)",
                          }}
                        />
                      </div>
                      <span className="text-[8px] font-mono text-[var(--color-term-muted)]">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Live Risk Score Lookup ── */}
      <Card>
        <CardHeader>
          <CardTitle>{" >"} RISK_SCORE_LOOKUP</CardTitle>
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

          {error && (
            <div className="p-2.5 border border-[var(--color-term-error)] text-xs text-[var(--color-term-error)] font-mono">
              [!] {error}
            </div>
          )}

          {riskResult && !error && (
            <div className="space-y-4">
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

              <Card>
                <CardHeader>
                  <CardTitle>{" >"} FINDINGS_BREAKDOWN</CardTitle>
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

              {historyResult.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{" >"} SCORE_HISTORY</CardTitle>
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

      {/* ── API Endpoints + cURL Snippets ── */}
      <Card>
        <CardHeader>
          <CardTitle>{" >"} API_ENDPOINTS</CardTitle>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[9px] gap-1 shrink-0 ${
                    copiedEndpoint === endpoint.path
                      ? "text-[var(--color-term-fg)] border border-[var(--color-term-fg)]"
                      : "text-[var(--color-term-muted)]"
                  }`}
                  onClick={() => handleCopyCurl(endpoint)}
                >
                  <Terminal className="h-3 w-3" />
                  {copiedEndpoint === endpoint.path ? "[ COPIED ]" : "[ CURL ]"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
