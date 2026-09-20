import { NextRequest, NextResponse } from "next/server";
import { createLiabilitySnapshot, listLiabilitySnapshots, parseLiabilities } from "@/lib/solvency-store";
import { getUserFromRequest } from "@/lib/auth-server";

async function orgId(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const id = await orgId(request);
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  return NextResponse.json(listLiabilitySnapshots(id));
}

/** body: { entries: [{user_ref, balance}] } or { text: "user,amount\n..." } */
export async function POST(request: NextRequest) {
  const id = await orgId(request);
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  try {
    const body = await request.json();
    const entries = Array.isArray(body.entries) && body.entries.length
      ? body.entries
      : parseLiabilities(body.text ?? "");
    if (entries.length === 0) {
      return NextResponse.json({ detail: "No valid liability entries provided" }, { status: 400 });
    }
    const snap = createLiabilitySnapshot(id, entries);
    return NextResponse.json(snap, { status: 201 });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Failed to create liability snapshot";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
