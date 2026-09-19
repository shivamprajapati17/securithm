import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 400 }
      );
    }

    // Generate JWT token
    const secret = process.env.SECRET_KEY || "87954f558f6abfc64ff21cbe420cd0be";
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: email,
        email,
        name: email.split("@")[0],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      })
    ).toString("base64url");

    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");

    const token = `${header}.${payload}.${signature}`;

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user_id: email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Login failed" },
      { status: 500 }
    );
  }
}
