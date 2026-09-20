/**
 * Server-side scan store for the Securithm website.
 *
 * - Analysis runs on the shared Securithm agent engine (npm package `securithm`)
 *   so the website, the SDK and the CLI all produce identical findings/fixes.
 * - Scans persist to Supabase (service-role key) when configured; every store
 *   call falls back to an in-memory map so local dev and fresh deploys keep
 *   working before the Supabase schema is applied.
 */

import crypto from "crypto";
import {
  analyzeAndFix,
  buildFixedSource,
  runAgents,
  fixedSourceForFinding,
  buildUnifiedPatch,
  extractContractName,
  type AgentFinding,
} from "@/lib/engine";

export { analyzeAndFix, buildFixedSource, runAgents, fixedSourceForFinding, buildUnifiedPatch, extractContractName };
export type { AgentFinding };

// ─── Types (website API shape) ───────────────────────────────────────────────

export interface Finding {
  id: string;
  scan_id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "informational";
  severity_order: number;
  line_number: number | null;
  code_snippet: string | null;
  description: string;
  suggested_fix: string | null;
  fixed_code: string | null;
  agent?: string | null;
  rule_key?: string | null;
  fixable?: boolean;
  assigned_to: string | null;
  status: "open" | "in_progress" | "resolved" | "wont_fix";
  remediation_sla: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  org_id: string | null;
  user_id: string | null;
  origin?: string | null;
  contract_source: string | null;
  chain: string | null;
  status: "pending" | "running" | "completed" | "failed";
  risk_score_overall: string | null;
  contract_name: string | null;
  error_message: string | null;
  fixed_code: string | null;
  fixes_applied: number;
  fixes_manual: number;
  full_patch: string | null;
  created_at: string;
  completed_at: string | null;
  findings: Finding[];
}

export interface MonitoredContract {
  id: string;
  org_id: string;
  contract_address: string;
  chain: string;
  label: string | null;
  status: "healthy" | "warning" | "critical";
  created_at: string;
  last_checked: string | null;
}

export interface MonitoringEvent {
  id: string;
  monitored_contract_id: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  tx_hash: string | null;
  timestamp: string;
}

export interface ApiKeyRecord {
  id: string;
  user_id: string | null;
  name: string;
  key_prefix: string;
  full_key: string | null;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  rate_limit_per_hour: number;
}

// ─── Supabase admin client (optional) ────────────────────────────────────────

let supabaseAdmin: ReturnType<typeof import("@supabase/supabase-js").createClient> | null | undefined;

function getSupabaseAdmin() {
  if (supabaseAdmin !== undefined) return supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    supabaseAdmin = null;
    return null;
  }
  try {
    // Lazy import keeps the build happy when supabase-js is absent.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
    supabaseAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });
  } catch {
    supabaseAdmin = null;
  }
  return supabaseAdmin;
}

async function sbInsertScans(scans: Scan[]): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    const rows = scans.map(({ findings, ...s }) => ({
      ...s,
      fixes_applied: s.fixes_applied ?? 0,
      fixes_manual: s.fixes_manual ?? 0,
    }));
    const { error } = await (sb.from("scans") as { upsert: (r: unknown) => PromiseLike<{ error: unknown }> }).upsert(rows);
    if (error) throw error;
    const findingRows = scans.flatMap((s) => s.findings ?? []);
    if (findingRows.length) {
      const { error: fErr } = await (sb.from("findings") as { upsert: (r: unknown) => PromiseLike<{ error: unknown }> }).upsert(findingRows);
      if (fErr) throw fErr;
    }
  } catch {
    // Table missing (42P01) or transient error — memory remains source of truth.
  }
}

async function sbSelectScans(filter?: { user_id?: string; id?: string }): Promise<Scan[] | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    let query = (sb.from("scans") as unknown as {
      select: (s: string) => { order: (c: string, o: object) => any };
    }).select("*, findings(*)").order("created_at", { ascending: false }) as {
      eq: (c: string, v: unknown) => any;
    };
    if (filter?.user_id) query = query.eq("user_id", filter.user_id);
    if (filter?.id) query = query.eq("id", filter.id);
    const { data, error } = (await query) as unknown as { data: unknown[] | null; error: unknown };
    if (error) throw error;
    return (data ?? []) as unknown as Scan[];
  } catch {
    return null;
  }
}

async function sbDeleteScan(id: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    await (sb.from("scans") as unknown as { delete: () => { eq: (c: string, v: unknown) => PromiseLike<unknown> } }).delete().eq("id", id);
  } catch {
    /* ignore */
  }
}

async function sbUpsertApiKeys(keys: ApiKeyRecord[]): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    await (sb.from("api_keys") as { upsert: (r: unknown) => PromiseLike<{ error: unknown }> }).upsert(keys);
  } catch {
    /* ignore */
  }
}

