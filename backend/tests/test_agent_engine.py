"""Unit tests for the AuditAI agent engine.

Pure unit tests — no database required. They verify that every trained rule
fires on a crafted vulnerable snippet, that reported line numbers point at
the real offending line, that fixer transforms produce safe replacements,
and that the patch builder emits a valid unified diff.
"""

import pytest

from backend.services.agent_engine import (
    RULES,
    SEVERITY_ORDER,
    SEVERITY_WEIGHT,
    AgentFinding,
    build_fixed_source,
    build_unified_patch,
    calculate_risk_score,
    fixed_source_for_finding,
    run_agents,
)
from backend.models.scan import FindingSeverity


# ─── Helpers ─────────────────────────────────────────────────────────────────


def lines_with_rule(findings, rule_key):
    return [f for f in findings if f.rule_key == rule_key]


def active_lines(source: str) -> list[str]:
    """Source lines that are not comments or the AUDITAI header."""
    return [
        l
        for l in source.splitlines()
        if not l.strip().startswith("//") and l.strip() != ""
    ]


# ─── Rule coverage: every rule fires on a trained snippet ───────────────────

RULE_SNIPPETS = {
    "reentrancy": '(bool success, ) = msg.sender.call{value: 1}("");',
    "tx_origin": "if (tx.origin == owner) { withdraw(); }",
    "selfdestruct": "selfdestruct(payable(owner));",
    "delegatecall": "(bool ok, ) = target.delegatecall(abi.encodeWithSignature(\"f()\"));",
    "unchecked_call": "token.transfer(to, amount);",
    "unbounded_loop": "for (uint i; i < users.length; i++) { process(users[i]); }",
    "timestamp": "require(block.timestamp > deadline);",
    "weak_random": "uint winner = random() % block.timestamp;",
    "access_control": "function withdrawAll() public { payable(msg.sender).transfer(address(this).balance); }",
    "overflow": "pragma solidity ^0.7.6;",
    "centralization": "payable(owner).transfer(address(this).balance);",
}


@pytest.mark.parametrize("rule_key", RULE_SNIPPETS.keys())
def test_every_rule_fires_on_trained_snippet(rule_key):
    rule = next(r for r in RULES if r.key == rule_key)
    source = "// SPDX-License-Identifier: MIT\n" + RULE_SNIPPETS[rule_key] + "\n"
    findings = lines_with_rule(run_agents(source), rule_key)
    assert findings, f"rule {rule_key} did not fire on its trained snippet"
    # Reported line must be the real line (2 = the snippet line)
    assert findings[0].line_number == 2
    # Snippet content must come from the actual source line
    actual = source.splitlines()[1].strip()
    assert findings[0].code_snippet in actual


def test_clean_contract_produces_no_findings():
    source = (
        "// SPDX-License-Identifier: MIT\n"
        "pragma solidity ^0.8.20;\n"
        "contract Clean {\n"
        "    function ping() external pure returns (uint256) { return 1; }\n"
        "}\n"
    )
    assert run_agents(source) == []


def test_findings_sorted_by_severity_then_line():
    source = (
        "pragma solidity ^0.7.6;\n"
        "contract T {\n"
        "    function a() public { selfdestruct(payable(owner)); }\n"
        "    function b() public { token.transfer(to, 1); }\n"
        "}\n"
    )
    findings = run_agents(source)
    orders = [SEVERITY_ORDER[f.severity] for f in findings]
    assert orders == sorted(orders)


def test_unchecked_call_not_reported_when_required():
    source = 'bool ok = token.transfer(to, amount);\nrequire(ok, "x");\n'
    assert lines_with_rule(run_agents(source), "unchecked_call") == []


# ─── Fixers ──────────────────────────────────────────────────────────────────


def test_fix_tx_origin():
    fixed, applied, _ = build_fixed_source("if (tx.origin == owner) { }")
    assert "tx.origin" not in " ".join(active_lines(fixed))
    assert "msg.sender == owner" in fixed
    assert len(applied) == 1


def test_fix_selfdestruct_commented_out():
    fixed, applied, _ = build_fixed_source("selfdestruct(payable(owner));")
    assert not any("selfdestruct(" in l for l in active_lines(fixed))
    assert any("selfdestruct" in l for l in fixed.splitlines())  # kept as comment
    assert len(applied) == 1


def test_fix_pragma_upgraded():
    fixed, _, _ = build_fixed_source("pragma solidity ^0.7.6;")
    assert "pragma solidity ^0.8.20" in fixed


def test_fix_delegatecall_downgraded():
    fixed, _, _ = build_fixed_source("target.delegatecall(data);")
    assert ".delegatecall(" not in " ".join(active_lines(fixed))


def test_unchecked_call_wrapped_in_require():
    fixed, _, _ = build_fixed_source("    token.transfer(to, amount);")
    assert "require(token.transfer(to, amount));" in fixed


