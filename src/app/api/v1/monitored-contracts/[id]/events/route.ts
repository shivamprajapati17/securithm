import { NextRequest, NextResponse } from "next/server";
import { getEventsForContract } from "@/lib/server-scanner";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const events = getEventsForContract(id);
  return NextResponse.json(events);
}
