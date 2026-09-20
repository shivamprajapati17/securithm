import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  analyzeContract,
  saveScan,
  listScansForUser,
  validateApiKey,
  type Scan,
  type Finding,
} from "@/lib/server-scanner";
import { getUserFromRequest } from "@/lib/auth-server";
import { getUserPlan, FREE_SCAN_LIMIT } from "@/lib/payments";

const FREE_ANON_LIMIT = FREE_SCAN_LIMIT;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "20", 10);

  const user = await getUserFromRequest(request);
  const scoped = await listScansForUser(user?.id ?? null);

  const offset = (page - 1) * pageSize;
  const items = scoped.slice(offset, offset + pageSize);

  return NextResponse.json({
    items,
    total: scoped.length,
    page,
    page_size: pageSize,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_source, chain = "ethereum", contract_name } = body;

    if (!contract_source || typeof contract_source !== "string") {
      return NextResponse.json(
        { detail: "contract_source is required" },
        { status: 400 }
      );
    }

    // ── Entitlement: logged-in users unlimited; anonymous SDK/CLI requests
    // get 5 free scans per IP, then must present a valid API key. ──
    const user = await getUserFromRequest(request);
    const auth = request.headers.get("authorization") ?? "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const apiKeyHeader = request.headers.get("x-api-key") ?? (bearer?.startsWith("sk_live_") ? bearer : null);

    let apiKeyRecord: Awaited<ReturnType<typeof validateApiKey>> = null;
    if (apiKeyHeader) {
      apiKeyRecord = await validateApiKey(apiKeyHeader);
      if (apiKeyHeader && !apiKeyRecord) {
        return NextResponse.json(
          { detail: "Invalid or inactive API key. Create one at /dashboard → API Keys." },
          { status: 401 }
        );
      }
    } else if (user) {
      // Logged-in free tier — 5 scans before upgrading to Pro.
      const plan = await getUserPlan(user.id);
      if (!plan.unlimited) {
        const recent = await listScansForUser(user.id);
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const used = recent.filter((s) => new Date(s.created_at).getTime() > dayAgo).length;
        if (used >= FREE_SCAN_LIMIT) {
          return NextResponse.json(
            {
              detail: `Free plan limit reached (${FREE_SCAN_LIMIT} scans). Upgrade to Pro for unlimited scanning — activation also generates an API key for the CLI.`,
              code: "free_limit_reached",
              limit: FREE_SCAN_LIMIT,
              upgrade_url: "/pricing?paywall=limit_reached",
            },
            { status: 402 }
          );
        }
      }
    } else {
      // Anonymous scan — count per IP against the free tier.
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const bucket = freeScanBucket();
      const entry = bucket.get(ip) ?? { count: 0, reset_at: Date.now() + 24 * 60 * 60 * 1000 };
      if (Date.now() > entry.reset_at) {
        entry.count = 0;
        entry.reset_at = Date.now() + 24 * 60 * 60 * 1000;
      }
      if (entry.count >= FREE_ANON_LIMIT) {
        return NextResponse.json(
          {
            detail: `Free limit reached (${FREE_ANON_LIMIT} scans). Paste an API key in the CLI (securithm login) or sign in to continue.`,
            code: "free_limit_reached",
            limit: FREE_ANON_LIMIT,
          },
          { status: 402 }
        );
      }
      entry.count += 1;
      bucket.set(ip, entry);
    }

    const { findings, risk_score, contract_name: inferredName, fixed_code, fixes_applied, fixes_manual, full_patch } =
      analyzeContract(contract_source, chain);

    // Owner: session token wins, then the API key's owner (CLI/SDK syncs).
    const ownerId = user?.id ?? apiKeyRecord?.user_id ?? null;
    // Origin: CLI syncs tag themselves; SDK keys default to sdk.
    const origin =
      request.headers.get("x-securithm-client") ||
      (apiKeyRecord ? "sdk" : "web");

    const now = new Date().toISOString();
    const scanId = crypto.randomUUID();
    const scanFindings: Finding[] = findings.map((f) => ({
      ...f,
      id: crypto.randomUUID(),
      scan_id: scanId,
      status: "open" as const,
      assigned_to: null,
      remediation_sla: null,
      resolved_at: null,
      created_at: now,
    }));

    const newScan: Scan = {
      id: scanId,
      org_id: null,
      user_id: ownerId,
      origin,
      contract_source,
      chain,
      status: "completed",
      risk_score_overall: risk_score,
      contract_name: contract_name || inferredName,
      error_message: null,
      fixed_code,
      fixes_applied,
      fixes_manual,
      full_patch,
      created_at: now,
      completed_at: now,
      findings: scanFindings,
    };

    saveScan(newScan);

    return NextResponse.json(newScan, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create scan";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

// Per-IP anonymous usage bucket (process-local; resets on cold start —
// acceptable for the free-tier funnel since logged-in usage is unlimited).
function freeScanBucket(): Map<string, { count: number; reset_at: number }> {
  const g = globalThis as unknown as {
    __securithm_free_bucket?: Map<string, { count: number; reset_at: number }>;
  };
  g.__securithm_free_bucket ??= new Map();
  return g.__securithm_free_bucket;
}
