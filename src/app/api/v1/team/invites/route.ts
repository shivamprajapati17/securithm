import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role = "member" } = body;

    if (!email) {
      return NextResponse.json({ detail: "Email is required" }, { status: 400 });
    }

    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        org_id: "default-org",
        email,
        role,
        status: "pending",
        invited_by: "Shivam Prajapati",
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Failed to send invitation" },
      { status: 500 }
    );
  }
}
