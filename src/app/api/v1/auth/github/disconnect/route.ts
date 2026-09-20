import { NextResponse } from "next/server";

/** Disconnect the user's GitHub integration (no-op until OAuth is live). */
export async function POST() {
  return NextResponse.json({ ok: true, connected: false });
}
