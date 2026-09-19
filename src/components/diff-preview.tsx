"use client";

import { useMemo } from "react";
import { collapseContext, diffLines, diffStats } from "@/lib/diff";

interface DiffPreviewProps {
  original: string;
  fixed: string;
  fixesApplied: number;
  fixesManual: number;
}

const OP_STYLE: Record<string, string> = {
  "+": "text-[var(--color-term-fg)] bg-[rgba(144,252,149,0.12)]",
  "-": "text-[var(--color-term-error)] bg-[rgba(229,72,77,0.10)]",
  " ": "text-[var(--color-term-muted)]",
};

const OP_SIGN: Record<string, string> = { "+": "+", "-": "-", " ": " " };

export function DiffPreview({
  original,
  fixed,
  fixesApplied,
  fixesManual,
}: DiffPreviewProps) {
  const rows = useMemo(
    () => collapseContext(diffLines(original, fixed), 3),
    [original, fixed]
  );
  const stats = useMemo(() => diffStats(diffLines(original, fixed)), [original, fixed]);

  return (
    <div className="border border-[var(--color-term-border)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-3 py-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-term-fg)]">
          {'>'} FIXED_CONTRACT_PREVIEW
        </span>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-[var(--color-term-fg)]">+{stats.added}</span>
          <span className="text-[var(--color-term-error)]">-{stats.removed}</span>
          <span className="text-[var(--color-term-muted)]">
            {fixesApplied} auto · {fixesManual} manual
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-auto font-mono text-[11px] leading-[1.6]">
        {rows.map((row, i) =>
          row.op === "gap" ? (
            <div
              key={`gap-${i}`}
              className="border-y border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-3 py-0.5 text-center text-[9px] uppercase tracking-wider text-[var(--color-term-muted)]"
            >
              ⋯ {row.skipped} unchanged lines
            </div>
          ) : (
            <div
              key={`ln-${i}`}
              className={`flex whitespace-pre-wrap ${OP_STYLE[row.op]}`}
            >
              <span className="w-8 shrink-0 select-none pr-2 text-right text-[9px] text-[var(--color-term-muted)]">
                {row.aLine ?? ""}
              </span>
              <span className="w-8 shrink-0 select-none pr-2 text-right text-[9px] text-[var(--color-term-muted)]">
                {row.bLine ?? ""}
              </span>
              <span className="w-4 shrink-0 select-none">{OP_SIGN[row.op]}</span>
              <span className="flex-1">{row.text.replace(/\n$/, "")}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
