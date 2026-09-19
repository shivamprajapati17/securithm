import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "u1",
      email: "shivam@securithm.dev",
      display_name: "Shivam Prajapati",
      avatar_url: null,
      role: "admin",
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      last_login: new Date().toISOString(),
    },
    {
      id: "u2",
      email: "security-auditor@securithm.dev",
      display_name: "Security Lead",
      avatar_url: null,
      role: "member",
      created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
      last_login: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ]);
}
