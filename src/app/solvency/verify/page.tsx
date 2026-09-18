"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyUserProof, getUserProof, type UserProof } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Fingerprint,
  Loader2,
} from "lucide-react";

type VerifyState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; included: boolean; detail: string }
  | { kind: "error"; message: string };

function VerifyForm() {
  const searchParams = useSearchParams();
  const [snapshotId, setSnapshotId] = useState(searchParams?.get("snapshot") || "");
  const [proofJson, setProofJson] = useState("");
  const [state, setState] = useState<VerifyState>({ kind: "idle" });

  const runVerify = async (proof: UserProof) => {
    setState({ kind: "loading" });
    try {
      const res = await verifyUserProof({
        snapshotId: proof.snapshotId,
        leafIndex: proof.leafIndex,
        balance: proof.balance,
        nonce: proof.nonce,
        commitment: proof.commitment,
        liabilityRoot: proof.liabilityRoot,
        merkleProof: proof.merkleProof,
      });
      setState({
        kind: "result",
        included: res.result === "INCLUDED",
        detail: res.detail,
      });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Verification failed",
      });
    }
  };

  const handleSubmit = async () => {
    setState({ kind: "idle" });
    try {
      let proof: UserProof;
      if (proofJson.trim()) {
        proof = JSON.parse(proofJson);
      } else if (snapshotId) {
        // Fetch proof for the demo org's sample user
        proof = await getUserProof(snapshotId, "user_001");
      } else {
        setState({
          kind: "error",
          message: "Paste a proof JSON or provide a snapshot ID",
        });
        return;
      }
      if (!proof.snapshotId || !proof.liabilityRoot || !Array.isArray(proof.merkleProof)) {
        setState({
          kind: "error",
          message: "Invalid proof payload — missing required fields",
        });
        return;
      }
      await runVerify(proof);
    } catch (e) {
      setState({
        kind: "error",
        message:
          e instanceof SyntaxError
            ? "Invalid JSON — check the proof payload format"
            : e instanceof Error
            ? e.message
            : "Verification failed",
      });
    }
  };

  const demoProof = `{
  "snapshotId": "<snapshot id>",
  "leafIndex": 0,
  "balance": "1200000",
  "nonce": "<nonce>",
  "commitment": "0x...",
  "merkleProof": ["0x...", "0x..."],
  "liabilityRoot": "0x..."
}`;

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <header className="border-b border-[var(--color-term-border)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center border border-[var(--color-term-border)]">
              <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-term-fg)] term-glow">
              AuditAI Solvency
            </span>
          </a>
          <a
            href="/solvency"
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)]"
          >
            <ArrowLeft className="h-3 w-3" />
            dashboards
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
        <div>
          <div className="text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
            INDEPENDENT VERIFICATION
          </div>
          <h1 className="text-xl font-bold text-[var(--color-term-fg)] term-glow mt-1 uppercase">
            Verify your balance is included
          </h1>
          <p className="text-[11px] font-mono text-[var(--color-term-muted)] mt-2 max-w-2xl leading-relaxed">
            Your balance is committed to a Merkle Sum Tree whose root is
            published in the organization's solvency attestation. Paste the
            proof you received from the organization to cryptographically verify
            that your balance is included — without revealing anyone else's.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-3 text-[9px] font-mono">
          {[
            { n: "01", t: "Balance", d: "leaf commitment" },
            { n: "02", t: "Merkle proof", d: "recompute the root" },
            { n: "03", t: "Published root", d: "compare against attestation" },
          ].map((s) => (
            <div key={s.n} className="border border-[var(--color-term-border)] p-3">
              <div className="text-[var(--color-term-muted)]">{s.n}</div>
              <div className="text-[var(--color-term-fg)] font-bold mt-1 uppercase">
                {s.t}
              </div>
              <div className="text-[var(--color-term-muted)] mt-0.5">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Inputs */}
        <div className="border border-[var(--color-term-border)]">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <Fingerprint className="h-3.5 w-3.5 text-[var(--color-term-fg)]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-term-fg)]">
              &gt; PROOF_PAYLOAD
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                Snapshot ID (optional if pasting full proof)
              </label>
              <div className="border border-[var(--color-term-border)] px-3">
                <Input
                  value={snapshotId}
                  onChange={(e) => setSnapshotId(e.target.value)}
                  placeholder="paste snapshot id"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider block mb-1">
                Proof JSON
              </label>
              <Textarea
                value={proofJson}
                onChange={(e) => setProofJson(e.target.value)}
                placeholder={demoProof}
                className="min-h-[180px]"
              />
            </div>
            <Button onClick={handleSubmit} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  verifying...
                </>
              ) : (
                "verify inclusion"
              )}
            </Button>
          </div>
        </div>

        {/* Result */}
        {state.kind === "result" && (
          <div
            className={`border p-6 ${
              state.included
                ? "border-[var(--color-term-fg)]"
                : "border-[var(--color-term-error)]"
            }`}
          >
            <div className="flex items-center gap-3">
              {state.included ? (
                <CheckCircle2 className="h-8 w-8 text-[var(--color-term-fg)]" />
              ) : (
                <XCircle className="h-8 w-8 text-[var(--color-term-error)]" />
              )}
              <div>
                <div
                  className={`text-lg font-bold font-mono uppercase ${
                    state.included
                      ? "text-[var(--color-term-fg)] term-glow"
                      : "text-[var(--color-term-error)] term-glow-error"
                  }`}
                >
                  {state.included ? "INCLUDED" : "INVALID"}
                </div>
                <div className="text-[10px] font-mono text-[var(--color-term-muted)] mt-1">
                  {state.detail}
                </div>
              </div>
            </div>
          </div>
        )}

        {state.kind === "error" && (
          <div className="border border-[var(--color-term-error)] p-4">
            <div className="text-xs font-mono text-[var(--color-term-error)] uppercase tracking-wider">
              ✗ ERROR
            </div>
            <div className="text-[10px] font-mono text-[var(--color-term-muted)] mt-1">
              {state.message}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SolvencyVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center">
          <p className="text-xs font-mono text-[var(--color-term-fg)] animate-blink">
            LOADING VERIFIER...
          </p>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
