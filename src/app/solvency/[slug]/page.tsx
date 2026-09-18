"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  getPublicDashboard,
  downloadAttestation,
  getAttestationOnChain,
  type PublicDashboard,
  type OnChainStatus,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Scale,
  Users,
  Wallet,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Globe,
  Fingerprint,
  Boxes,
  Database,
} from "lucide-react";

function fmtUsd(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtRatio(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (isNaN(n)) return value;
  return `${(n * 100).toFixed(1)}%`;
}

function shortAddr(addr: string): string {
  if (!addr) return "—";
  if (addr.length <= 18) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

function StatBlock({
  label,
  value,
  sub,
  glow,
}: {
  label: string;
  value: string;
  sub?: string;
  glow?: string;
}) {
  return (
    <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-4">
      <div className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`text-2xl font-bold font-mono ${
          glow || "text-[var(--color-term-fg)]"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[9px] font-mono text-[var(--color-term-muted)] mt-1">
          {sub}
        </div>
      )}
    </div>
  );
}

function EvidenceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    directly_verified: {
      label: "DIRECTLY VERIFIED",
      cls: "border-[var(--color-term-fg)] text-[var(--color-term-fg)]",
    },
    attested: {
      label: "ATTESTED",
      cls: "border-[var(--color-term-warning)] text-[var(--color-term-warning)]",
    },
    unverified: {
      label: "UNVERIFIED",
      cls: "border-[var(--color-term-muted)] text-[var(--color-term-muted)]",
    },
  };
  const v = map[status] || map.unverified;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono border uppercase tracking-wider ${v.cls}`}
    >
      {v.label}
    </span>
  );
}

export default function PublicSolvencyPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";
  const [data, setData] = useState<PublicDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onchainStatus, setOnchainStatus] = useState<OnChainStatus | null>(null);
  const [onchainBusy, setOnchainBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDownload = async (format: "json" | "pdf") => {
    if (!data?.latestAttestation) return;
    try {
      await downloadAttestation(data.latestAttestation.id, format);
      setNotice(`Attestation downloaded as ${format.toUpperCase()}`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Attestation export failed");
    }
  };

  const handleVerifyOnChain = async () => {
    if (!data?.latestAttestation) return;
    setOnchainBusy(true);
    try {
      const status = await getAttestationOnChain(data.latestAttestation.id);
      setOnchainStatus(status);
      setNotice(status.detail ?? (status.published ? "On-chain record found" : "Not published on-chain"));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "On-chain check failed");
    } finally {
      setOnchainBusy(false);
    }
  };

  const fetch = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getPublicDashboard(slug);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
        <div className="border border-[var(--color-term-border)] p-4 text-center">
          <p className="text-xs text-[var(--color-term-fg)] font-mono">
            LOADING ATTESTATION...
          </p>
          <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-2 animate-blink">
            ▌
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
        <div className="border border-[var(--color-term-error)] p-6 max-w-md w-full text-center">
          <p className="text-sm text-[var(--color-term-error)] font-mono">
            NO SOLVENCY ATTESTATION FOUND
          </p>
          <p className="text-[10px] text-[var(--color-term-muted)] font-mono mt-2">
            {error || "This organization has no public solvency data."}
          </p>
          <a
            href="/solvency"
            className="inline-block mt-4 text-[10px] font-mono uppercase tracking-wider border border-[var(--color-term-fg)] px-3 py-1.5"
          >
            back to solvency
          </a>
        </div>
      </div>
    );
  }

  const att = data.latestAttestation;
  const sol = data.solvency;
  const status = sol?.status || "UNKNOWN";

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--color-term-border)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center border border-[var(--color-term-border)]">
              <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-term-fg)] term-glow">
              AuditAI Solvency
            </span>
          </a>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                status === "SOLVENT"
                  ? "default"
                  : status === "UNDER-COLLATERALIZED"
                  ? "destructive"
                  : "secondary"
              }
            >
              {status}
            </Badge>
            <a
              href="/solvency/verify"
              className="text-[10px] font-mono uppercase tracking-wider border border-[var(--color-term-fg)] px-2.5 py-1.5 hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] transition-colors"
            >
              verify inclusion
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        {/* Org title */}
        <div>
          <div className="text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
            AUDITAI SOLVENCY — PUBLIC ATTESTATION
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-term-fg)] term-glow mt-1 uppercase">
            {data.orgName}
          </h1>
          {data.website && (
            <a
              href={data.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] mt-1"
            >
              <Globe className="h-3 w-3" />
              {data.website}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
          {data.description && (
            <p className="text-[11px] font-mono text-[var(--color-term-muted)] mt-2 max-w-3xl">
              {data.description}
            </p>
          )}
        </div>

        {!data.hasAttestation || !sol ? (
          <div className="border border-[var(--color-term-border)] p-8 text-center">
            <p className="text-xs font-mono text-[var(--color-term-muted)]">
              NO ATTESTATION PUBLISHED YET
            </p>
          </div>
        ) : (
          <>
            {/* Main screen (section 17) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatBlock
                label="Verified Reserves"
                value={fmtUsd(sol.reserveValueUsd)}
                sub={`BLOCK ${data.blockHeight || "—"}`}
                glow="text-[var(--color-term-fg)] term-glow"
              />
              <StatBlock
                label="Verified Liabilities"
                value={fmtUsd(sol.liabilityValueUsd)}
                sub={`${data.liabilityUserCount || "0"} ACCOUNTS`}
                glow="text-[var(--color-term-fg)]"
              />
              <StatBlock
                label="Coverage"
                value={fmtRatio(sol.coverageRatio)}
                sub={`REQUIRED ${fmtRatio(data.requiredCoverage)}`}
                glow={
                  status === "SOLVENT"
                    ? "text-[var(--color-term-fg)] term-glow"
                    : "text-[var(--color-term-error)] term-glow-error"
                }
              />
              <StatBlock
                label="Status"
                value={status === "SOLVENT" ? "✓ SOLVENT" : "✗ UNDER-COLLATERALIZED"}
                sub={
                  data.snapshotTimestamp
                    ? `LAST SNAPSHOT ${new Date(data.snapshotTimestamp).toLocaleDateString(
                        "en-US",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}`
                    : "NO SNAPSHOT"
                }
                glow={
                  status === "SOLVENT"
                    ? "text-[var(--color-term-fg)] term-glow"
                    : "text-[var(--color-term-error)] term-glow-error"
                }
              />
            </div>

            {/* Attestation meta */}
            {att && (
              <>
              <div className="border border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-[var(--color-term-muted)]" />
                  <span className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
                    Attestation
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-term-fg)]">
                    {att.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-[var(--color-term-muted)]" />
                  <span className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
                    Signature
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-term-fg)]">
                    {att.signature ? `${att.signature.slice(0, 12)}...` : "NONE"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-[var(--color-term-muted)]" />
                  <span className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
                    Reserve Root
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-term-fg)]">
                    {att.reserveRoot ? shortAddr(att.reserveRoot) : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-[var(--color-term-muted)]" />
                  <span className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
                    Liability Root
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-term-fg)]">
                    {data.liabilityRoot ? shortAddr(data.liabilityRoot) : "—"}
                  </span>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload("json")}
                  >
                    download json
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload("pdf")}
                  >
                    download pdf
                  </Button>
                  {onchainStatus?.published && onchainStatus.explorerUrl ? (
                    <a
                      href={onchainStatus.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-term-fg)] px-2 py-1 border border-[var(--color-term-border)]"
                    >
                      view on-chain
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleVerifyOnChain} disabled={onchainBusy}>
                      {onchainBusy ? "checking..." : "verify on-chain"}
                    </Button>
                  )}
                  <a
                    href={`/solvency/verify?snapshot=${att.id}`}
                    className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-term-fg)] hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-2 py-1 border border-[var(--color-term-fg)] transition-colors"
                  >
                    verify inclusion
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
              {onchainStatus && (
                <div className="px-4 pb-3 text-[9px] font-mono text-[var(--color-term-muted)]">
                  {onchainStatus.verified === null
                    ? `ON-CHAIN — ${onchainStatus.detail ?? "not published"}`
                    : onchainStatus.verified
                      ? "ON-CHAIN ✓ COMMITMENT MATCHES ATTESTATION"
                      : "ON-CHAIN ✗ COMMITMENT MISMATCH"}
                </div>
              )}
              {notice && (
                <div className="px-4 pb-3 text-[9px] font-mono text-[var(--color-term-fg)]">
                  {notice}
                </div>
              )}
              </>
            )}

            {/* Transparency panel (section 18) */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Reserves */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[var(--color-term-fg)]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-term-fg)]">
                    Reserves
                  </h2>
                </div>
                <div className="border border-[var(--color-term-border)] overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr>
                        <th className="px-2 py-1.5 text-left">ASSET</th>
                        <th className="px-2 py-1.5 text-right">BALANCE</th>
                        <th className="px-2 py-1.5 text-right">VALUE USD</th>
                        <th className="px-2 py-1.5 text-left">EVIDENCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reserves.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-2 py-3 text-center text-[var(--color-term-muted)]">
                            NO RESERVE ASSETS
                          </td>
                        </tr>
                      )}
                      {data.reserves.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--color-term-border)]">
                          <td className="px-2 py-1.5">
                            <div className="text-[var(--color-term-fg)] font-bold">
                              {r.symbol}
                            </div>
                            <div className="text-[8px] text-[var(--color-term-muted)]">
                              {shortAddr(r.wallet)}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-right text-[var(--color-term-fg)]">
                            {Number(r.balance).toLocaleString("en-US", {
                              maximumFractionDigits: 4,
                            })}
                          </td>
                          <td className="px-2 py-1.5 text-right text-[var(--color-term-fg)]">
                            {fmtUsd(r.valueUsd)}
                          </td>
                          <td className="px-2 py-1.5">
                            <EvidenceBadge status={r.evidenceStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Wallets */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[var(--color-term-fg)]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-term-fg)]">
                    Reserve Wallets
                  </h2>
                </div>
                <div className="border border-[var(--color-term-border)] overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr>
                        <th className="px-2 py-1.5 text-left">WALLET</th>
                        <th className="px-2 py-1.5 text-left">LABEL</th>
                        <th className="px-2 py-1.5 text-left">VERIFICATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.wallets.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-2 py-3 text-center text-[var(--color-term-muted)]">
                            NO WALLETS
                          </td>
                        </tr>
                      )}
                      {data.wallets.map((w, i) => (
                        <tr key={i} className="border-t border-[var(--color-term-border)]">
                          <td className="px-2 py-1.5 text-[var(--color-term-fg)]">
                            {shortAddr(w.address)}
                          </td>
                          <td className="px-2 py-1.5 text-[var(--color-term-muted)]">
                            {w.label || "—"}
                          </td>
                          <td className="px-2 py-1.5">
                            <EvidenceBadge status={w.verificationStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Methodology / liabilities / valuation */}
            <section className="grid lg:grid-cols-3 gap-3">
              <div className="border border-[var(--color-term-border)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-term-fg)]">
                    Liabilities
                  </h3>
                </div>
                <dl className="space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">TOTAL</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      {fmtUsd(data.liabilityTotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">ACCOUNTS</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      {data.liabilityUserCount || "0"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">TREE</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      MERKLE SUM TREE
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">ROOT</dt>
                    <dd className="text-[var(--color-term-fg)] max-w-[140px] truncate">
                      {data.liabilityRoot || "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border border-[var(--color-term-border)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-term-fg)]">
                    Valuation
                  </h3>
                </div>
                <dl className="space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">CURRENCY</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      {data.currency}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">PRICE SOURCES</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      {data.priceSources.length
                        ? data.priceSources.join(" + ")
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">THRESHOLDS</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      REQ {fmtRatio(data.requiredCoverage)} · TGT{" "}
                      {fmtRatio(data.targetCoverage)} · STR{" "}
                      {fmtRatio(data.strongCoverage)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border border-[var(--color-term-border)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-term-fg)]">
                    Methodology
                  </h3>
                </div>
                <dl className="space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">VERSION</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      {data.methodologyVersion}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">SNAPSHOT</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      {data.snapshotTimestamp
                        ? new Date(data.snapshotTimestamp).toLocaleString("en-US")
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-term-muted)]">FORMULA</dt>
                    <dd className="text-[var(--color-term-fg)]">
                      RESERVES / LIABILITIES
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Critical design rule disclaimer */}
            <div className="border border-dashed border-[var(--color-term-muted)] px-4 py-3">
              <p className="text-[9px] font-mono text-[var(--color-term-muted)] leading-relaxed">
                ⚠ AUDITAI VERIFIES A DEFINED SET OF RESERVES AND LIABILITIES
                UNDER THE PUBLISHED METHODOLOGY AND CALCULATES THE RESULTING
                COVERAGE RATIO. THIS DOES NOT CONSTITUTE A LEGAL STATEMENT OF
                FINANCIAL SOLVENCY. PROOFS COVER CRYPTOGRAPHIC CLAIMS ONLY AND
                MAY NOT REFLECT ALL REAL-WORLD LIABILITIES OR OBLIGATIONS.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
