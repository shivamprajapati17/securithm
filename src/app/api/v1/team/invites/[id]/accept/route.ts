import { NextRequest, NextResponse } from "next/server";
import { setInviteStatus } from "@/lib/server-scanner";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invite = await setInviteStatus(id, "accepted");
  if (!invite) {
    return NextResponse.json({ detail: "Invite not found" }, { status: 404 });
  }
  return NextResponse.json(invite);
}
