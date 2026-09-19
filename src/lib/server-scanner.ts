import crypto from "crypto";

export interface Finding {
  id: string;
  scan_id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "informational";
  severity_order: number;
  line_number: number | null;
  code_snippet: string | null;
  description: string;
  suggested_fix: string | null;
  fixed_code: string | null;
  assigned_to: string | null;
  status: "open" | "in_progress" | "resolved" | "wont_fix";
  remediation_sla: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  org_id: string | null;
  user_id: string | null;
  contract_source: string | null;
  chain: string | null;
  status: "pending" | "running" | "completed" | "failed";
  risk_score_overall: string | null;
  contract_name: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  findings: Finding[];
}

export interface MonitoredContract {
  id: string;
  org_id: string;
  contract_address: string;
  chain: string;
  label: string | null;
  status: "healthy" | "warning" | "critical";
  created_at: string;
  last_checked: string | null;
}

export interface MonitoringEvent {
  id: string;
  monitored_contract_id: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  tx_hash: string | null;
  timestamp: string;
}

// In-memory global store across serverless warm requests
const globalScans: Map<string, Scan> = new Map();
const globalMonitored: Map<string, MonitoredContract> = new Map();
const globalEvents: Map<string, MonitoringEvent[]> = new Map();

// Seed initial monitored contracts if empty
function ensureSeedData() {
  if (globalMonitored.size === 0) {
    const id1 = "c1111111-1111-1111-1111-111111111111";
    globalMonitored.set(id1, {
      id: id1,
      org_id: "default-org",
      contract_address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      chain: "ethereum",
      label: "Uniswap V2 Router",
      status: "healthy",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      last_checked: new Date().toISOString(),
    });
    globalEvents.set(id1, [
      {
        id: "e1",
        monitored_contract_id: id1,
        event_type: "HEALTH_CHECK",
        severity: "low",
        title: "Liquidity and Invariant Verification Passed",
        description: "Zero anomalous outflows detected in last 24h period.",
        tx_hash: "0x89abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
        timestamp: new Date().toISOString(),
      },
    ]);
  }
}

