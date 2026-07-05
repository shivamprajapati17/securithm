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

const severityStyles: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
  high: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
  medium: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
};

export default function MonitoringPage() {
  const { data: contracts, loading, error } = useMonitoredContracts();

  const criticalCount = contracts.filter(c => c.status === "critical").length;
  const warningCount = contracts.filter(c => c.status === "warning").length;
  const healthyCount = contracts.filter(c => c.status === "healthy").length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
            Real-time on-chain monitoring for deployed contracts
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Monitor Contract
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={criticalCount > 0 ? "border-red-500/30" : ""}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{criticalCount}</div>
            <div className="text-xs text-surface-500">Critical</div>
          </CardContent>
        </Card>
        <Card className={warningCount > 0 ? "border-yellow-500/30" : ""}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{warningCount}</div>
            <div className="text-xs text-surface-500">Warning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{healthyCount}</div>
            <div className="text-xs text-surface-500">Healthy</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <Card key={i}><CardContent className="p-5 h-40 animate-pulse bg-surface-100 dark:bg-surface-800 rounded-xl" /></Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-red-500">
            Failed to load contracts: {error}
          </CardContent>
        </Card>
      )}

      {/* Contracts */}
      {!loading && !error && (
        <>
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-surface-400">
                <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No contracts being monitored. Add a contract address to start.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {contracts.map((contract) => (
                <Card
                  key={contract.id}
                  className={
                    contract.status === "critical"
                      ? "border-red-500/30"
                      : contract.status === "warning"
                      ? "border-yellow-500/30"
                      : ""
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            contract.status === "healthy"
                              ? "bg-green-500"
                              : contract.status === "warning"
                              ? "bg-yellow-500"
                              : "bg-red-500 animate-pulse"
                          }`}
                        />
                        <h3 className="font-semibold text-sm">{contract.label || "Unnamed"}</h3>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {contract.chain}
                      </Badge>
                    </div>

                    <p className="font-mono text-xs text-surface-400 truncate mb-3">
                      {contract.contract_address.slice(0, 14)}...{contract.contract_address.slice(-6)}
                    </p>

                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-surface-500">Status</span>
                      <span className={`text-xs font-medium capitalize ${
                        contract.status === "healthy" ? "text-green-500" :
                        contract.status === "warning" ? "text-yellow-500" : "text-red-500"
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                    {contract.last_checked && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-surface-500">Last Checked</span>
                        <span className="text-xs">{formatRelativeTime(contract.last_checked)}</span>
                      </div>
                    )}

                    <Button variant="ghost" size="sm" className="w-full mt-3 gap-1 text-xs">
                      View Details
                      <ArrowUpRight className="h-3 w-3" />
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
                <CardTitle className="text-base">Activity Feed</CardTitle>
                <Button variant="ghost" size="sm">Configure Alerts</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contracts.slice(0, 5).map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                        <Radio className="h-4 w-4 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{contract.label || "Unnamed"}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            contract.status === "healthy"
                              ? "bg-green-500/10 text-green-600"
                              : contract.status === "warning"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-red-500/10 text-red-600 animate-pulse"
                          }`}>
                            {contract.status}
                          </span>
                        </div>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">
                          {contract.status === "healthy"
                            ? "No anomalies detected"
                            : contract.status === "warning"
                            ? "Unusual activity detected"
                            : "Critical: Immediate attention required"}
                        </p>
                        <span className="text-xs text-surface-400 mt-1 block">
                          {contract.last_checked ? formatRelativeTime(contract.last_checked) : "Just added"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
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
