/**
 * GitHub connection store — personal access tokens persisted in Supabase.
 *
 * The dashboard's repos page accepts a classic PAT with the `repo` scope;
 * storing it per user keeps the repos list working without the OAuth app
 * being configured. The token never leaves the server after save — the
 * status route only exposes the login.
 */

import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface GithubConnection {
  user_id: string;
  login: string;
  token: string;
}

/** Fetch the stored connection for a user, or null. */
export async function getGithubConnection(userId: string): Promise<GithubConnection | null> {
  const sb = adminClient();
  if (!sb) return null;
  try {
    const { data, error } = await (sb.from("github_connections") as unknown as {
      select: (s: string) => {
        eq: (c: string, v: unknown) => PromiseLike<{
          data: Array<Record<string, unknown>> | null;
          error: unknown;
        }>;
      };
    }).select("*").eq("user_id", userId);
    if (error || !data || data.length === 0) return null;
    return {
      user_id: String(data[0].user_id),
      login: String(data[0].login),
      token: String(data[0].token),
    };
  } catch {
    return null;
  }
}

/**
 * Validate a PAT against the GitHub API and store it for the user.
 * Throws with a readable message when GitHub rejects the token.
 */
export async function saveGithubConnection(
  userId: string,
  token: string
): Promise<{ login: string }> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 401) {
    throw new Error("GitHub rejected this token — check that it is valid and has the repo scope.");
  }
  if (!res.ok) {
    throw new Error("GitHub is not responding right now — try again shortly.");
  }
  const profile = (await res.json()) as { login: string };
  const sb = adminClient();
  if (!sb) {
    throw new Error("Storage is unavailable — the token could not be saved.");
  }
  const { error } = await (sb.from("github_connections") as unknown as {
    upsert: (r: unknown) => PromiseLike<{ error: unknown }>;
  }).upsert({
    user_id: userId,
    login: profile.login,
    token,
    created_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error("The token could not be saved — try again shortly.");
  }
  return { login: profile.login };
}

/** Remove the stored connection for a user. */
export async function deleteGithubConnection(userId: string): Promise<void> {
  const sb = adminClient();
  if (!sb) return;
  try {
    await (sb.from("github_connections") as unknown as {
      delete: () => {
        eq: (c: string, v: unknown) => PromiseLike<{ error: unknown }>;
      };
    }).delete().eq("user_id", userId);
  } catch {
    /* nothing to clean up */
  }
}
