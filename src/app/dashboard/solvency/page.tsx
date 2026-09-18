"use client";

import { useEffect, useState, useCallback } from "react";
import {
  createSolvencyProfile,
  getSolvencyProfile,
  updateSolvencyProfile,
  addReserveWallet,
  listReserveWallets,
  deleteReserveWallet,
  getWalletChallenge,
  verifyWalletSignature,
  attestReserveWallet,
  createLiabilitySnapshot,
  listLiabilitySnapshots,
  generateSolvencySnapshot,
  listReserveSnapshots,
  listSolvencyAlerts,
  downloadAttestation,
  publishAttestationOnChain,
  getAttestationOnChain,
  type SolvencyOrg,
  type ReserveWallet,
  type LiabilitySnapshot,
  type ReserveSnapshot,
  type SolvencyAlert,
  type SnapshotCreateResponse,
  type OnChainStatus,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Users,
  Scale,
  Loader2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

function fmtUsd(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function shortAddr(a: string): string {
  if (!a) return "—";
  return a.length <= 18 ? a : `${a.slice(0, 10)}...${a.slice(-6)}`;
}

const SAMPLE_LIABILITIES = `user_001,1200000
user_002,4500000
user_003,850000
user_004,2300000
user_005,15000000
user_006,300000`;

export default function DashboardSolvencyPage() {
  const [profile, setProfile] = useState<SolvencyOrg | null>(null);
  const [wallets, setWallets] = useState<ReserveWallet[]>([]);
  const [liabilitySnaps, setLiabilitySnaps] = useState<LiabilitySnapshot[]>([]);
  const [reserveSnaps, setReserveSnaps] = useState<ReserveSnapshot[]>([]);
  const [alerts, setAlerts] = useState<SolvencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshotResult, setSnapshotResult] = useState<SnapshotCreateResponse | null>(null);
  const [onchainStatus, setOnchainStatus] = useState<OnChainStatus | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Profile form
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [requiredCoverage, setRequiredCoverage] = useState("1.00");
  const [targetCoverage, setTargetCoverage] = useState("1.10");
  const [strongCoverage, setStrongCoverage] = useState("1.20");

  // Wallet form
  const [walletAddress, setWalletAddress] = useState("");
  const [walletLabel, setWalletLabel] = useState("");
  const [declaredAssets, setDeclaredAssets] = useState("");
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [challengeWalletId, setChallengeWalletId] = useState<string | null>(null);
  const [signature, setSignature] = useState("");

  // Liabilities form
  const [liabilitiesText, setLiabilitiesText] = useState(SAMPLE_LIABILITIES);

  const loadAll = useCallback(async () => {
    try {
      const [p, w, l, r, a] = await Promise.all([
        getSolvencyProfile().catch(() => null),
        listReserveWallets().catch(() => []),
        listLiabilitySnapshots().catch(() => []),
        listReserveSnapshots().catch(() => []),
        listSolvencyAlerts().catch(() => []),
      ]);
      setProfile(p);
      setWallets(w);
      setLiabilitySnaps(l);
      setReserveSnaps(r);
      setAlerts(a);
      if (p) {
        setSlug(p.slug);
        setDisplayName(p.display_name);
        setWebsite(p.website || "");
        setRequiredCoverage(p.required_coverage);
        setTargetCoverage(p.target_coverage);
        setStrongCoverage(p.strong_coverage);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load solvency data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateProfile = async () => {
    setBusy(true);
    setError(null);
    try {
      const p = await createSolvencyProfile({
        slug,
        display_name: displayName,
        website: website || undefined,
        required_coverage: requiredCoverage,
        target_coverage: targetCoverage,
        strong_coverage: strongCoverage,
      });
      setProfile(p);
      setNotice("Solvency profile created");
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Failed to create profile");
    }
  };

  const handleUpdateProfile = async () => {
    setBusy(true);
    setError(null);
    try {
      const p = await updateSolvencyProfile({
        slug,
        display_name: displayName,
        website: website || null,
        required_coverage: requiredCoverage,
        target_coverage: targetCoverage,
        strong_coverage: strongCoverage,
      });
      setProfile(p);
      setNotice("Profile updated");
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Failed to update profile");
    }
  };

  const handleAddWallet = async () => {
    setBusy(true);
    setError(null);
    try {
      const declared: Array<{
        asset_address?: string;
        symbol: string;
        decimals: number;
        balance?: string;
      }> = declaredAssets
        .trim()
        .split("\n")
        .filter((l) => l.trim())
        .map((line) => {
          const [symbol, balance] = line.split(",").map((s) => s.trim());
          return { symbol: symbol || "ETH", decimals: 18, balance: balance || "0" };
        });
      await addReserveWallet({
        address: walletAddress,
        label: walletLabel || undefined,
        declared_assets: declared,
      });
      setWalletAddress("");
      setWalletLabel("");
      setDeclaredAssets("");
      setNotice("Wallet registered");
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Failed to add wallet");
    }
  };

  const handleChallenge = async (walletId: string) => {
    try {
      const c = await getWalletChallenge(walletId);
      setChallengeMessage(c.message);
      setChallengeWalletId(walletId);
      setSignature("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate challenge");
    }
  };

  const handleVerifySignature = async (walletId: string) => {
    setBusy(true);
    setError(null);
    try {
      if (!challengeMessage) throw new Error("No challenge");
      await verifyWalletSignature(walletId, challengeMessage, signature);
      setChallengeMessage(null);
      setChallengeWalletId(null);
      setSignature("");
      setNotice("Wallet ownership verified ✓");
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Signature verification failed");
    }
  };

  const handleAttest = async (walletId: string) => {
    setBusy(true);
    try {
      await attestReserveWallet(walletId);
      setNotice("Wallet marked as attested");
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Failed to attest wallet");
    }
  };

  const handleRemoveWallet = async (walletId: string) => {
    setBusy(true);
    try {
      await deleteReserveWallet(walletId);
      setNotice("Wallet removed");
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Failed to remove wallet");
    }
  };

  const handleImportLiabilities = async () => {
    setBusy(true);
    setError(null);
    try {
      const entries = liabilitiesText
        .trim()
        .split("\n")
        .filter((l) => l.trim())
        .map((line) => {
          const [ref, balance] = line.split(/[,\t]/).map((s) => s.trim());
          if (!ref || !balance) throw new Error("Each line needs: user_ref,balance");
          return { user_ref: ref, balance };
        });
      if (entries.length === 0) throw new Error("No liability entries");
      const snap = await createLiabilitySnapshot({ entries });
      setNotice(
        `Liability commitment created — root ${shortAddr(snap.liability_root)}`
      );
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Failed to import liabilities");
    }
  };

  const handleGenerateSnapshot = async () => {
    setBusy(true);
    setError(null);
    setSnapshotResult(null);
    setOnchainStatus(null);
    try {
      const res = await generateSolvencySnapshot();
      setSnapshotResult(res);
      setNotice("Snapshot generated and attestation signed");
      setBusy(false);
      loadAll();
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof Error ? e.message : "Snapshot generation failed"
      );
    }
  };

  const handleDownloadAttestation = async (format: "json" | "pdf") => {
    if (!snapshotResult?.attestationId) return;
    try {
      await downloadAttestation(snapshotResult.attestationId, format);
      setNotice(`Attestation exported as ${format.toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Attestation export failed");
    }
  };

  const handlePublishOnChain = async () => {
    if (!snapshotResult?.attestationId) return;
    setPublishBusy(true);
    setError(null);
    try {
      const res = await publishAttestationOnChain(snapshotResult.attestationId, {
        chain: "ethereum",
      });
      setOnchainStatus({
        published: true,
        txHash: res.txHash,
        chain: res.chain,
        contractAddress: res.contractAddress,
        explorerUrl: res.explorerUrl,
        verified: null,
        stored: null,
        detail: "Transaction submitted — pending confirmation",
      });
      setNotice(`Attestation published on-chain: ${shortAddr(res.txHash)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "On-chain publish failed");
    } finally {
      setPublishBusy(false);
    }
  };

  const handleCheckOnChain = async () => {
    if (!snapshotResult?.attestationId) return;
    try {
      const status = await getAttestationOnChain(snapshotResult.attestationId);
      setOnchainStatus(status);
      if (status.verified !== null) {
        setNotice(
          status.verified ? "On-chain commitment matches attestation" : "On-chain commitment mismatch"
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "On-chain check failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="border border-[var(--color-term-border)] p-4 text-center">
          <p className="text-xs text-[var(--color-term-fg)] font-mono">
            LOADING SOLVENCY...
          </p>
          <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-2 animate-blink">
            ▌
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow">
            PROOF OF SOLVENCY
          </h1>
          <p className="text-[10px] text-[var(--color-term-muted)] mt-1 font-mono">
            RESERVES · LIABILITIES · SOLVENCY · ATTESTATIONS
          </p>
        </div>
        {profile && (
          <a href={`/solvency/${profile.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1">
              public dashboard
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        )}
      </div>

      {error && (
        <div className="border border-[var(--color-term-error)] p-3">
          <div className="text-[10px] font-mono text-[var(--color-term-error)] uppercase tracking-wider">
            ✗ ERROR
          </div>
          <div className="text-[10px] font-mono text-[var(--color-term-muted)] mt-1">
            {error}
          </div>
        </div>
      )}
      {notice && (
        <div className="border border-[var(--color-term-fg)] p-3 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
          <div className="text-[10px] font-mono text-[var(--color-term-fg)] uppercase tracking-wider">
            {notice}
          </div>
        </div>
      )}

      {/* Signature verification panel */}
      {challengeMessage && (
        <Card className="border-[var(--color-term-warning)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-term-warning)]">
              {">"} SIGN_CHALLENGE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="text-[10px] whitespace-pre-wrap">{challengeMessage}</pre>
            <div>
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                Signature (0x...)
              </label>
              <div className="border border-[var(--color-term-border)] px-3">
                <Input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleVerifySignature(challengeWalletId || "")} disabled={busy}>
                verify signature
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setChallengeMessage(null);
                  setChallengeWalletId(null);
                }}
              >
                cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile setup */}
      {!profile ? (
        <Card>
          <CardHeader>
            <CardTitle>{">"} SETUP_SOLVENCY_PROFILE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                  Public slug
                </label>
                <div className="border border-[var(--color-term-border)] px-3">
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-org" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                  Display name
                </label>
                <div className="border border-[var(--color-term-border)] px-3">
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="My Custody" />
                </div>
              </div>
            </div>
            <Button onClick={handleCreateProfile} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              create profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{">"} SOLVENCY_PROFILE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                  Public slug
                </label>
                <div className="border border-[var(--color-term-border)] px-3">
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                  Display name
                </label>
                <div className="border border-[var(--color-term-border)] px-3">
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { l: "Required coverage", v: requiredCoverage, s: setRequiredCoverage },
                { l: "Target coverage", v: targetCoverage, s: setTargetCoverage },
                { l: "Strong coverage", v: strongCoverage, s: setStrongCoverage },
              ].map((f) => (
                <div key={f.l}>
                  <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                    {f.l}
                  </label>
                  <div className="border border-[var(--color-term-border)] px-3">
                    <Input value={f.v} onChange={(e) => f.s(e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProfile} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                save
              </Button>
              <Badge variant="default">METHODOLOGY v{profile.methodology_version}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reserve wallets */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} RESERVE_WALLETS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                Wallet address
              </label>
              <div className="border border-[var(--color-term-border)] px-3">
                <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                Label
              </label>
              <div className="border border-[var(--color-term-border)] px-3">
                <Input value={walletLabel} onChange={(e) => setWalletLabel(e.target.value)} placeholder="Treasury" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
              Declared assets (optional, one per line: SYMBOL,BALANCE) — for demo wallets
            </label>
            <Textarea
              value={declaredAssets}
              onChange={(e) => setDeclaredAssets(e.target.value)}
              placeholder={"ETH,100\nUSDC,50000"}
              className="min-h-[70px]"
            />
          </div>
          <Button onClick={handleAddWallet} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <Plus className="h-4 w-4" />
            add wallet
          </Button>

          {wallets.length === 0 ? (
            <div className="text-center py-4 text-[10px] font-mono text-[var(--color-term-muted)]">
              NO RESERVE WALLETS YET
            </div>
          ) : (
            <div className="border border-[var(--color-term-border)] overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr>
                    <th className="px-2 py-1.5 text-left">WALLET</th>
                    <th className="px-2 py-1.5 text-left">LABEL</th>
                    <th className="px-2 py-1.5 text-left">STATUS</th>
                    <th className="px-2 py-1.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id} className="border-t border-[var(--color-term-border)]">
                      <td className="px-2 py-2">
                        <div className="text-[var(--color-term-fg)]">{shortAddr(w.address)}</div>
                        <div className="text-[8px] text-[var(--color-term-muted)]">{w.chain}</div>
                      </td>
                      <td className="px-2 py-2 text-[var(--color-term-muted)]">{w.label || "—"}</td>
                      <td className="px-2 py-2">
                        <Badge
                          variant={
                            w.verification_status === "directly_verified"
                              ? "default"
                              : w.verification_status === "attested"
                              ? "high"
                              : "secondary"
                          }
                        >
                          {w.verification_status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {w.verification_status !== "directly_verified" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleChallenge(w.id)}>
                                sign
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => handleAttest(w.id)}>
                                attest
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWallet(w.id)}
                            className="text-[var(--color-term-error)]"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} LIABILITIES</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
              Liability dataset (user_ref,balance_usd per line)
            </label>
            <Textarea
              value={liabilitiesText}
              onChange={(e) => setLiabilitiesText(e.target.value)}
              className="min-h-[140px]"
            />
          </div>
          <Button onClick={handleImportLiabilities} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            commit liabilities (Merkle Sum Tree)
          </Button>

          {liabilitySnaps.length > 0 && (
            <div className="border border-[var(--color-term-border)] overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr>
                    <th className="px-2 py-1.5 text-left">ROOT</th>
                    <th className="px-2 py-1.5 text-right">TOTAL</th>
                    <th className="px-2 py-1.5 text-right">USERS</th>
                    <th className="px-2 py-1.5 text-left">CREATED</th>
                  </tr>
                </thead>
                <tbody>
                  {liabilitySnaps.slice(0, 5).map((l) => (
                    <tr key={l.id} className="border-t border-[var(--color-term-border)]">
                      <td className="px-2 py-2 text-[var(--color-term-fg)]">{shortAddr(l.liability_root)}</td>
                      <td className="px-2 py-2 text-right text-[var(--color-term-fg)]">{fmtUsd(l.total_liabilities)}</td>
                      <td className="px-2 py-2 text-right text-[var(--color-term-muted)]">{l.user_count}</td>
                      <td className="px-2 py-2 text-[var(--color-term-muted)]">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate snapshot */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} GENERATE_SNAPSHOT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[10px] font-mono text-[var(--color-term-muted)]">
            Runs the full pipeline: fetch reserve balances → value assets → build
            liability commitment → compute solvency ratio → sign attestation →
            generate monitoring alerts.
          </p>
          <Button onClick={handleGenerateSnapshot} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            run snapshot pipeline
          </Button>

          {snapshotResult && (
            <div className="border border-[var(--color-term-fg)] p-4">
              <div className="text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-2">
                LATEST SNAPSHOT — {snapshotResult.status.toUpperCase()}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-[8px] text-[var(--color-term-muted)]">RESERVES</div>
                  <div className="text-sm font-bold text-[var(--color-term-fg)]">
                    {fmtUsd(snapshotResult.solvency.reserveValueUsd)}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-[var(--color-term-muted)]">LIABILITIES</div>
                  <div className="text-sm font-bold text-[var(--color-term-fg)]">
                    {fmtUsd(snapshotResult.solvency.liabilityValueUsd)}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-[var(--color-term-muted)]">COVERAGE</div>
                  <div
                    className={cn(
                      "text-sm font-bold",
                      snapshotResult.solvency.status === "solvent"
                        ? "text-[var(--color-term-fg)] term-glow"
                        : "text-[var(--color-term-error)] term-glow-error"
                    )}
                  >
                    {Number(snapshotResult.solvency.coveragePercent).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-[var(--color-term-muted)]">STATUS</div>
                  <Badge
                    variant={
                      snapshotResult.solvency.status === "solvent"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {snapshotResult.solvency.status.replace("-", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] font-mono text-[var(--color-term-muted)]">
                <span>ATTESTATION {shortAddr(snapshotResult.attestationId)}</span>
                <a href={snapshotResult.public_url} target="_blank" className="inline-flex items-center gap-1 text-[var(--color-term-fg)]">
                  view public dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadAttestation("json")}
                  disabled={busy}
                >
                  download json
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadAttestation("pdf")}
                  disabled={busy}
                >
                  download pdf
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePublishOnChain}
                  disabled={publishBusy || busy}
                >
                  {publishBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                  publish on-chain
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCheckOnChain} disabled={busy}>
                  check on-chain
                </Button>
                {onchainStatus?.published && onchainStatus.explorerUrl && (
                  <a
                    href={onchainStatus.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[9px] font-mono text-[var(--color-term-fg)]"
                  >
                    TX {shortAddr(onchainStatus.txHash ?? "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {onchainStatus && (
                <div className="mt-2 text-[9px] font-mono text-[var(--color-term-muted)]">
                  {onchainStatus.verified === null
                    ? `ON-CHAIN — ${onchainStatus.detail ?? "not published"}`
                    : onchainStatus.verified
                      ? "ON-CHAIN ✓ COMMITMENT MATCHES ATTESTATION"
                      : "ON-CHAIN ✗ COMMITMENT MISMATCH"}
                </div>
              )}
            </div>
          )}

          {reserveSnaps.length > 0 && (
            <div className="border border-[var(--color-term-border)] overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr>
                    <th className="px-2 py-1.5 text-left">SNAPSHOT</th>
                    <th className="px-2 py-1.5 text-right">RESERVES</th>
                    <th className="px-2 py-1.5 text-left">ROOT</th>
                    <th className="px-2 py-1.5 text-left">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {reserveSnaps.slice(0, 5).map((s) => (
                    <tr key={s.id} className="border-t border-[var(--color-term-border)]">
                      <td className="px-2 py-2 text-[var(--color-term-fg)]">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right text-[var(--color-term-fg)]">
                        {fmtUsd(s.total_value_usd)}
                      </td>
                      <td className="px-2 py-2 text-[var(--color-term-muted)]">
                        {s.reserve_root ? shortAddr(s.reserve_root) : "—"}
                      </td>
                      <td className="px-2 py-2">
                        <Badge variant={s.status === "completed" ? "default" : "secondary"}>
                          {s.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>{">"} MONITORING_ALERTS</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-4 text-[10px] font-mono text-[var(--color-term-muted)]">
              NO ALERTS
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-term-border)]">
              {alerts.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2">
                  <AlertTriangle
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      a.severity === "critical" && "text-[var(--color-term-error)]",
                      a.severity === "high" && "text-[var(--color-term-warning)]",
                      a.severity === "low" && "text-[var(--color-term-fg)]"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-[var(--color-term-fg)]">
                      {a.message}
                    </div>
                    <div className="text-[8px] font-mono text-[var(--color-term-muted)] mt-0.5">
                      {a.alert_type.toUpperCase()} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    variant={
                      a.severity === "critical"
                        ? "destructive"
                        : a.severity === "high"
                        ? "high"
                        : a.severity === "medium"
                        ? "medium"
                        : "low"
                    }
                  >
                    {a.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary icons */}
      <div className="grid sm:grid-cols-3 gap-3 text-[9px] font-mono">
        <div className="border border-[var(--color-term-border)] p-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[var(--color-term-fg)]" />
          <span className="text-[var(--color-term-muted)]">
            {wallets.length} WALLETS ·{" "}
            {reserveSnaps[0]?.total_value_usd
              ? fmtUsd(reserveSnaps[0].total_value_usd)
              : "NO SNAPSHOT"}
          </span>
        </div>
        <div className="border border-[var(--color-term-border)] p-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--color-term-fg)]" />
          <span className="text-[var(--color-term-muted)]">
            {liabilitySnaps[0]?.user_count || "0"} LIABILITY ACCOUNTS COMMITTED
          </span>
        </div>
        <div className="border border-[var(--color-term-border)] p-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[var(--color-term-fg)]" />
          <span className="text-[var(--color-term-muted)]">
            {alerts.filter((a) => a.severity === "critical").length} CRITICAL
            ALERTS
          </span>
        </div>
      </div>
    </div>
  );
}