async function sbSelectApiKeys(filter?: { user_id?: string; full_key?: string }): Promise<ApiKeyRecord[] | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    let query = (sb.from("api_keys") as unknown as {
      select: (s: string) => { eq: (c: string, v: unknown) => any };
    }).select("*") as { eq: (c: string, v: unknown) => any };
    if (filter?.user_id) query = query.eq("user_id", filter.user_id);
    if (filter?.full_key) query = query.eq("full_key", filter.full_key);
    const { data, error } = (await query) as unknown as { data: unknown[] | null; error: unknown };
    if (error) throw error;
    return (data ?? []) as unknown as ApiKeyRecord[];
  } catch {
    return null;
  }
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export interface AnalyzeResult {
  findings: Omit<Finding, "id" | "scan_id" | "status" | "assigned_to" | "resolved_at" | "remediation_sla" | "created_at">[];
  risk_score: string;
  contract_name: string;
  fixed_code: string;
  fixes_applied: number;
  fixes_manual: number;
  full_patch: string;
}

/** Run the trained agent engine on Solidity source. */
export function analyzeContract(
  source: string,
  _chain = "ethereum"
): AnalyzeResult {
  const result = analyzeAndFix(source);
  return {
    findings: result.findings.map((f) => ({
      category: f.category,
      severity: f.severity,
      severity_order: f.severity_order,
      line_number: f.line_number,
      code_snippet: f.code_snippet,
      description: f.description,
      suggested_fix: f.suggested_fix,
      fixed_code: null,
      agent: f.agent,
      rule_key: f.rule_key,
      fixable: f.fixable,
    })),
    risk_score: result.risk_score,
    contract_name: result.contract_name,
    fixed_code: result.fixed_code,
    fixes_applied: result.fixes_applied,
    fixes_manual: result.fixes_manual,
    full_patch: result.full_patch,
  };
}

// ─── Scan store (memory primary + Supabase best-effort) ─────────────────────

// In-memory store across warm requests
const globalScans = globalThis as unknown as {
  __securithm_scans?: Map<string, Scan>;
  __securithm_monitored?: Map<string, MonitoredContract>;
  __securithm_events?: Map<string, MonitoringEvent[]>;
  __securithm_api_keys?: Map<string, ApiKeyRecord>;
  __securithm_seeded?: boolean;
  __securithm_invites?: Map<string, TeamInvite>;
};

function scansMap(): Map<string, Scan> {
  globalScans.__securithm_scans ??= new Map();
  return globalScans.__securithm_scans;
}
function monitoredMap(): Map<string, MonitoredContract> {
  globalScans.__securithm_monitored ??= new Map();
  return globalScans.__securithm_monitored;
}
function eventsMap(): Map<string, MonitoringEvent[]> {
  globalScans.__securithm_events ??= new Map();
  return globalScans.__securithm_events;
}
function apiKeysMap(): Map<string, ApiKeyRecord> {
  globalScans.__securithm_api_keys ??= new Map();
  return globalScans.__securithm_api_keys;
}

function ensureSeedData() {
  if (globalScans.__securithm_seeded) return;
  globalScans.__securithm_seeded = true;
  if (monitoredMap().size === 0) {
    const seeds: Array<Omit<MonitoredContract, "id" | "created_at" | "last_checked">> = [
      {
        org_id: "demo",
        contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        chain: "ethereum",
        label: "USDC Token (sample watch)",
        status: "healthy",
      },
      {
        org_id: "demo",
        contract_address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        chain: "ethereum",
        label: "UNI Token (sample watch)",
        status: "healthy",
      },
    ];
    for (const seed of seeds) addMonitored(seed);
  }
}

export function saveScan(scan: Scan): Scan {
  scansMap().set(scan.id, scan);
  void sbInsertScans([scan]);
  return scan;
}

export function getScanById(id: string): Scan | undefined {
  return scansMap().get(id);
}

export async function getScanByIdAsync(id: string): Promise<Scan | undefined> {
  const local = scansMap().get(id);
  if (local) return local;
  const rows = await sbSelectScans({ id });
  if (rows && rows.length) {
    scansMap().set(id, rows[0]);
    return rows[0];
  }
  return undefined;
}

