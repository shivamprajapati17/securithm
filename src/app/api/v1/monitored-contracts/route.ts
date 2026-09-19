import { NextRequest, NextResponse } from "next/server";
import { listMonitored, addMonitored } from "@/lib/server-scanner";

export async function GET() {
  const list = listMonitored();
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_address, chain = "ethereum", label = "Monitored Contract" } = body;

    if (!contract_address) {
      return NextResponse.json(
        { detail: "contract_address is required" },
        { status: 400 }
      );
    }

    const created = addMonitored({
      org_id: "default-org",
      contract_address,
      chain,
      label,
      status: "healthy",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Failed to add monitored contract" },
      { status: 500 }
    );
  }
}
