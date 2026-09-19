import { NextRequest, NextResponse } from "next/server";
import { listAllFindings } from "@/lib/server-scanner";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get("scan_id");
  const severity = searchParams.get("severity");

  let findings = listAllFindings();

  if (scanId) {
    findings = findings.filter((f) => f.scan_id === scanId);
  }
  if (severity) {
    findings = findings.filter((f) => f.severity === severity);
  }

  return NextResponse.json(findings);
}
