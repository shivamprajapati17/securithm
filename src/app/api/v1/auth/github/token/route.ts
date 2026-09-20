import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { saveGithubConnection } from "@/lib/github";

/**
 * POST { token } — validate a GitHub personal access token with GitHub and
 * store the connection for the signed-in user. The token is never returned
 * after save; the status route exposes only the login.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const token = String(body?.token ?? "").trim();
    if (!token) {
      return NextResponse.json({ detail: "A GitHub personal access token is required." }, { status: 400 });
    }
    if (token.length < 20) {
      return NextResponse.json({ detail: "That token looks too short to be valid." }, { status: 400 });
    }
    const { login } = await saveGithubConnection(user.id, token);
    return NextResponse.json({ ok: true, connected: true, login });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "GitHub connection failed";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