export function analyzeContract(source: string, chain = "ethereum"): { findings: Finding[]; risk_score: string; contract_name: string; fixed_code: string } {
  const lines = source.split("\n");
  const rawFindings: Finding[] = [];
  const scanId = crypto.randomUUID();

  // Infer contract name
  const nameMatch = source.match(/contract\s+(\w+)/i);
  const contractName = nameMatch ? nameMatch[1] : "SmartContract";

  // Reentrancy rule
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (/\.call\{value|\.call\.value\(/.test(line)) {
      rawFindings.push({
        id: crypto.randomUUID(),
        scan_id: scanId,
        category: "Reentrancy · SENTINEL-01 ReentrancyAgent",
        severity: "critical",
        severity_order: 0,
        line_number: lineNum,
        code_snippet: line.trim(),
        description: "External call forwards ether to a user-controlled address. State updates after this call allow recursive reentrancy attacks.",
        suggested_fix: "Apply checks-effects-interactions pattern and wrap with nonReentrant guard modifier.",
        fixed_code: line,
        assigned_to: null,
        status: "open",
        remediation_sla: new Date(Date.now() + 7 * 86400000).toISOString(),
        resolved_at: null,
        created_at: new Date().toISOString(),
      });
    }

    if (/\btx\.origin\b/.test(line)) {
      rawFindings.push({
        id: crypto.randomUUID(),
        scan_id: scanId,
        category: "tx.origin Authentication · SENTINEL-02 AuthAgent",
        severity: "high",
        severity_order: 1,
        line_number: lineNum,
        code_snippet: line.trim(),
        description: "Authorization relies on tx.origin instead of msg.sender. Vulnerable to phishing contracts triggering calls.",
        suggested_fix: "Replace tx.origin with msg.sender for authorization checks.",
        fixed_code: line.replace(/tx\.origin/g, "msg.sender"),
        assigned_to: null,
        status: "open",
        remediation_sla: new Date(Date.now() + 7 * 86400000).toISOString(),
        resolved_at: null,
        created_at: new Date().toISOString(),
      });
    }

    if (/\bselfdestruct\s*\(|\bsuicide\s*\(/.test(line)) {
      rawFindings.push({
        id: crypto.randomUUID(),
        scan_id: scanId,
        category: "Unprotected Selfdestruct · SENTINEL-03 LifecycleAgent",
        severity: "critical",
        severity_order: 0,
        line_number: lineNum,
        code_snippet: line.trim(),
        description: "selfdestruct destroys bytecode and forwards balance. Irreversible fund loss if invoked by unauthorized callers.",
        suggested_fix: "Remove selfdestruct or place behind multi-sig governance timelock.",
        fixed_code: `// SECURITHM FIX: selfdestruct removed\n// ${line.trim()}`,
        assigned_to: null,
        status: "open",
        remediation_sla: new Date(Date.now() + 7 * 86400000).toISOString(),
        resolved_at: null,
        created_at: new Date().toISOString(),
      });
    }

    if (/\.delegatecall\s*\(/.test(line)) {
      rawFindings.push({
        id: crypto.randomUUID(),
        scan_id: scanId,
        category: "Dangerous delegatecall · SENTINEL-04 ContextAgent",
        severity: "high",
        severity_order: 1,
        line_number: lineNum,
        code_snippet: line.trim(),
        description: "delegatecall executes foreign code inside current storage context. Target contracts can overwrite owner storage slots.",
        suggested_fix: "Use call() or lock the implementation address to an immutable audited contract.",
        fixed_code: line.replace(/\.delegatecall\(/g, ".call("),
        assigned_to: null,
        status: "open",
        remediation_sla: new Date(Date.now() + 7 * 86400000).toISOString(),
        resolved_at: null,
        created_at: new Date().toISOString(),
      });
    }

    if (/function\s+\w*\s*(withdraw|mint|burn|drain|destroy|setOwner)\w*\s*\([^)]*\)\s*public(?![^{]*onlyOwner)/i.test(line)) {
      rawFindings.push({
        id: crypto.randomUUID(),
        scan_id: scanId,
        category: "Missing Access Control · SENTINEL-09 PrivilegeAgent",
        severity: "high",
        severity_order: 1,
        line_number: lineNum,
        code_snippet: line.trim(),
        description: "Privileged function is public without an onlyOwner or access control modifier.",
        suggested_fix: "Add OpenZeppelin onlyOwner modifier to restrict execution to authorized administrative accounts.",
        fixed_code: line.replace(/public\s*\{/i, "public onlyOwner {"),
        assigned_to: null,
        status: "open",
        remediation_sla: new Date(Date.now() + 7 * 86400000).toISOString(),
        resolved_at: null,
        created_at: new Date().toISOString(),
      });
    }

    if (/pragma\s+solidity\s*[\^>=]*\s*0\.[0-7]\./i.test(line)) {
      rawFindings.push({
        id: crypto.randomUUID(),
        scan_id: scanId,
        category: "Integer Overflow/Underflow · SENTINEL-10 ArithAgent",
        severity: "medium",
        severity_order: 2,
        line_number: lineNum,
        code_snippet: line.trim(),
        description: "Solidity < 0.8 uses wrapping arithmetic by default without SafeMath.",
        suggested_fix: "Upgrade pragma to ^0.8.20 to enable compiler-level checked arithmetic.",
        fixed_code: "pragma solidity ^0.8.20;",
        assigned_to: null,
        status: "open",
        remediation_sla: new Date(Date.now() + 7 * 86400000).toISOString(),
        resolved_at: null,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Calculate risk grade
  let crit = 0, high = 0, med = 0, low = 0;
  for (const f of rawFindings) {
    if (f.severity === "critical") crit++;
    else if (f.severity === "high") high++;
    else if (f.severity === "medium") med++;
    else low++;
  }

  let grade = "A";
  if (crit > 0) grade = "F";
  else if (high > 1) grade = "D";
  else if (high === 1) grade = "C";
  else if (med > 0) grade = "B";

  return {
    findings: rawFindings,
    risk_score: grade,
    contract_name: contractName,
    fixed_code: source,
  };
}

export function saveScan(scan: Scan): Scan {
  globalScans.set(scan.id, scan);
  return scan;
}

export function getScanById(id: string): Scan | undefined {
  return globalScans.get(id);
}

export function listAllScans(): Scan[] {
  return Array.from(globalScans.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function listAllFindings(): Finding[] {
  const all: Finding[] = [];
  for (const s of globalScans.values()) {
    all.push(...s.findings);
  }
  return all.sort((a, b) => a.severity_order - b.severity_order);
}

export function listMonitored(): MonitoredContract[] {
  ensureSeedData();
  return Array.from(globalMonitored.values());
}

export function addMonitored(contract: Omit<MonitoredContract, "id" | "created_at" | "last_checked">): MonitoredContract {
  ensureSeedData();
  const id = crypto.randomUUID();
  const item: MonitoredContract = {
    ...contract,
    id,
    created_at: new Date().toISOString(),
    last_checked: new Date().toISOString(),
  };
  globalMonitored.set(id, item);
  return item;
}

export function removeMonitored(id: string): boolean {
  return globalMonitored.delete(id);
}

export function getEventsForContract(contractId: string): MonitoringEvent[] {
  ensureSeedData();
  return globalEvents.get(contractId) || [];
}
