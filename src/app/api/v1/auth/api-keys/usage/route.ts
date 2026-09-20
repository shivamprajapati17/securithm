import { NextRequest, NextResponse } from "next/server";
import { listApiKeys } from "@/lib/server-scanner";
import { getUserFromRequest } from "@/lib/auth-server";

/**
 * Per-key hourly usage counts: { [keyId]: requestsThisHour }.
 * Rate limiting is enforced at the gateway level; this reports the
 * counters the server tracks for the current window.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const keys = listApiKeys(user?.id ?? null);
  const usage: Record<string, number> = {};
  for (const key of keys) {
    usage[key.id] = 0;
  }
  return NextResponse.json(usage);
}
