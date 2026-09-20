"""AuditAI Agent Engine — deterministic multi-agent Solidity analysis.

The engine dispatches a contract's source through a family of specialized
"agents". Each agent owns one vulnerability class, is trained on a curated
set of code patterns (compiled regexes) and reports findings with REAL line
numbers taken from the submitted source. Agents that know a safe transform
also act as fixers: they rewrite the flagged line (or insert a guard) so a
fully fixed contract can be downloaded after a scan.

Pipeline:
  1. Rule agents scan line-by-line (trained pattern library).
  2. Findings are deduplicated per (agent, line) and sorted by severity.
  3. Fixer agents apply line-targeted transforms to build the fixed source.
  4. A unified diff can be produced for any single finding (per-category patch).
"""

import difflib
import re
from dataclasses import dataclass, field

from ..models.scan import FindingSeverity

SEVERITY_ORDER = {
    FindingSeverity.CRITICAL: 0,
    FindingSeverity.HIGH: 1,
    FindingSeverity.MEDIUM: 2,
    FindingSeverity.LOW: 3,
    FindingSeverity.INFORMATIONAL: 4,
}

SEVERITY_WEIGHT = {
    FindingSeverity.CRITICAL: 40,
    FindingSeverity.HIGH: 20,
    FindingSeverity.MEDIUM: 10,
    FindingSeverity.LOW: 5,
    FindingSeverity.INFORMATIONAL: 1,
}


@dataclass
class AgentFinding:
    """A single issue reported by an agent."""

    rule_key: str
    agent: str
    category: str
    severity: FindingSeverity
    line_number: int  # 1-based
    code_snippet: str
    description: str
    suggested_fix: str
    fixable: bool  # whether the fixer agent can rewrite this line automatically

    @property
    def severity_order(self) -> int:
        return SEVERITY_ORDER[self.severity]


# ─────────────────────────────────────────────────────────────────────────────
# Fixer transforms — each receives the current line and returns its replacement
# lines. They are applied bottom-up so line indices stay stable.
# ─────────────────────────────────────────────────────────────────────────────


def _fix_tx_origin(line: str) -> list[str]:
    return [line.replace("tx.origin", "msg.sender")]


def _fix_selfdestruct(line: str) -> list[str]:
    # Comment the line out entirely — selfdestruct must never execute.
    # The original stays as a comment for reviewer context.
    return [
        "// AUDITAI FIX: selfdestruct disabled (irreversible fund loss)",
        "// " + line.strip(),
    ]


def _fix_delegatecall(line: str) -> list[str]:
    return [
        line.replace(
            ".delegatecall(",
            ".call( // AUDITAI FIX: delegatecall removed (storage hijack)",
        )
    ]


def _fix_unchecked_call(line: str) -> list[str]:
    stripped = line.strip()
    fixed = "require(" + stripped[:-1] + "); // AUDITAI FIX: return value now checked"
    indent = line[: len(line) - len(line.lstrip())]
    return [indent + fixed]


def _fix_unbounded_loop(line: str) -> list[str]:
    """Cap the loop with a local variable bounded by MAX_BATCH.

    Rewrites `for (init; i < arr.length; step)` into a two-line replacement:
    a cap declaration + a loop whose condition reads the cap. Non-standard
    shapes (<=, complex headers) fall back to a review annotation.
    """
    stripped = line.strip()
    if "<=" in stripped or ".length" not in line:
        return [line + " // AUDITAI REVIEW: bound this loop (gas griefing)"]

    m = re.search(
        r"for\s*\(([^;]*);([^;]*?)<\s*([^;]*?\.length)\s*;([^;]*)\)(.*)$",
        line,
    )
    if not m:
        return [line + " // AUDITAI REVIEW: bound this loop (gas griefing)"]

    init, lhs, length_expr, step, tail = m.groups()
    indent = line[: len(line) - len(line.lstrip())]
    cap_line = (
        f"{indent}uint256 _auditai_cap = {length_expr.strip()} > MAX_BATCH"
        f" ? MAX_BATCH : {length_expr.strip()};"
        " // AUDITAI FIX: cap iterations (gas griefing guard)"
    )
    new_header = (
        f"{indent}for ({init.strip()}; {lhs.strip()} < _auditai_cap;"
        f" {step.strip()}){tail}"
    )
    return [cap_line, new_header]


