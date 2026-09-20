import { NextRequest, NextResponse } from "next/server";
import { getSolvencyProfile, upsertSolvencyProfile } from "@/lib/solvency-store";
import { getUserFromRequest } from "@/lib/auth-server";

async function orgId(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const id = await orgId(request);
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  const profile = getSolvencyProfile(id);
  if (!profile) return NextResponse.json({ detail: "No solvency profile yet" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function POST(request: NextRequest) {
  const id = await orgId(request);
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.display_name) {
      return NextResponse.json({ detail: "display_name is required" }, { status: 400 });
    }
    return NextResponse.json(upsertSolvencyProfile(id, body), { status: 201 });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Failed to create profile";
    return NextResponse.json({ detail }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const id = await orgId(request);
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  const body = await request.json();
  return NextResponse.json(upsertSolvencyProfile(id, body));
}
