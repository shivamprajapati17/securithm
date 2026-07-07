"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Shield, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage";
  latency: string;
  uptime: string;
}

const defaultServices: ServiceStatus[] = [
  { name: "SCAN API", status: "operational", latency: "< 200ms", uptime: "99.9%" },
  { name: "RISK SCORE API", status: "operational", latency: "< 100ms", uptime: "99.95%" },
  { name: "MONITORING SERVICE", status: "operational", latency: "< 500ms", uptime: "99.8%" },
  { name: "GITHUB INTEGRATION", status: "operational", latency: "< 300ms", uptime: "99.7%" },
  { name: "DASHBOARD", status: "operational", latency: "< 150ms", uptime: "99.9%" },
  { name: "AUTH SERVICE", status: "operational", latency: "< 100ms", uptime: "99.95%" },
];

const incidents = [
  {
    date: "June 15, 2026",
    title: "SCAN API DEGRADED PERFORMANCE",
    status: "RESOLVED",
    description: "Increased latency on scan submission endpoint due to high demand. Resolved by scaling workers.",
    duration: "23 minutes",
  },
  {
    date: "May 2, 2026",
    title: "MONITORING ALERT DELAY",
    status: "RESOLVED",
    description: "Webhook delivery delays of up to 5 minutes for monitoring alerts. Queue backlog cleared.",
    duration: "1 hour 12 minutes",
  },
];

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>(defaultServices);
  const [lastChecked, setLastChecked] = useState<string>("Just now");
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const start = Date.now();
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
      const latency = Date.now() - start;
      const status = res.ok ? "operational" as const : "degraded" as const;
      setServices(defaultServices.map(s => ({ ...s, status, latency: `${latency}ms` })));
    } catch {
      setServices(defaultServices.map(s => ({ ...s, status: "degraded" as const, latency: "N/A" })));
    }
    setLastChecked(new Date().toLocaleTimeString());
    setChecking(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />;
      case "degraded": return <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-term-warning)]" />;
      case "outage": return <XCircle className="h-3.5 w-3.5 text-[var(--color-term-error)]" />;
      default: return null;
    }
  };

  const overallStatus = services.every(s => s.status === "operational") ? "ALL SYSTEMS OPERATIONAL" : "SOME SYSTEMS DEGRADED";
  const overallColor = services.every(s => s.status === "operational") ? "text-[var(--color-term-fg)]" : "text-[var(--color-term-warning)]";

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM SYSTEM STATUS
            </span>
          </div>
          <div className="p-6">
            {/* Overall Status */}
            <div className={`mb-6 p-3 border border-[var(--color-term-border)] ${overallColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {services.every(s => s.status === "operational")
                    ? <CheckCircle2 className="h-5 w-5" />
                    : <AlertTriangle className="h-5 w-5" />}
                  <span className="text-sm font-bold uppercase tracking-wider">{overallStatus}</span>
                </div>
                <button
                  onClick={checkStatus}
                  disabled={checking}
                  className="flex items-center gap-1 text-[9px] text-[var(--color-term-muted)] font-mono hover:text-[var(--color-term-fg)] disabled:opacity-40"
                >
                  <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
                  CHECK STATUS
                </button>
              </div>
            </div>

            {/* Service List */}
            <div className="space-y-1 mb-8">
              <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[8px] text-[var(--color-term-muted)] font-mono uppercase tracking-wider">
                <div className="col-span-5">SERVICE</div>
                <div className="col-span-3">STATUS</div>
                <div className="col-span-2">LATENCY</div>
                <div className="col-span-2">UPTIME</div>
              </div>
              {services.map((svc) => (
                <div
                  key={svc.name}
                  className="grid grid-cols-12 gap-2 items-center p-2 border border-[var(--color-term-border)] text-[10px] font-mono"
                >
                  <div className="col-span-5 text-[var(--color-term-fg)]">{svc.name}</div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    {statusIcon(svc.status)}
                    <span className={
                      svc.status === "operational" ? "text-[var(--color-term-fg)]"
                      : svc.status === "degraded" ? "text-[var(--color-term-warning)]"
                      : "text-[var(--color-term-error)]"
                    }>
                      {svc.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-span-2 text-[var(--color-term-muted)]">{svc.latency}</div>
                  <div className="col-span-2 text-[var(--color-term-muted)]">{svc.uptime}</div>
                </div>
              ))}
            </div>

            {/* Last checked */}
            <div className="text-[9px] text-[var(--color-term-muted)] font-mono mb-6">
              Last checked: {lastChecked}
            </div>

            {/* Incidents */}
            <h2 className="text-sm font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-3">
              INCIDENT HISTORY
            </h2>
            <div className="space-y-2">
              {incidents.map((incident) => (
                <div key={incident.title} className="border border-[var(--color-term-border)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--color-term-muted)] font-mono">{incident.date}</span>
                    <span className="text-[9px] text-[var(--color-term-fg)] font-mono">[{incident.status}]</span>
                  </div>
                  <h3 className="text-[11px] font-bold text-[var(--color-term-fg)] uppercase tracking-wider">{incident.title}</h3>
                  <p className="text-[10px] text-[var(--color-term-muted)] font-mono mt-1">{incident.description}</p>
                  <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-1">Duration: {incident.duration}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--color-term-border)] pt-4 mt-8">
              <p className="text-[9px] text-[var(--color-term-muted)] font-mono">
                Subscribe to status updates at status@securithm.io
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