def _fix_old_pragma(line: str) -> list[str]:
    return [
        re.sub(
            r"(\^?\s*0)\.\d+(\.\d+)?",
            r"\1.8.20",
            line,
            count=1,
        )
        + " // AUDITAI FIX: upgraded to 0.8.x (built-in overflow checks)"
    ]


REENTRANCY_GUARD_BLOCK = [
    "bool private _auditai_locked; // AUDITAI FIX: reentrancy guard",
    "",
    "modifier nonReentrant() { // AUDITAI FIX: added by ReentrancyAgent",
    '    require(!_auditai_locked, "AUDITAI: reentrant call");',
    "    _auditai_locked = true;",
    "    _;",
    "    _auditai_locked = false;",
    "}",
]

MAX_BATCH_BLOCK = ["uint256 constant MAX_BATCH = 500; // AUDITAI FIX: loop bound"]


def _fix_reentrancy(line: str) -> list[str]:
    # The value-call line itself stays; the guard is inserted elsewhere.
    return [line]


# ─────────────────────────────────────────────────────────────────────────────
# Agent rule library (trained patterns)
# ─────────────────────────────────────────────────────────────────────────────


@dataclass
class AgentRule:
    key: str
    agent: str
    category: str
    severity: FindingSeverity
    patterns: list[re.Pattern]
    description: str
    suggested_fix: str
    fixer: object | None = None  # line transform, None = manual review
    scope_edits: list[str] = field(default_factory=list)  # extra block insertions


