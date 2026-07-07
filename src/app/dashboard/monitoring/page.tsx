"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMonitoredContracts } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/utils";
import {
  Radio,
  Plus,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";


export default function MonitoringPage() {
  const { data: contracts, loading, error } = useMonitoredContracts();

  const criticalCount = contracts.filter(c => c.status === "critical").length;
  const warningCount = contracts.filter(c => c.status === "warning").length;
  const healthyCount = contracts.filter(c => c.status === "healthy").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
            MONITORING STATUS
          </h1>
          <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
            REAL-TIME ON-CHAIN MONITORING FOR DEPLOYED CONTRACTS
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          [ MONITOR ]
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={criticalCount > 0 ? "border-[var(--color-term-error)]" : ""}>
          <CardContent className="p-3 text-center">
            <div className="text-sm font-bold text-[var(--color-term-fg)]">{criticalCount}</div>
            <div className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">[CRITICAL]</div>
          </CardContent>
        </Card>
        <Card className={warningCount > 0 ? "border-[var(--color-term-warning)]" : ""}>
          <CardContent className="p-3 text-center">
            <div className="text-sm font-bold text-[var(--color-term-fg)]">{warningCount}</div>
            <div className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">[WARNING]</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-sm font-bold text-[var(--color-term-fg)]">{healthyCount}</div>
            <div className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">[HEALTHY]</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <Card key={i}><CardContent className="p-4 h-28 animate-pulse bg-[var(--color-term-dim)]" /></Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-4 text-center text-xs text-[var(--color-term-error)] font-mono">
            [!] ERROR: {error}
          </CardContent>
        </Card>
      )}

      {/* Contracts */}
      {!loading && !error && (
        <>
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-[var(--color-term-muted)] font-mono">
                <Radio className="h-6 w-6 mx-auto mb-2 text-[var(--color-term-muted)]" />
                NO CONTRACTS BEING MONITORED. CLICK MONITOR TO ADD A CONTRACT ADDRESS FOR REAL-TIME SURVEILLANCE.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              {contracts.map((contract) => (
                <Card
                  key={contract.id}
                  className={
                    contract.status === "critical"
                      ? "border-[var(--color-term-error)]"
                      : contract.status === "warning"
                      ? "border-[var(--color-term-warning)]"
                      : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 ${
                            contract.status === "healthy"
                              ? "bg-[var(--color-term-fg)]"
                              : contract.status === "warning"
                              ? "bg-[var(--color-term-warning)]"
                              : "bg-[var(--color-term-error)] animate-blink"
                          }`}
                        />
                        <h3 className="text-[11px] font-bold text-[var(--color-term-fg)] font-mono uppercase">
                          {contract.label || "UNNAMED"}
                        </h3>
                      </div>
                      <Badge variant="default" className="text-[8px] px-1">
                        [{contract.chain}]
                      </Badge>
                    </div>

                    <p className="font-mono text-[9px] text-[var(--color-term-muted)] truncate mb-2">
                      {contract.contract_address.slice(0, 14)}...{contract.contract_address.slice(-6)}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-mono mt-0.5">
                      <span className="text-[var(--color-term-muted)]">STATUS</span>
                      <span className={`font-mono uppercase tracking-wider ${
                        contract.status === "healthy" ? "text-[var(--color-term-fg)]" :
                        contract.status === "warning" ? "text-[var(--color-term-warning)]" : "text-[var(--color-term-error)]"
                      }`}>
                        [{contract.status}]
                      </span>
                    </div>
                    {contract.last_checked && (
                      <div className="flex items-center justify-between text-[9px] font-mono mt-0.5">
                        <span className="text-[var(--color-term-muted)]">LAST_CHECK</span>
                        <span className="text-[var(--color-term-muted)]">{formatRelativeTime(contract.last_checked)}</span>
                      </div>
                    )}

                    <Button variant="ghost" size="sm" className="w-full mt-2 gap-1 text-[9px] h-6">
                      DETAILS
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Activity Feed */}
          {contracts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{">"} ACTIVITY_FEED</CardTitle>
                <Button variant="ghost" size="sm" className="text-[9px]">CONFIG</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contracts.slice(0, 5).map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-start gap-2 p-2.5 border border-[var(--color-term-border)]"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--color-term-border)] text-[var(--color-term-fg)]">
                        <Radio className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[var(--color-term-fg)] font-mono uppercase">{contract.label || "UNNAMED"}</span>
                          <span className={`text-[8px] font-mono uppercase tracking-wider px-1 py-0 border ${
                            contract.status === "healthy"
                              ? "text-[var(--color-term-fg)] border-[var(--color-term-fg)]"
                              : contract.status === "warning"
                              ? "text-[var(--color-term-warning)] border-[var(--color-term-warning)]"
                              : "text-[var(--color-term-error)] border-[var(--color-term-error)]"
                          }`}>
                            [{contract.status}]
                          </span>
                        </div>
                        <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-0.5">
                          {contract.status === "healthy"
                            ? "NO ANOMALIES DETECTED"
                            : contract.status === "warning"
                            ? "UNUSUAL ACTIVITY DETECTED"
                            : "CRITICAL: IMMEDIATE ATTENTION REQUIRED"}
                        </p>
                        <span className="text-[8px] text-[var(--color-term-muted)] font-mono mt-0.5 block">
                          {contract.last_checked ? formatRelativeTime(contract.last_checked) : "JUST ADDED"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 h-6 w-6 p-0">
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
