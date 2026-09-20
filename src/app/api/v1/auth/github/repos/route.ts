import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { getGithubConnection } from "@/lib/github";

/**
 * GET — GitHub connection status for the signed-in user.
 * Returns the connected login (never the token) and, when connected,
 * the user's repositories ordered by most recent push.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const conn = await getGithubConnection(user.id);
  if (!conn) {
    return NextResponse.json({
      connected: false,
      login: null,
      repos: [],
      message:
        "Connect a GitHub personal access token (classic, with the repo scope) to sync your repositories.",
    });
  }

  try {
    const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=pushed", {
      headers: {
        Authorization: `Bearer ${conn.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 },
    });
    if (res.status === 401) {
      return NextResponse.json({
        connected: true,
        login: conn.login,
        repos: [],
        message: "GitHub token was revoked — reconnect to refresh repo access.",
      });
    }
    if (!res.ok) {
      return NextResponse.json({
        connected: true,
        login: conn.login,
        repos: [],
        message: "GitHub is not responding right now — try again shortly.",
      });
    }
    const repos = (await res.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      html_url: string;
      description: string | null;
      language: string | null;
      updated_at: string;
    }>;
    return NextResponse.json({
      connected: true,
      login: conn.login,
      repos: repos.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        updated_at: r.updated_at,
      })),
    });
  } catch {
    return NextResponse.json({
      connected: true,
      login: conn.login,
      repos: [],
      message: "GitHub is not responding right now — try again shortly.",
    });
  }
}