def test_reentrancy_guard_inserted_once():
    source = (
        "contract V {\n"
        "    function w() public {\n"
        '        (bool s, ) = msg.sender.call{value: 1}("");\n'
        "    }\n"
        "}\n"
    )
    fixed, _, _ = build_fixed_source(source)
    assert fixed.count("modifier nonReentrant()") == 1
    # The function containing the call got the modifier
    assert "function w() public nonReentrant()" in fixed


def test_max_batch_constant_inserted():
    source = (
        "contract T {\n"
        "    function p() public {\n"
        "        for (uint i; i < users.length; i++) {}\n"
        "    }\n"
        "}\n"
    )
    fixed, applied, _ = build_fixed_source(source)
    assert "MAX_BATCH = 500" in fixed, "MAX_BATCH constant should be inserted"
    assert "_auditai_cap" in fixed, "loop should be capped via a local cap variable"
    assert any(f.rule_key == "unbounded_loop" for f in applied)


def test_scope_block_skipped_without_contract_opener():
    # A bare loop (no contract declaration) still gets capped inline,
    # but the constant block has no insertion point and is skipped.
    fixed, _, _ = build_fixed_source("for (uint i; i < users.length; i++) {}")
    assert "_auditai_cap" in fixed
    assert "MAX_BATCH = 500" not in fixed


def test_manual_review_items_not_auto_applied():
    source = "require(block.timestamp > deadline);\n"
    fixed, applied, manual = build_fixed_source(source)
    assert applied == []
    assert len(manual) == 1
    assert "AUDITAI REVIEW" in fixed or "block.timestamp" in fixed


# ─── Per-finding patch ───────────────────────────────────────────────────────


def test_fixed_source_for_finding_only_touches_own_line():
    source = (
        "if (tx.origin == owner) {\n"
        "    token.transfer(to, amount);\n"
        "}\n"
    )
    findings = run_agents(source)
    target = next(f for f in findings if f.rule_key == "tx_origin")
    patched = fixed_source_for_finding(source, target)
    # tx.origin fixed…
    assert "msg.sender == owner" in patched
    # …but the unchecked transfer line is untouched (its own finding is separate)
    assert "token.transfer(to, amount);" in patched


def test_fixed_source_for_finding_manual_rule_returns_original():
    source = "require(block.timestamp > deadline);\n"
    finding = lines_with_rule(run_agents(source), "timestamp")[0]
    assert fixed_source_for_finding(source, finding) == source


def test_fixed_source_for_finding_rejects_changed_source():
    source = "if (tx.origin == owner) {}\n"
    finding = lines_with_rule(run_agents(source), "tx_origin")[0]
    changed = "// totally different code\ncontract Other {}\n"
    assert fixed_source_for_finding(changed, finding) == changed


# ─── Patch builder ───────────────────────────────────────────────────────────


def test_unified_patch_format():
    original = "pragma solidity ^0.7.6;\ncontract A {}\n"
    fixed = "pragma solidity ^0.8.20;\ncontract A {}\n"
    patch = build_unified_patch(original, fixed, "My Token")
    assert patch.startswith("--- a/My_Token.sol")
    assert "+++ b/My_Token_fixed.sol" in patch
    assert "@@" in patch
    assert "-pragma solidity ^0.7.6;" in patch
    assert "+pragma solidity ^0.8.20;" in patch


def test_unified_patch_empty_when_no_change():
    src = "contract Same {}\n"
    assert build_unified_patch(src, src, "Same") == ""


# ─── Risk scoring ────────────────────────────────────────────────────────────


def _finding(sev: FindingSeverity) -> AgentFinding:
    return AgentFinding(
        rule_key="x",
        agent="A",
        category="C",
        severity=sev,
        line_number=1,
        code_snippet="",
        description="",
        suggested_fix="",
        fixable=False,
    )


@pytest.mark.parametrize(
    "sevs,expected",
    [
        ([], "A"),
        ([FindingSeverity.INFORMATIONAL], "A"),
        ([FindingSeverity.LOW, FindingSeverity.LOW], "B"),
        ([FindingSeverity.MEDIUM, FindingSeverity.MEDIUM], "C"),
        ([FindingSeverity.HIGH, FindingSeverity.MEDIUM], "D"),
        ([FindingSeverity.HIGH, FindingSeverity.HIGH], "E"),
        ([FindingSeverity.CRITICAL, FindingSeverity.HIGH], "F"),
    ],
)
def test_risk_score_grades(sevs, expected):
    assert calculate_risk_score([_finding(s) for s in sevs]) == expected


def test_severity_weight_matches_model_severities():
    # every model severity has a weight and an ordering defined
    for sev in FindingSeverity:
        assert sev in SEVERITY_WEIGHT
        assert sev in SEVERITY_ORDER
