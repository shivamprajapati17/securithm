import crypto from "crypto";
import { NextRequest } from "next/server";

export interface RequestUser {
  id: string;
  email?: string;
  source: "supabase" | "app";
}

/**
 * Resolve the requesting user from the Authorization header.
 *
 * Two token formats exist in this app:
 *  1. Supabase auth JWTs (sub = UUID)  — verified via supabase.auth.getUser
 *  2. App-issued HS256 JWTs (sub = email, signed with SECRET_KEY)
 *     — the native /api/v1/auth/register + /login routes issue these.
 *
 * Returns null for anonymous requests or invalid tokens.
 */
export async function getUserFromRequest(request: NextRequest): Promise<RequestUser | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  // API keys (sk_live_…) are handled separately — not identity tokens.
  if (token.startsWith("sk_live_")) return null;

  // Decode payload (no verification yet) to see which issuer we're dealing with.
  let sub = "";
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    sub = String(payload?.sub ?? "");
  } catch {
    return null;
  }

  // App-issued JWT: sub is an email address.
  if (sub.includes("@")) {
    if (!verifyAppToken(token)) return null;
    return { id: sub, email: sub, source: "app" };
  }

  // Supabase JWT: sub is a UUID — verify with Supabase.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data } = await sb.auth.getUser(token);
    return data?.user ? { id: data.user.id, email: data.user.email, source: "supabase" } : null;
  } catch {
    return null;
  }
}

/** Verify the app's own HS256 session token (native auth routes). */
function verifyAppToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [header, payload, signature] = parts;
  const secret = process.env.SECRET_KEY || "87954f558f6abfc64ff21cbe420cd0be";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  if (signature !== expected) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims.exp === "number" && Date.now() / 1000 > claims.exp) return false;
    return true;
  } catch {
    return false;
  }
}
