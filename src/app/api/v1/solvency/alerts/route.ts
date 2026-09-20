import { NextRequest, NextResponse } from "next/server";
import { listSolvencyAlerts } from "@/lib/solvency-store";
import { getUserFromRequest } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  return NextResponse.json(listSolvencyAlerts(user.id));
}
