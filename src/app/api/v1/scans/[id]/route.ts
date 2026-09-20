import { NextRequest, NextResponse } from "next/server";
import { getScanByIdAsync } from "@/lib/server-scanner";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = await getScanByIdAsync(id);

  if (!scan) {
    return NextResponse.json({ detail: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json(scan);
}
