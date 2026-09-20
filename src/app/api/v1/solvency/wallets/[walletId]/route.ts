import { NextRequest, NextResponse } from "next/server";
import { deleteWallet } from "@/lib/solvency-store";
import { getUserFromRequest } from "@/lib/auth-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ walletId: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  const { walletId } = await params;
  const removed = deleteWallet(user.id, walletId);
  if (!removed) return NextResponse.json({ detail: "Wallet not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
