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
  };
}

/** List the logged-in user's API keys (prefix only — full key shown once at creation). */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  return NextResponse.json(listApiKeys(user?.id ?? null).map(publicView));
}

/** Create an API key for the logged-in user. Full key returned exactly once. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name = "New API Key", rate_limit_per_hour = 500 } = body;
    const user = await getUserFromRequest(request);
    const record = createApiKey(user?.id ?? null, name, rate_limit_per_hour);
    return NextResponse.json(
      { ...publicView(record), full_key: record.full_key },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create API key";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