export function listAllScans(): Scan[] {
  return Array.from(scansMap().values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function listScansForUser(userId: string | null): Promise<Scan[]> {
  if (!userId) return listAllScans().filter((s) => !s.user_id);
  const rows = await sbSelectScans({ user_id: userId });
  if (rows && rows.length) {
    for (const row of rows) scansMap().set(row.id, row);
    return rows;
  }
  return listAllScans().filter((s) => s.user_id === userId);
}

export function listAllFindings(): Finding[] {
  const all: Finding[] = [];
  for (const s of scansMap().values()) all.push(...s.findings);
  return all.sort((a, b) => a.severity_order - b.severity_order);
}

export function deleteScan(id: string): boolean {
  const existed = scansMap().delete(id);
  void sbDeleteScan(id);
  return existed;
}

// ─── Monitoring store (memory; seeded demo data) ─────────────────────────────

export function listMonitored(): MonitoredContract[] {
  ensureSeedData();
  return Array.from(monitoredMap().values());
}

export function addMonitored(
  contract: Omit<MonitoredContract, "id" | "created_at" | "last_checked">
): MonitoredContract {
  ensureSeedData();
  const id = crypto.randomUUID();
  const item: MonitoredContract = {
    ...contract,
    id,
    created_at: new Date().toISOString(),
    last_checked: new Date().toISOString(),
  };
  monitoredMap().set(id, item);
  return item;
}

export function removeMonitored(id: string): boolean {
  return monitoredMap().delete(id);
}

export function getEventsForContract(contractId: string): MonitoringEvent[] {
  ensureSeedData();
  return eventsMap().get(contractId) || [];
}

export function addMonitoringEvent(contractId: string, event: Omit<MonitoringEvent, "id" | "monitored_contract_id" | "timestamp">): MonitoringEvent {
  ensureSeedData();
  const full: MonitoringEvent = {
    ...event,
    id: crypto.randomUUID(),
    monitored_contract_id: contractId,
    timestamp: new Date().toISOString(),
  };
  const list = eventsMap().get(contractId) ?? [];
  list.unshift(full);
  eventsMap().set(contractId, list.slice(0, 100));
  return full;
}

// ─── API keys (for SDK/CLI entitlement) ──────────────────────────────────────

export function createApiKey(userId: string | null, name: string, rateLimitPerHour = 500): ApiKeyRecord {
  const rawSecret = `sk_live_${crypto.randomBytes(24).toString("hex")}`;
  const record: ApiKeyRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    key_prefix: rawSecret.substring(0, 12),
    full_key: rawSecret,
    created_at: new Date().toISOString(),
    last_used_at: null,
    expires_at: null,
    is_active: true,
    rate_limit_per_hour: rateLimitPerHour,
  };
  apiKeysMap().set(record.id, record);
  void sbUpsertApiKeys([record]);
  return record;
}

export function listApiKeys(userId: string | null): ApiKeyRecord[] {
  return Array.from(apiKeysMap().values()).filter((k) => k.user_id === userId);
}

export async function validateApiKey(key: string): Promise<ApiKeyRecord | null> {
  if (!key.startsWith("sk_live_")) return null;
  const local = Array.from(apiKeysMap().values()).find((k) => k.full_key === key && k.is_active);
  if (local) return local;
  const rows = await sbSelectApiKeys({ full_key: key });
  if (rows && rows.length) {
    const record = rows.find((k) => k.is_active) ?? null;
    if (record) {
      apiKeysMap().set(record.id, record);
      record.last_used_at = new Date().toISOString();
      void sbUpsertApiKeys([record]);
    }
    return record;
  }
  return null;
}

// ─── Team invites (memory-backed; email delivery not configured yet) ───────

export interface TeamInvite {
  id: string;
  org_id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  invited_by: string | null;
  message: string | null;
  expires_at: string;
  created_at: string;
}

function invitesMap(): Map<string, TeamInvite> {
  globalScans.__securithm_invites ??= new Map();
  return globalScans.__securithm_invites;
}

async function sbUpsertInvites(invites: TeamInvite[]): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    await (sb.from("team_invites") as { upsert: (r: unknown) => PromiseLike<{ error: unknown }> }).upsert(invites);
  } catch {
    /* ignore */
  }
}

async function sbSelectInvites(): Promise<TeamInvite[] | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = (await (sb.from("team_invites") as unknown as {
      select: (s: string) => { order: (c: string, o: object) => PromiseLike<{ data: unknown[] | null; error: unknown }> };
    }).select("*").order("created_at", { ascending: false })) as unknown as {
      data: unknown[] | null; error: unknown;
    };
    if (error) throw error;
    return (data ?? []) as unknown as TeamInvite[];
  } catch {
    return null;
  }
}

async function sbUpdateInvite(invite: TeamInvite): Promise<void> {
  await sbUpsertInvites([invite]);
}

export async function listTeamInvites(): Promise<TeamInvite[]> {
  const rows = await sbSelectInvites();
  if (rows && rows.length) {
    for (const row of rows) invitesMap().set(row.id, row);
    return rows;
  }
  return Array.from(invitesMap().values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function createTeamInvite(email: string, role: string, invitedBy: string | null, message: string | null): TeamInvite {
  const invite: TeamInvite = {
    id: crypto.randomUUID(),
    org_id: "default-org",
    email,
    role,
    status: "pending",
    invited_by: invitedBy,
    message,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  };
  invitesMap().set(invite.id, invite);
  void sbUpsertInvites([invite]);
  return invite;
}

export async function setInviteStatus(id: string, status: "accepted" | "declined"): Promise<TeamInvite | null> {
  // Pull from Supabase in case this instance never saw the invite.
  await listTeamInvites();
  const invite = invitesMap().get(id);
  if (!invite) return null;
  invite.status = status;
  void sbUpdateInvite(invite);
  return invite;
}
