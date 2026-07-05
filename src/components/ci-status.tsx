"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type WorkflowStatus = "success" | "failure" | "pending" | "unknown";

// Update these with your actual GitHub repo info
const REPO_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "shivamprajapati17";
const REPO_NAME = process.env.NEXT_PUBLIC_GITHUB_REPO || "auditai";

const workflows = [
  {
    label: "Frontend CI",
    filename: "ci.yml",
  },
  {
    label: "Backend CI",
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

    // Poll every 5 minutes (GitHub unauthenticated rate limit: 60 req/hr)
    const interval = setInterval(fetchStatus, 300_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [filename]);

  const colorDot =
    status === "success"
      ? "bg-green-500"
      : status === "failure"
      ? "bg-red-500"
      : status === "pending"
      ? "bg-yellow-500"
      : "bg-surface-400";

  return (
    <a
      href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors",
        "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200",
        "hover:bg-surface-100 dark:hover:bg-surface-800"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          loading ? "bg-surface-300 animate-pulse" : colorDot
        )}
      />
      <span className="truncate">{label}</span>
      {status === "failure" && (
        <span className="ml-auto text-[10px] font-medium text-red-500">
          FAIL
        </span>
      )}
      {status === "success" && (
        <span className="ml-auto text-[10px] font-medium text-green-500">
          PASS
        </span>
      )}
    </a>
  );
}

export function CiStatusIndicator({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return null;
  }

  return (
    <div className="border-t border-surface-200 dark:border-surface-800 px-2 py-2">
      <div className="text-[10px] font-medium text-surface-400 uppercase tracking-wider px-3 pb-1">
        CI Status
      </div>
      <div className="space-y-0.5">
        {workflows.map((wf) => (
          <WorkflowRow key={wf.filename} {...wf} />
        ))}
      </div>
    </div>
  );
}
