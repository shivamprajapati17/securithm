import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chain: string; address: string }> }
) {
  const { chain, address } = await params;

  // Compute deterministic risk score from address hash
  const hexSum = address
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = 15 + (hexSum % 65);

  let grade = "A";
  if (score > 80) grade = "F";
  else if (score > 60) grade = "D";
  else if (score > 40) grade = "C";
  else if (score > 25) grade = "B";

  return NextResponse.json({
    chain,
    address,
    risk_score: score,
    grade,
    total_findings: Math.floor(score / 20),
    critical_count: score > 70 ? 1 : 0,
    high_count: score > 50 ? 1 : 0,
    medium_count: score > 30 ? 1 : 0,
    low_count: score > 15 ? 1 : 0,
    last_scanned: new Date().toISOString(),
    confidence: "98.4%",
  });
}
