import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface KeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  rate_limit_per_hour: number;
}

const keysStore: KeyRecord[] = [
  {
    id: "k1",
    name: "Default Production Key",
    key_prefix: "sk_live_sec",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    last_used_at: new Date().toISOString(),
    expires_at: null,
    is_active: true,
    rate_limit_per_hour: 500,
  },
];

export async function GET() {
  return NextResponse.json(keysStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name = "New API Key", rate_limit_per_hour = 500 } = body;

    const rawSecret = `sk_live_${crypto.randomBytes(24).toString("hex")}`;
    const newKey: KeyRecord = {
      id: crypto.randomUUID(),
      name,
      key_prefix: rawSecret.substring(0, 12),
      created_at: new Date().toISOString(),
      last_used_at: null,
      expires_at: null,
      is_active: true,
      rate_limit_per_hour,
    };

    keysStore.push(newKey);

    return NextResponse.json(
      {
        ...newKey,
        full_key: rawSecret,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Failed to create API key" },
      { status: 500 }
    );
  }
}
