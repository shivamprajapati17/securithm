import { NextRequest, NextResponse } from "next/server";
import { addWallet, listWallets } from "@/lib/solvency-store";
import { getUserFromRequest } from "@/lib/auth-server";

async function orgId(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const id = await orgId(request);
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  return NextResponse.json(listWallets(id));
}

export async function POST(request: NextRequest) {
  const id = await orgId(request);
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.address) {
      return NextResponse.json({ detail: "address is required" }, { status: 400 });
    }
    return NextResponse.json(addWallet(id, body), { status: 201 });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Failed to add wallet";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
