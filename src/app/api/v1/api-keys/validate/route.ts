import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/server-scanner";

/**
 * Validate an API key — used by the Securithm CLI (`securithm login`).
 * Returns { valid: true, plan } for active keys so the CLI can unlock
 * unlimited scanning.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!key) {
      return NextResponse.json({ valid: false, detail: "key is required" }, { status: 400 });
    }
    const record = await validateApiKey(key);
    if (!record) {
      return NextResponse.json({ valid: false });
    }
    return NextResponse.json({
      valid: true,
      name: record.name,
      rate_limit_per_hour: record.rate_limit_per_hour,
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
