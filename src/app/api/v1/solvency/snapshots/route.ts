import { NextRequest, NextResponse } from "next/server";
import { generateReserveSnapshot, listReserveSnapshots } from "@/lib/solvency-store";
import { getUserFromRequest } from "@/lib/auth-server";

/**
 * POST — run the full pipeline: value reserve wallets → build the reserve
 * snapshot → compute coverage vs the latest liability snapshot → sign the
 * attestation → raise threshold alerts.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  try {
    const { snapshot, attestation, solvency } = generateReserveSnapshot(user.id);
    return NextResponse.json(
      {
        snapshotId: snapshot.id,
        orgSlug: attestation.org_id,
        orgName: "Securithm Org",
        status: snapshot.status,
        message: "Snapshot generated and attestation signed",
        solvency,
        attestationId: attestation.id,
        public_url: `/solvency/${attestation.org_id}`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Failed to generate snapshot";
    return NextResponse.json({ detail }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  return NextResponse.json(listReserveSnapshots(user.id));
}
