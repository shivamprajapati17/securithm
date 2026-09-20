import { NextRequest, NextResponse } from "next/server";
import {
  generateReserveSnapshot,
  getSolvencyProfile,
  upsertSolvencyProfile,
} from "@/lib/solvency-store";
import { getUserFromRequest } from "@/lib/auth-server";

/**
 * POST — one-click demo: seeds a demo profile, wallets and liabilities for
 * the logged-in user (if absent), then runs the full snapshot pipeline.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  try {
    const existing = getSolvencyProfile(user.id);
    if (!existing) {
      upsertSolvencyProfile(user.id, {
        display_name: "Securithm Demo Org",
        slug: `demo-${user.id.slice(0, 8)}`,
        description: "Demo proof-of-reserves organization",
      });
    }
    const { snapshot, attestation, solvency } = generateReserveSnapshot(user.id);
    return NextResponse.json(
      {
        snapshotId: snapshot.id,
        orgSlug: attestation.org_id,
        orgName: "Securithm Demo Org",
        status: snapshot.status,
        message: "Demo pipeline complete: reserves valued, coverage computed, attestation signed",
        solvency,
        attestationId: attestation.id,
        public_url: `/solvency/${attestation.org_id}`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Demo pipeline failed";
    return NextResponse.json({ detail }, { status: 500 });
  }
}

