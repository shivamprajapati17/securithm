import { NextRequest, NextResponse } from "next/server";
import { createTeamInvite, listTeamInvites } from "@/lib/server-scanner";
import { getUserFromRequest } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  return NextResponse.json(listTeamInvites());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role = "member", message = null } = body;

    if (!email) {
      return NextResponse.json({ detail: "Email is required" }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    const invite = createTeamInvite(email, role, user?.email ?? null, message);
    return NextResponse.json(invite, { status: 201 });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Failed to create invite";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
