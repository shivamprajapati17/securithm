import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return NextResponse.json(
      { detail: "Google OAuth client ID not configured" },
      { status: 501 }
    );
  }

  const proto =
    request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "https";
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "securithm.vercel.app";
  const redirectUri = `${proto}://${host}/api/v1/auth/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state=google`;

  return NextResponse.json({ authorization_url: authUrl });
}

