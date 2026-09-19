import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "Securithm",
    version: "0.1.0",
    runtime: "nextjs-edge",
  });
}
