import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
      const payload = JSON.parse(payloadJson);
      const userMeta = payload.user_metadata || {};
      return NextResponse.json({
        id: payload.sub || "user_default",
        email: payload.email || userMeta.email || payload.sub || "user@securithm.dev",
        display_name:
          payload.name ||
          payload.display_name ||
          userMeta.full_name ||
          userMeta.name ||
          (payload.email ? payload.email.split("@")[0] : "Securithm User"),
        avatar_url:
          payload.picture ||
          payload.avatar_url ||
          userMeta.avatar_url ||
          userMeta.picture ||
          null,
        role: payload.role || "admin",
        org_name: "Securithm Security",
        org_id: "org_default",
      });
    }
  } catch (err) {
    console.error("Token parse error:", err);
  }

  return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
}
