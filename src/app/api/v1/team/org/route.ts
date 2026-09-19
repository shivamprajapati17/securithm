import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "default-org",
    name: "Securithm Engineering",
    plan: {
      name: "Pro",
      max_scans_per_month: 1000,
      max_monitored_contracts: 50,
      price_usd: 49.0,
    },
    members_count: 2,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  });
}
