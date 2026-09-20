import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";

/**
 * GitHub repo connection status.
 *
 * Returns a not-connected state until the GitHub OAuth app flow is
 * configured for the site (GITHUB_CLIENT_ID + callback). The dashboard
 * renders this as the "Connect GitHub" onboarding state.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    connected: false,
    repos: [],
    message: "GitHub connection is not configured yet — paste a repo URL into Scans instead.",
  });
}
