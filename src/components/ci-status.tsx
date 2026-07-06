"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type WorkflowStatus = "success" | "failure" | "pending" | "unknown";

const REPO_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "shivamprajapati17";
const REPO_NAME = process.env.NEXT_PUBLIC_GITHUB_REPO || "securithm";

const workflows = [
  {
    label: "frontend_ci",
    filename: "ci.yml",
  },
  {
    label: "backend_ci",
    filename: "backend.yml",
  },
];

function WorkflowRow({
  label,
  filename,
}: {
  label: string;
  filename: string;
}) {
  const [status, setStatus] = useState<WorkflowStatus>("unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${filename}/runs?per_page=1`
        );
        if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        if (!data.workflow_runs || data.workflow_runs.length === 0) {
          setStatus("unknown");
        } else {
          const latest = data.workflow_runs[0];
          if (latest.conclusion === "success") setStatus("success");
          else if (latest.conclusion === "failure") setStatus("failure");
          else setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("unknown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 300_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [filename]);

  const statusIndicator =
    status === "success"
      ? "text-[var(--color-term-fg)]"
      : status === "failure"
      ? "text-[var(--color-term-error)]"
      : status === "pending"
      ? "text-[var(--color-term-warning)]"
      : "text-[var(--color-term-muted)]";

  return (
    <a
      href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 px-2 py-1 text-xs font-mono transition-colors",
        "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)]"
      )}
    >
      <span className={cn("shrink-0", loading ? "animate-blink" : statusIndicator)}>
        {loading ? "?" : status === "success" ? ">" : status === "failure" ? "!" : status === "pending" ? "~" : "-"}
      </span>
      <span className="truncate uppercase tracking-wider">{label}</span>
      <span className={cn("ml-auto text-[9px]", statusIndicator)}>
        [{status === "success" ? "OK" : status === "failure" ? "ERR" : status === "pending" ? "..." : "?"}]
      </span>
    </a>
  );
}

export function CiStatusIndicator({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;

  return (
    <div className="border-t border-[var(--color-term-border)] px-2 py-1.5">
      <div className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider px-2 pb-1">
        $ ci_status
      </div>
      <div className="space-y-0">
        {workflows.map((wf) => (
          <WorkflowRow key={wf.filename} {...wf} />
        ))}
      </div>
    </div>
  );
}
