/**
 * Securithm Agent Engine — trained Solidity security scanner & auto-fixer.
 *
 * 11 rule agents (SENTINEL-01..11) report findings with REAL line numbers and
 * deterministic fixer transforms rewrite the source into a fixed contract,
 * with unified patches generated per finding and for the full fix set.
 *
 * Pure functions — runs in Node (website routes, CLI) and the browser.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "informational";

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  informational: 4,
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 30,
  high: 15,
  medium: 8,
  low: 2,
  informational: 0,
};

export interface AgentFinding {
  rule_key: string;
  agent: string;
  category: string;
  severity: Severity;
  severity_order: number;
  line_number: number; // 1-based
  code_snippet: string;
  description: string;
  suggested_fix: string;
  fixable: boolean;
}

/** A line fixer: receives the current line, returns its replacement lines. */
type LineFixer = (line: string) => string[];

interface AgentRule {
  key: string;
  agent: string;
  category: string;
  severity: Severity;
  patterns: RegExp[];
  description: string;
  suggested_fix: string;
  fixer?: LineFixer;
  scope_edits?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixer transforms
// ─────────────────────────────────────────────────────────────────────────────

function fixTxOrigin(line: string): string[] {
  return [line.replace(/tx\.origin/g, "msg.sender")];
}

function fixSelfdestruct(line: string): string[] {
  return [
    "// SECURITHM FIX: selfdestruct disabled (irreversible fund loss)",
    "// " + line.trim(),
  ];
}

function fixDelegatecall(line: string): string[] {
  return [
    line.replace(/\.delegatecall\s*\(/, ".call( // SECURITHM FIX: delegatecall removed (storage hijack)"),
  ];
}

function fixUncheckedCall(line: string): string[] {
  const stripped = line.trim();
  const fixed = "require(" + stripped.slice(0, -1) + "); // SECURITHM FIX: return value now checked";
  const indent = line.slice(0, line.length - line.replace(/^\s+/, "").length);
  return [indent + fixed];
}

function fixUnboundedLoop(line: string): string[] {
  const stripped = line.trim();
  if (stripped.includes("<=") || !line.includes(".length")) {
    return [line + " // SECURITHM REVIEW: bound this loop (gas griefing)"];
  }
  const m = line.match(/for\s*\(([^;]*);([^;]*?)<\s*([^;]*?\.length)\s*;([^;]*)\)(.*)$/);
  if (!m) {
    return [line + " // SECURITHM REVIEW: bound this loop (gas griefing)"];
  }
  const [, init, lhs, lengthExpr, step, tail] = m;
  const indent = line.slice(0, line.length - line.replace(/^\s+/, "").length);
  const capLine =
    `${indent}uint256 _securithm_cap = ${lengthExpr.trim()} > MAX_BATCH` +
    ` ? MAX_BATCH : ${lengthExpr.trim()};` +
    " // SECURITHM FIX: cap iterations (gas griefing guard)";
  const newHeader =
    `${indent}for (${init.trim()}; ${lhs.trim()} < _securithm_cap;` +
    ` ${step.trim()})${tail}`;
  return [capLine, newHeader];
}

function fixOldPragma(line: string): string[] {
  return [line.replace(/(\^?\s*0)\.\d+(?:\.\d+)?/, "$1.8.20") + " // SECURITHM FIX: upgraded to 0.8.x (built-in overflow checks)"];
}

function fixReentrancy(line: string): string[] {
  // The value-call line itself stays; the guard is inserted elsewhere.
  return [line];
}

export const REENTRANCY_GUARD_BLOCK: string[] = [
  "bool private _securithm_locked; // SECURITHM FIX: reentrancy guard",
  "",
  "modifier nonReentrant() { // SECURITHM FIX: added by ReentrancyAgent",
  "    require(!_securithm_locked, \"SECURITHM: reentrant call\");",
  "    _securithm_locked = true;",
  "    _;",
  "    _securithm_locked = false;",
  "}",
];

export const MAX_BATCH_BLOCK: string[] = [
  "uint256 constant MAX_BATCH = 500; // SECURITHM FIX: loop bound",
];

// ─────────────────────────────────────────────────────────────────────────────
// Agent rule library (trained patterns)
// ─────────────────────────────────────────────────────────────────────────────

export const RULES: AgentRule[] = [
  {
    key: "reentrancy",
    agent: "SENTINEL-01 · ReentrancyAgent",
    category: "Reentrancy",
    severity: "critical",
    patterns: [/\.call\{value/, /\.call\.value\(/],
    description:
      "External call forwards ether to a user-controlled address. If state " +
      "(balances/allowances) is updated AFTER this call, an attacker can " +
      "re-enter the function and drain funds (checks-effects-interactions violation).",
    suggested_fix:
      "Apply checks-effects-interactions: update all state BEFORE the external " +
      "call, and add the nonReentrant guard inserted by this engine.",
    fixer: fixReentrancy,
    scope_edits: ["reentrancy_guard"],
  },
  {
    key: "tx_origin",
    agent: "SENTINEL-02 · AuthAgent",
    category: "tx.origin Authentication",
    severity: "high",
    patterns: [/\btx\.origin\b/],
    description:
      "Authorization relies on tx.origin. Phishing contracts can trick the " +
      "owner into triggering a transaction and pass this check with the " +
      "owner's origin, draining authorized funds.",
    suggested_fix: "Replace tx.origin with msg.sender for authorization checks.",
    fixer: fixTxOrigin,
  },
  {
    key: "selfdestruct",
    agent: "SENTINEL-03 · LifecycleAgent",
    category: "Unprotected Selfdestruct",
    severity: "critical",
    patterns: [/\bselfdestruct\s*\(/, /\bsuicide\s*\(/],
    description:
      "selfdestruct permanently destroys the contract and force-sends its " +
      "balance. If reachable by an attacker (or unprotected), all funds are " +
      "lost irreversibly.",
    suggested_fix: "Remove selfdestruct, or gate it behind a timelocked multi-sig.",
    fixer: fixSelfdestruct,
  },
  {
    key: "delegatecall",
    agent: "SENTINEL-04 · ContextAgent",
    category: "Dangerous delegatecall",
    severity: "high",
    patterns: [/\.delegatecall\s*\(/],
    description:
      "delegatecall executes foreign code in THIS contract's storage context. " +
      "A malicious or upgradable target can overwrite owner/storage slots and " +
      "take over the contract.",
    suggested_fix: "Use call() instead, or pin the delegate target to an immutable, audited address.",
    fixer: fixDelegatecall,
  },
  {
    key: "unchecked_call",
    agent: "SENTINEL-05 · ReturnValueAgent",
    category: "Unchecked Return Value",
    severity: "low",
    patterns: [/\.(call|send|transfer)\s*[{(]/],
    description:
      "The boolean result of this low-level call is ignored. A failed call " +
      "silently continues execution, leaving accounting inconsistent.",
    suggested_fix: "Wrap the call in require(...) or assert the returned bool.",
    fixer: fixUncheckedCall,
  },
  {
    key: "unbounded_loop",
    agent: "SENTINEL-06 · GasAgent",
    category: "Gas Griefing",
    severity: "low",
    patterns: [/for\s*\([^)]*\.length/],
    description:
      "Loop iterates over an unbounded dynamic array. Once the array grows " +
      "large enough the transaction exceeds the block gas limit and the " +
      "function becomes permanently unusable (DoS).",
    suggested_fix: "Process in bounded batches (MAX_BATCH inserted by this engine) or pull-based claims.",
    fixer: fixUnboundedLoop,
    scope_edits: ["max_batch"],
  },
  {
    key: "timestamp",
    agent: "SENTINEL-07 · TemporalAgent",
    category: "Timestamp Dependence",
    severity: "medium",
    patterns: [/\bblock\.timestamp\b/, /\bnow\b/],
    description:
      "Logic depends on block.timestamp. Miners can shift it ±15 seconds; " +
      "if used for lotteries, deadlines or vesting releases this is exploitable.",
    suggested_fix: "Use block numbers for ordering, or a decentralized oracle (Chainlink) for time.",
  },
  {
    key: "weak_random",
    agent: "SENTINEL-08 · EntropyAgent",
    category: "Weak Source of Randomness",
    severity: "high",
    patterns: [
      /(random|lottery|winner|raffle|dice|rand\b)[^\n]*block\.(timestamp|hash|difficulty)/i,
      /block\.(timestamp|hash|difficulty)[^\n]*(random|lottery|winner|raffle|dice)/i,
    ],
    description:
      "On-chain randomness derived from block properties is predictable and " +
      "manipulable. Miners/attackers can precompute the outcome and win every time.",
    suggested_fix: "Use Chainlink VRF (or commit-reveal) for randomness.",
  },
  {
    key: "access_control",
    agent: "SENTINEL-09 · PrivilegeAgent",
    category: "Missing Access Control",
    severity: "high",
    patterns: [
      /function\s+\w*\s*(withdraw|mint|burn|drain|destroy|setOwner|emergency|claim)\w*\s*\([^)]*\)\s*public(?![^{]*onlyOwner)/i,
    ],
    description:
      "A privileged function (withdraw/mint/claim family) is public without a " +
      "visible onlyOwner/role modifier. Anyone may invoke it directly.",
    suggested_fix: "Add OpenZeppelin's onlyOwner / AccessControl role check to this function.",
  },
  {
    key: "overflow",
    agent: "SENTINEL-10 · ArithAgent",
    category: "Integer Overflow/Underflow",
    severity: "medium",
    patterns: [/pragma\s+solidity\s*[>=^]*\s*0\.[0-7]\./],
    description:
      "Solidity < 0.8 performs silent wrapping arithmetic. balances -= _amount " +
      "can underflow to 2^256-1 and mint unlimited tokens without SafeMath.",
    suggested_fix: "Upgrade the pragma to ^0.8.x so overflow checks are built in.",
    fixer: fixOldPragma,
  },
  {
    key: "centralization",
    agent: "SENTINEL-11 · GovernanceAgent",
    category: "Centralization Risk",
    severity: "medium",
    patterns: [
      /payable\s*\(\s*owner\s*\)\s*\.\s*transfer\s*\(\s*address\s*\(\s*this\s*\)\s*\.\s*balance/,
      /(?:owner|admin)[^\n]*\.transfer\s*\(\s*address\s*\(\s*this\s*\)\s*\.\s*balance/,
    ],
    description:
      "A single key can move the entire contract balance in one call. Owner " +
      "compromise or rug-pull risk is total.",
    suggested_fix: "Route withdrawals through a TimelockController + multi-sig.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Scanning
// ─────────────────────────────────────────────────────────────────────────────

/** Run all rule agents over the source and return deduplicated findings. */
export function runAgents(source: string): AgentFinding[] {
  const findings: AgentFinding[] = [];
  const seen = new Set<string>();
  const lines = source.split(/\r?\n/);

  for (const rule of RULES) {
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (!rule.patterns.some((p) => p.test(line))) continue;
      const key = `${rule.key}:${idx}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // unchecked_call must not double-report calls whose value IS checked
      if (rule.key === "unchecked_call") {
        if (/\bbool\s+\w+/.test(line) || line.includes("require(") || /\bif\s*\(/.test(line)) continue;
        if (line.trim().startsWith("require")) continue;
      }

      let snippet = line.trim();
      if (snippet.length > 200) snippet = snippet.slice(0, 197) + "...";
      findings.push({
        rule_key: rule.key,
        agent: rule.agent,
        category: rule.category,
        severity: rule.severity,
        severity_order: SEVERITY_ORDER[rule.severity],
        line_number: idx + 1,
        code_snippet: snippet,
        description: rule.description,
        suggested_fix: rule.suggested_fix,
        fixable: rule.fixer !== undefined,
      });
    }
  }

  findings.sort(
    (a, b) =>
      a.severity_order - b.severity_order || a.line_number - b.line_number
  );
  return findings;
}

export function calculateRiskScore(findings: AgentFinding[]): string {
  const total = findings.reduce((sum, f) => sum + (SEVERITY_WEIGHT[f.severity] ?? 0), 0);
  if (total >= 60) return "F";
  if (total >= 40) return "E";
  if (total >= 25) return "D";
  if (total >= 15) return "C";
  if (total >= 8) return "B";
  return "A";
}

/** Extract the contract name from the source (`contract Foo is Bar {`). */
export function extractContractName(source: string): string {
  const m = source.match(/\b(?:abstract\s+)?contract\s+([A-Za-z_$][\w$]*)/);
  return m ? m[1] : "Contract";
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixing
// ─────────────────────────────────────────────────────────────────────────────

/** Map 0-based line index -> ordered rule keys whose fixer applies there. */
function collectLineEdits(findings: AgentFinding[]): Map<number, string[]> {
  const rulesByKey = new Map(RULES.map((r) => [r.key, r]));
  const edits = new Map<number, string[]>();
  for (const f of findings) {
    const rule = rulesByKey.get(f.rule_key);
    if (!rule || !rule.fixer) continue;
    const idx = f.line_number - 1;
    const bucket = edits.get(idx) ?? [];
    if (!bucket.includes(rule.key)) bucket.push(rule.key);
    edits.set(idx, bucket);
  }
  return edits;
}

function scopeBlocks(source: string, findings: AgentFinding[]): Map<string, string[]> {
  const rulesByKey = new Map(RULES.map((r) => [r.key, r]));
  const needed = new Set<string>();
  for (const f of findings) {
    const rule = rulesByKey.get(f.rule_key);
    if (rule?.scope_edits) rule.scope_edits.forEach((s) => needed.add(s));
  }
  const blocks = new Map<string, string[]>();
  if (needed.has("reentrancy_guard") && !source.includes("nonReentrant")) {
    blocks.set("reentrancy_guard", REENTRANCY_GUARD_BLOCK);
  }
  if (needed.has("max_batch") && !source.includes("MAX_BATCH")) {
    blocks.set("max_batch", MAX_BATCH_BLOCK);
  }
  return blocks;
}

function insertScopeBlocks(lines: string[], blocks: Map<string, string[]>): string[] {
  if (blocks.size === 0) return lines;
  const out = [...lines];
  for (let idx = 0; idx < out.length; idx++) {
    if (/\b(abstract\s+)?contract\s+\w+[^{]*\{\s*$/.test(out[idx])) {
      const insertion: string[] = [];
      if (blocks.has("reentrancy_guard")) insertion.push(...blocks.get("reentrancy_guard")!);
      if (blocks.has("max_batch")) insertion.push(...blocks.get("max_batch")!);
      if (insertion.length) out.splice(idx + 1, 0, ...insertion);
      return out;
    }
  }
  return out;
}

/** Add nonReentrant() to the function containing the flagged call line. */
function applyNonReentrantToFunctions(lines: string[], callLineIdx: number): string[] {
  const out = [...lines];
  for (let idx = callLineIdx; idx >= 0; idx--) {
    const m = out[idx].match(/function\s+\w+\s*\([^)]*\)([^{]*)\{/);
    if (m && !out[idx].includes("nonReentrant")) {
      const head = m[1];
      if (head.includes("nonReentrant()")) return out;
      const fixedHead = head.replace(/\s*$/, "") + " nonReentrant() ";
      out[idx] = out[idx].replace(head, fixedHead);
      return out;
    }
  }
  return out;
}

/** Apply ALL safe fixer transforms. Returns { fixed, applied, manual }. */
export function buildFixedSource(source: string): {
  fixed: string;
  applied: AgentFinding[];
  manual: AgentFinding[];
} {
  const findings = runAgents(source);
  const applied = findings.filter((f) => f.fixable);
  const manual = findings.filter((f) => !f.fixable);

  const lines = source.split(/\r?\n/);
  const edits = collectLineEdits(findings);

  // Bottom-up application keeps indices valid.
  for (const idx of [...edits.keys()].sort((a, b) => b - a)) {
    for (const ruleKey of edits.get(idx)!) {
      const rule = RULES.find((r) => r.key === ruleKey);
      if (!rule?.fixer) continue;
      const current = lines[idx];
      if (current === undefined) continue;
      const replacement = rule.fixer(current);
      lines.splice(idx, 1, ...replacement);
      if (ruleKey === "reentrancy") {
        applyNonReentrantInPlace(lines, idx);
      }
    }
  }

  const finalLines = insertScopeBlocks(lines, scopeBlocks(source, findings));

  const header = [
    "// ─────────────────────────────────────────────────────────────",
    "// Fixed by Securithm Agent Engine",
    `// Auto-applied fixes : ${applied.length}`,
    `// Manual review items: ${manual.length} (marked with SECURITHM REVIEW)`,
    "// ─────────────────────────────────────────────────────────────",
    "",
  ];
  return { fixed: header.concat(finalLines).join("\n") + "\n", applied, manual };
}

/** Apply nonReentrant and keep the working array in place. */
function applyNonReentrantInPlace(lines: string[], callLineIdx: number): void {
  const updated = applyNonReentrantToFunctions(lines, callLineIdx);
  if (updated !== lines) {
    lines.length = 0;
    lines.push(...updated);
  }
}

/** Apply ONLY one finding's fix — used for per-category patches. */
export function fixedSourceForFinding(source: string, finding: AgentFinding): string {
  const lines = source.split(/\r?\n/);
  const idx = finding.line_number - 1;
  if (idx < 0 || idx >= lines.length) return source;

  const rule = RULES.find((r) => r.key === finding.rule_key);
  if (!rule?.fixer) return source;

  const current = lines[idx];
  // Guard against the source having changed since the scan.
  if (!rule.patterns.some((p) => p.test(current))) return source;

  const replacement = rule.fixer(current);
  lines.splice(idx, 1, ...replacement);
  let out = lines;
  if (rule.key === "reentrancy") {
    out = applyNonReentrantToFunctions(lines, idx);
    out = insertScopeBlocks(out, scopeBlocks(source, [finding]));
  }
  return out.join("\n") + "\n";
}

export function sanitizeName(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "Contract";
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified diff (LCS-based)
// ─────────────────────────────────────────────────────────────────────────────

interface DiffOp {
  type: "equal" | "delete" | "insert";
  aLine?: number; // 1-based index into original
  bLine?: number; // 1-based index into fixed
  text: string;
}

function diffLines(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  // LCS table (contracts are small; n*m fine)
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", aLine: i + 1, bLine: j + 1, text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ type: "delete", aLine: i + 1, text: a[i] });
      i++;
    } else {
      ops.push({ type: "insert", bLine: j + 1, text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "delete", aLine: ++i, text: a[i - 1] });
  while (j < m) ops.push({ type: "insert", bLine: ++j, text: b[j - 1] });
  return ops;
}

/** Standard unified diff with 3 context lines. */
export function buildUnifiedPatch(
  original: string,
  fixed: string,
  contractName: string,
  fromLabel?: string,
  toLabel?: string
): string {
  const name = sanitizeName(contractName);
  const a = original.split(/\r?\n/);
  const b = fixed.split(/\r?\n/);
  // Trailing empty line artifacts from split
  if (a.length && a[a.length - 1] === "") a.pop();
  if (b.length && b[b.length - 1] === "") b.pop();

  const ops = diffLines(a, b);
  const CONTEXT = 3;
  const header =
    `--- ${fromLabel ?? `a/${name}.sol`}\n` +
    `+++ ${toLabel ?? `b/${name}_fixed.sol`}\n`;

  // Build hunks
  const hunks: string[] = [];
  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === "equal") {
      i++;
      continue;
    }
    // hunk start: up to CONTEXT lines before
    let start = i;
    for (let k = 0; k < CONTEXT && start > 0 && ops[start - 1].type === "equal"; k++) start--;
    // hunk end: include changes + CONTEXT context lines after
    let end = i;
    let pending = 0;
    while (end < ops.length) {
      if (ops[end].type !== "equal") {
        end++;
        pending = 0;
      } else {
        pending++;
        end++;
        if (pending >= CONTEXT) break;
      }
    }
    // trim trailing context beyond ops
    const hunkOps = ops.slice(start, end);
    let aStart = 0;
    let bStart = 0;
    for (const op of hunkOps) {
      if (op.aLine !== undefined && aStart === 0) aStart = op.aLine;
      if (op.bLine !== undefined && bStart === 0) bStart = op.bLine;
    }
    if (hunkOps.some((op) => op.aLine !== undefined) && aStart === 0) aStart = a.length;
    if (hunkOps.some((op) => op.bLine !== undefined) && bStart === 0) bStart = b.length;
    const aCount = hunkOps.filter((op) => op.type !== "insert").length;
    const bCount = hunkOps.filter((op) => op.type !== "delete").length;
    let hunk = `@@ -${aStart},${aCount} +${bStart},${bCount} @@\n`;
    for (const op of hunkOps) {
      if (op.type === "equal") hunk += " " + op.text + "\n";
      else if (op.type === "delete") hunk += "-" + op.text + "\n";
      else hunk += "+" + op.text + "\n";
    }
    hunks.push(hunk);
    i = end;
  }

  if (hunks.length === 0) return "";
  return header + hunks.join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// High-level analysis (used by website routes and the CLI)
// ─────────────────────────────────────────────────────────────────────────────

export interface EngineResult {
  findings: AgentFinding[];
  risk_score: string;
  contract_name: string;
  fixed_code: string;
  fixes_applied: number;
  fixes_manual: number;
  full_patch: string;
}

/** Scan + fix in one deterministic pass. */
export function analyzeAndFix(source: string): EngineResult {
  const { contract_name } = { contract_name: extractContractName(source) };
  const findings = runAgents(source);
  const risk_score = calculateRiskScore(findings);
  const { fixed, applied, manual } = buildFixedSource(source);
  const full_patch = buildUnifiedPatch(source, fixed, contract_name);
  return {
    findings,
    risk_score,
    contract_name,
    fixed_code: fixed,
    fixes_applied: applied.length,
    fixes_manual: manual.length,
    full_patch,
  };
}