RULES: list[AgentRule] = [
    AgentRule(
        key="reentrancy",
        agent="SENTINEL-01 · ReentrancyAgent",
        category="Reentrancy",
        severity=FindingSeverity.CRITICAL,
        patterns=[re.compile(r"\.call\{value"), re.compile(r"\.call\.value\(")],
        description=(
            "External call forwards ether to a user-controlled address. If state "
            "(balances/allowances) is updated AFTER this call, an attacker can "
            "re-enter the function and drain funds (checks-effects-interactions violation)."
        ),
        suggested_fix=(
            "Apply checks-effects-interactions: update all state BEFORE the external "
            "call, and add the nonReentrant guard inserted by this engine."
        ),
        fixer=_fix_reentrancy,
        scope_edits=["reentrancy_guard"],
    ),
    AgentRule(
        key="tx_origin",
        agent="SENTINEL-02 · AuthAgent",
        category="tx.origin Authentication",
        severity=FindingSeverity.HIGH,
        patterns=[re.compile(r"\btx\.origin\b")],
        description=(
            "Authorization relies on tx.origin. Phishing contracts can trick the "
            "owner into triggering a transaction and pass this check with the "
            "owner's origin, draining authorized funds."
        ),
        suggested_fix="Replace tx.origin with msg.sender for authorization checks.",
        fixer=_fix_tx_origin,
    ),
    AgentRule(
        key="selfdestruct",
        agent="SENTINEL-03 · LifecycleAgent",
        category="Unprotected Selfdestruct",
        severity=FindingSeverity.CRITICAL,
        patterns=[re.compile(r"\bselfdestruct\s*\("), re.compile(r"\bsuicide\s*\(")],
        description=(
            "selfdestruct permanently destroys the contract and force-sends its "
            "balance. If reachable by an attacker (or unprotected), all funds are "
            "lost irreversibly."
        ),
        suggested_fix="Remove selfdestruct, or gate it behind a timelocked multi-sig.",
        fixer=_fix_selfdestruct,
    ),
    AgentRule(
        key="delegatecall",
        agent="SENTINEL-04 · ContextAgent",
        category="Dangerous delegatecall",
        severity=FindingSeverity.HIGH,
        patterns=[re.compile(r"\.delegatecall\s*\(")],
        description=(
            "delegatecall executes foreign code in THIS contract's storage context. "
            "A malicious or upgradable target can overwrite owner/storage slots and "
            "take over the contract."
        ),
        suggested_fix="Use call() instead, or pin the delegate target to an immutable, audited address.",
        fixer=_fix_delegatecall,
    ),
    AgentRule(
        key="unchecked_call",
        agent="SENTINEL-05 · ReturnValueAgent",
        category="Unchecked Return Value",
        severity=FindingSeverity.LOW,
        patterns=[
            re.compile(r"\.(call|send|transfer)\s*[\{\(]"),
        ],
        description=(
            "The boolean result of this low-level call is ignored. A failed call "
            "silently continues execution, leaving accounting inconsistent."
        ),
        suggested_fix="Wrap the call in require(...) or assert the returned bool.",
        fixer=_fix_unchecked_call,
    ),
    AgentRule(
        key="unbounded_loop",
        agent="SENTINEL-06 · GasAgent",
        category="Gas Griefing",
        severity=FindingSeverity.LOW,
        patterns=[re.compile(r"for\s*\([^)]*\.length")],
        description=(
            "Loop iterates over an unbounded dynamic array. Once the array grows "
            "large enough the transaction exceeds the block gas limit and the "
            "function becomes permanently unusable (DoS)."
        ),
        suggested_fix="Process in bounded batches (MAX_BATCH inserted by this engine) or pull-based claims.",
        fixer=_fix_unbounded_loop,
        scope_edits=["max_batch"],
    ),
    AgentRule(
        key="timestamp",
        agent="SENTINEL-07 · TemporalAgent",
        category="Timestamp Dependence",
        severity=FindingSeverity.MEDIUM,
        patterns=[re.compile(r"\bblock\.timestamp\b"), re.compile(r"\bnow\b")],
        description=(
            "Logic depends on block.timestamp. Miners can shift it ±15 seconds; "
            "if used for lotteries, deadlines or Vesting releases this is exploitable."
        ),
        suggested_fix="Use block numbers for ordering, or a decentralized oracle (Chainlink) for time.",
        fixer=None,
    ),
    AgentRule(
        key="weak_random",
        agent="SENTINEL-08 · EntropyAgent",
        category="Weak Source of Randomness",
        severity=FindingSeverity.HIGH,
        patterns=[
            re.compile(
                r"(?i)(random|lottery|winner|raffle|dice|rand\b)[^\n]*block\.(timestamp|hash|difficulty)"
            ),
            re.compile(
                r"(?i)block\.(timestamp|hash|difficulty)[^\n]*(random|lottery|winner|raffle|dice)"
            ),
        ],
        description=(
            "On-chain randomness derived from block properties is predictable and "
            "manipulable. Miners/attackers can precompute the outcome and win every time."
        ),
        suggested_fix="Use Chainlink VRF (or commit-reveal) for randomness.",
        fixer=None,
    ),
    AgentRule(
        key="access_control",
        agent="SENTINEL-09 · PrivilegeAgent",
        category="Missing Access Control",
        severity=FindingSeverity.HIGH,
        patterns=[
            re.compile(
                r"function\s+\w*\s*(withdraw|mint|burn|drain|destroy|setOwner|emergency|claim)\w*\s*\([^)]*\)\s*public(?![^{]*onlyOwner)",
                re.IGNORECASE,
            ),
        ],
        description=(
            "A privileged function (withdraw/mint/claim family) is public without a "
            "visible onlyOwner/role modifier. Anyone may invoke it directly."
        ),
        suggested_fix="Add OpenZeppelin's onlyOwner / AccessControl role check to this function.",
        fixer=None,
    ),
    AgentRule(
        key="overflow",
        agent="SENTINEL-10 · ArithAgent",
        category="Integer Overflow/Underflow",
        severity=FindingSeverity.MEDIUM,
        patterns=[re.compile(r"pragma\s+solidity\s*[\^>=]*\s*0\.[0-7]\.")],
        description=(
            "Solidity < 0.8 performs silent wrapping arithmetic. balances-=_amount "
            "can underflow to 2^256-1 and mint unlimited tokens without SafeMath."
        ),
        suggested_fix="Upgrade the pragma to ^0.8.x so overflow checks are built in.",
        fixer=_fix_old_pragma,
    ),
    AgentRule(
        key="centralization",
        agent="SENTINEL-11 · GovernanceAgent",
        category="Centralization Risk",
        severity=FindingSeverity.MEDIUM,
        patterns=[
            re.compile(
                r"payable\s*\(\s*owner\s*\)\s*\.\s*transfer\s*\(\s*address\s*\(\s*this\s*\)\s*\.\s*balance"
            ),
            re.compile(
                r"(?:owner|admin)[^\n]*\.transfer\s*\(\s*address\s*\(\s*this\s*\)\s*\.\s*balance"
            ),
        ],
        description=(
            "A single key can move the entire contract balance in one call. Owner "
            "compromise or rug-pull risk is total."
        ),
        suggested_fix="Route withdrawals through a TimelockController + multi-sig.",
        fixer=None,
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
# Scanning
# ─────────────────────────────────────────────────────────────────────────────


def run_agents(source: str) -> list[AgentFinding]:
    """Run all rule agents over the source and return deduplicated findings."""
    findings: list[AgentFinding] = []
    seen: set[tuple[str, int]] = set()
    lines = source.splitlines()

    for rule in RULES:
        for idx, line in enumerate(lines):
            if not any(p.search(line) for p in rule.patterns):
                continue
            key = (rule.key, idx)
            if key in seen:
                continue
            seen.add(key)

            # unchecked_call must not double-report calls whose value IS checked
            if rule.key == "unchecked_call" and (
                re.search(r"\bbool\s+\w+", line)
                or "require(" in line
                or re.search(r"\bif\s*\(", line)
            ):
                continue
            # skip unchecked_call on payable-transfer lines already wrapped
            if rule.key == "unchecked_call" and line.strip().startswith("require"):
                continue

            snippet = line.strip()
            if len(snippet) > 200:
                snippet = snippet[:197] + "..."
            findings.append(
                AgentFinding(
                    rule_key=rule.key,
                    agent=rule.agent,
                    category=rule.category,
                    severity=rule.severity,
                    line_number=idx + 1,
                    code_snippet=snippet,
                    description=rule.description,
                    suggested_fix=rule.suggested_fix,
                    fixable=rule.fixer is not None,
                )
            )

    findings.sort(key=lambda f: (f.severity_order, f.line_number))
    return findings


def calculate_risk_score(findings: list[AgentFinding]) -> str:
    total = sum(SEVERITY_WEIGHT.get(f.severity, 0) for f in findings)
    if total >= 60:
        return "F"
    if total >= 40:
        return "E"
    if total >= 25:
        return "D"
    if total >= 15:
        return "C"
    if total >= 8:
        return "B"
    return "A"


# ─────────────────────────────────────────────────────────────────────────────
# Fixing
# ─────────────────────────────────────────────────────────────────────────────


def _collect_line_edits(
    source: str,
    findings: list[AgentFinding] | None = None,
) -> dict[int, list[tuple[str, object]]]:
    """Map 0-based line index -> ordered list of (rule_key, fixer)."""
    rules_by_key = {r.key: r for r in RULES}
    if findings is None:
        findings = run_agents(source)

    edits: dict[int, list[tuple[str, object]]] = {}
    for f in findings:
        rule = rules_by_key.get(f.rule_key)
        if rule is None or rule.fixer is None:
            continue
        idx = f.line_number - 1
        bucket = edits.setdefault(idx, [])
        if all(k != rule.key for k, _ in bucket):
            bucket.append((rule.key, rule.fixer))
    return edits


def _scope_blocks(source: str, findings: list[AgentFinding]) -> dict[str, list[str]]:
    """Extra blocks (guards/constants) that fixer agents require."""
    rules_by_key = {r.key: r for r in RULES}
    needed: set[str] = set()
    for f in findings:
        rule = rules_by_key.get(f.rule_key)
        if rule:
            needed.update(rule.scope_edits)

    blocks: dict[str, list[str]] = {}
    text = "\n".join(source.splitlines())
    if "reentrancy_guard" in needed and "nonReentrant" not in text:
        blocks["reentrancy_guard"] = REENTRANCY_GUARD_BLOCK
    if "max_batch" in needed and "MAX_BATCH" not in text:
        blocks["max_batch"] = MAX_BATCH_BLOCK
    return blocks


def _insert_scope_blocks(lines: list[str], blocks: dict[str, list[str]]) -> list[str]:
    """Insert guard/constant blocks right after the first contract opening brace."""
    if not blocks:
        return lines
    out = list(lines)
    for idx, line in enumerate(out):
        if re.search(r"\bcontract\s+\w+[^{]*\{\s*$", line) or re.search(
            r"\babstract\s+contract\s+\w+[^{]*\{\s*$", line
        ):
            insertion: list[str] = []
            if "reentrancy_guard" in blocks:
                insertion.extend(blocks["reentrancy_guard"])
            if "max_batch" in blocks:
                insertion.extend(blocks["max_batch"])
            if insertion:
                out[idx : idx + 1] = [line] + insertion
            return out
    return out


def _apply_nonreentrant_to_functions(lines: list[str], call_line_idx: int) -> list[str]:
    """Add nonReentrant() to the function containing the flagged call line."""
    out = list(lines)
    for idx in range(call_line_idx, -1, -1):
        m = re.search(r"function\s+\w+\s*\([^)]*\)([^{]*)\{", out[idx])
        if m and "nonReentrant" not in out[idx]:
            head = m.group(1)
            if "nonReentrant()" in head:
                return out
            fixed_head = head.rstrip() + " nonReentrant() "
            out[idx] = out[idx].replace(head, fixed_head, 1)
            return out
    return out


def build_fixed_source(
    source: str,
) -> tuple[str, list[AgentFinding], list[AgentFinding]]:
    """Apply all safe fixer transforms and return (fixed_source, applied, manual)."""
    findings = run_agents(source)
    applied = [f for f in findings if f.fixable]
    manual = [f for f in findings if not f.fixable]

    lines = source.splitlines()
    edits = _collect_line_edits(source, findings)

    # Bottom-up application keeps indices valid.
    for idx in sorted(edits.keys(), reverse=True):
        for rule_key, fixer in edits[idx]:
            current = lines[idx]
            replacement = fixer(current)
            lines[idx : idx + 1] = replacement
            if rule_key == "reentrancy":
                lines = _apply_nonreentrant_to_functions(lines, idx)

    lines = _insert_scope_blocks(lines, _scope_blocks(source, findings))

    header = [
        "// ─────────────────────────────────────────────────────────────",
        "// Fixed by AuditAI Agent Engine",
        f"// Auto-applied fixes : {len(applied)}",
        f"// Manual review items: {len(manual)} (marked with AUDITAI REVIEW)",
        "// ─────────────────────────────────────────────────────────────",
        "",
    ]
    return "\n".join(header + lines) + "\n", applied, manual


def fixed_source_for_finding(source: str, finding: AgentFinding) -> str:
    """Apply ONLY one finding's fix — used to build per-category patches."""
    lines = source.splitlines()
    idx = finding.line_number - 1
    if idx < 0 or idx >= len(lines):
        return source

    rules_by_key = {r.key: r for r in RULES}
    rule = rules_by_key.get(finding.rule_key)
    if rule is None or rule.fixer is None:
        return source

    current = lines[idx]
    # Guard against the source having changed since the scan: only fix if the
    # line still triggers this rule.
    if not any(p.search(current) for p in rule.patterns):
        return source

    replacement = rule.fixer(current)
    lines[idx : idx + 1] = replacement
    if rule.key == "reentrancy":
        lines = _apply_nonreentrant_to_functions(lines, idx)
        lines = _insert_scope_blocks(lines, _scope_blocks(source, [finding]))
    return "\n".join(lines) + "\n"


def _sanitize(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_") or "Contract"


def build_unified_patch(
    original: str,
    fixed: str,
    contract_name: str,
) -> str:
    diff = difflib.unified_diff(
        original.splitlines(keepends=True),
        fixed.splitlines(keepends=True),
        fromfile=f"a/{_sanitize(contract_name)}.sol",
        tofile=f"b/{_sanitize(contract_name)}_fixed.sol",
    )
    return "".join(diff)
