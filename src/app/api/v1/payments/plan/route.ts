import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, FREE_SCAN_LIMIT } from "@/lib/payments";
import { getUserFromRequest } from "@/lib/auth-server";

/** GET — the signed-in user's plan and scan allowance. */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  const plan = await getUserPlan(user.id);
  return NextResponse.json({
    ...plan,
    free_scan_limit: FREE_SCAN_LIMIT,
    unlimited: plan.unlimited || plan.plan_id !== "free",
  });
}
