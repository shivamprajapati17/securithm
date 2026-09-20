-- Securithm — Supabase schema
-- Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run multiple times (idempotent).

create extension if not exists "pgcrypto";

-- ─── Scans ──────────────────────────────────────────────────────────────────
create table if not exists public.scans (
  id uuid primary key,
  org_id text,
  user_id text,
  origin text default 'web',
  contract_source text,
  chain text,
  status text default 'completed',
  risk_score_overall text,
  contract_name text,
  error_message text,
  fixed_code text,
  fixes_applied integer default 0,
  fixes_manual integer default 0,
  full_patch text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ─── Findings ───────────────────────────────────────────────────────────────
create table if not exists public.findings (
  id uuid primary key,
  scan_id uuid not null references public.scans(id) on delete cascade,
  category text,
  severity text,
  severity_order integer,
  line_number integer,
  code_snippet text,
  description text,
  suggested_fix text,
  fixed_code text,
  agent text,
  rule_key text,
  fixable boolean default false,
  assigned_to text,
  status text default 'open',
  remediation_sla text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- ─── API keys (SDK / CLI entitlement) ───────────────────────────────────────
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  name text,
  key_prefix text,
  full_key text,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  rate_limit_per_hour integer default 500
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_scans_user on public.scans(user_id);
create index if not exists idx_scans_created on public.scans(created_at desc);
create index if not exists idx_findings_scan on public.findings(scan_id);
create unique index if not exists idx_api_keys_full on public.api_keys(full_key);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- All server-side reads/writes use the service-role key (bypasses RLS).
-- These policies allow users to read their own scans through client SDKs.
alter table public.scans enable row level security;
alter table public.findings enable row level security;
alter table public.api_keys enable row level security;

drop policy if exists "users read own scans" on public.scans;
create policy "users read own scans" on public.scans
  for select using (auth.jwt() ->> 'sub' = user_id);

drop policy if exists "users read own scan findings" on public.findings;
create policy "users read own scan findings" on public.findings
  for select using (
    exists (
      select 1 from public.scans s
      where s.id = findings.scan_id and auth.jwt() ->> 'sub' = s.user_id
    )
  );

-- api_keys: no client policies (service role only).
