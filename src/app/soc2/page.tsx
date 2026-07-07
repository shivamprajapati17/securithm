"use client";

import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, FileText, Lock, Server, Users, Clock, AlertTriangle } from "lucide-react";

const controls = [
  {
    icon: Lock,
    title: "ACCESS CONTROL",
    description: "Role-based access control (RBAC) with least privilege principle. MFA enforcement for all team accounts.",
  },
  {
    icon: Server,
    title: "DATA ENCRYPTION",
    description: "AES-256 encryption at rest, TLS 1.3 in transit. Key management with automatic rotation.",
  },
  {
    icon: Users,
    title: "INCIDENT RESPONSE",
    description: "Dedicated security team on-call 24/7. Documented incident response plan tested quarterly.",
  },
  {
    icon: Clock,
    title: "AVAILABILITY",
    description: "99.9% uptime SLA for Enterprise plan. Redundant infrastructure across multiple regions.",
  },
  {
    icon: AlertTriangle,
    title: "THREAT DETECTION",
    description: "Real-time monitoring with SIEM integration. Automated threat response playbooks.",
  },
  {
    icon: FileText,
    title: "AUDIT LOGGING",
    description: "Immutable audit trails for all system access. 1-year retention with export capability.",
  },
];

const certifications = [
  { name: "SOC 2 TYPE II", status: "IN PROGRESS", description: "Security, Availability, and Confidentiality trust principles" },
  { name: "GDPR", status: "COMPLIANT", description: "Full compliance with EU data protection requirements" },
  { name: "CCPA", status: "COMPLIANT", description: "California Consumer Privacy Act compliance" },
];

export default function Soc2Page() {
  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM COMPLIANCE
            </span>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 className="text-lg font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-2">
                  SOC 2 COMPLIANCE
                </h1>
                <p className="text-xs text-[var(--color-term-muted)] font-mono max-w-2xl">
                  Securithm maintains industry-standard security controls to protect your data.
                  We are committed to SOC 2 Type II certification and maintain GDPR and CCPA compliance.
                </p>
              </div>
              <Badge variant="default" className="text-[9px] gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                [ AUDIT IN PROGRESS ]
              </Badge>
            </div>

            {/* Certifications */}
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              {certifications.map((cert) => (
                <div key={cert.name} className="border border-[var(--color-term-border)] p-3">
                  <div className="text-[9px] text-[var(--color-term-muted)] font-mono uppercase tracking-wider mb-1">{cert.name}</div>
                  <div className={`text-[10px] font-bold font-mono ${cert.status === "COMPLIANT" ? "text-[var(--color-term-fg)]" : "text-[var(--color-term-warning)]"}`}>
                    [{cert.status}]
                  </div>
                  <p className="text-[9px] text-[var(--color-term-muted)] mt-1 font-mono">{cert.description}</p>
                </div>
              ))}
            </div>

            {/* Controls Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {controls.map((control) => (
                <div key={control.title} className="border border-[var(--color-term-border)] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center border border-[var(--color-term-border)]">
                      <control.icon className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-term-fg)] uppercase tracking-wider">
                      {control.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-term-muted)] font-mono leading-relaxed">
                    {control.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Report Download */}
            <div className="border border-[var(--color-term-border)] p-4 mt-8">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[var(--color-term-fg)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider mb-1">
                    REQUEST AUDIT REPORT
                  </h3>
                  <p className="text-[10px] text-[var(--color-term-muted)] font-mono">
                    Enterprise customers can request our latest SOC 2 Type II report, penetration
                    testing results, and security questionnaire responses. Contact
                    security@securithm.io to initiate a request.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-term-border)] pt-4 mt-6">
              <p className="text-[9px] text-[var(--color-term-muted)] font-mono">
                Last audit: Q2 2026 | Next scheduled: Q1 2027
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
