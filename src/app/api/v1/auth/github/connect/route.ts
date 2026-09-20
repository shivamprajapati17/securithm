import { NextRequest, NextResponse } from "next/server";

/**
 * Start the GitHub OAuth connection flow.
 * 501 until GITHUB_CLIENT_ID/SECRET are configured with the production
 * callback URL — the dashboard surfaces this as an inline message.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { detail: "GitHub integration is not configured yet." },
      { status: 501 }
    );
  }
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/v1/auth/callback`,
    scope: "repo read:user",
    state: Math.random().toString(36).slice(2),
  });
  return NextResponse.json({
    authorization_url: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
}
