import { NextRequest, NextResponse } from "next/server";
import { createApiKey, listApiKeys, type ApiKeyRecord } from "@/lib/server-scanner";
import { getUserFromRequest } from "@/lib/auth-server";

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
