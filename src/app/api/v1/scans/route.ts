import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { analyzeContract, saveScan, listAllScans, Scan } from "@/lib/server-scanner";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "20", 10);

  const all = listAllScans();
  const offset = (page - 1) * pageSize;
  const items = all.slice(offset, offset + pageSize);

  return NextResponse.json({
    items,
    total: all.length,
    page,
    page_size: pageSize,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_source, chain = "ethereum", contract_name } = body;

    if (!contract_source || typeof contract_source !== "string") {
      return NextResponse.json(
        { detail: "contract_source is required" },
        { status: 400 }
      );
    }

    const { findings, risk_score, contract_name: inferredName } = analyzeContract(
      contract_source,
      chain
    );

    const newScan: Scan = {
      id: crypto.randomUUID(),
      org_id: null,
      user_id: null,
      contract_source,
      chain,
      status: "completed",
      risk_score_overall: risk_score,
      contract_name: contract_name || inferredName,
      error_message: null,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      findings,
    };

    saveScan(newScan);

    return NextResponse.json(newScan, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Failed to create scan" },
      { status: 500 }
    );
  }
}
