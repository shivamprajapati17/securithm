import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createApiKey, listApiKeys, type ApiKeyRecord } from "@/lib/server-scanner";

/** Resolve the Supabase user from the request's bearer token (optional). */
async function getUserFromRequest(request: NextRequest): Promise<{ id: string } | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (token.startsWith("sk_live_")) return null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    const sb = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data } = await sb.auth.getUser(token);
    return data?.user ? { id: data.user.id } : null;
  } catch {
    return null;
  }
}

function publicView(key: ApiKeyRecord) {
  return {
    id: key.id,
    name: key.name,
    key_prefix: key.key_prefix,
    created_at: key.created_at,
    last_used_at: key.last_used_at,
    expires_at: key.expires_at,
    is_active: key.is_active,
    rate_limit_per_hour: key.rate_limit_per_hour,
    // Full key is returned once at creation; later views show prefix only.
    full_key: undefined,
  };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const keys = listApiKeys(user?.id ?? null).map(publicView);
  return NextResponse.json(keys);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name = "New API Key", rate_limit_per_hour = 500 } = body;
    const user = await getUserFromRequest(request);
    const record = createApiKey(user?.id ?? null, name, rate_limit_per_hour);
    // Return the full key exactly once so the user can paste it into the CLI.
    return NextResponse.json({ ...publicView(record), full_key: record.full_key }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create API key";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
