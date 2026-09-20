import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAppSecret } from "@/lib/app-secret";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  const proto =
    request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "https";
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "securithm.vercel.app";
  const baseUrl = `${proto}://${host}`;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=missing_code`);
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=oauth_not_configured`);
  }

  const redirectUri = `${baseUrl}/api/v1/auth/callback`;

  try {
    // 1. Exchange code for Google tokens
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      console.error("Google token exchange error:", errText);
      return NextResponse.redirect(`${baseUrl}/auth/login?error=google_auth_exchange_failed`);
    }

    const tokens = await tokenResp.json();
    const googleAccessToken = tokens.access_token;

    // 2. Fetch Google profile
    const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!userResp.ok) {
      return NextResponse.redirect(`${baseUrl}/auth/login?error=failed_to_fetch_google_user`);
    }

    const userInfo = await userResp.json();
    const email = userInfo.email || "";
    const name = userInfo.name || email.split("@")[0] || "Securithm User";
    const picture = userInfo.picture || "";

    // 3. Create HS256 JWT
    const secret = getAppSecret();
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: email,
        email,
        name,
        picture,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      })
    ).toString("base64url");

    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");

    const token = `${header}.${payload}.${signature}`;

    return NextResponse.redirect(`${baseUrl}/auth/callback?token=${token}`);
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/auth/login?error=${encodeURIComponent(err.message || "oauth_failed")}`
    );
  }
}
