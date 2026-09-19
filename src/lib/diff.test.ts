import { describe, expect, it } from "vitest";
import {
  collapseContext,
  diffLines,
  diffStats,
} from "./diff";

describe("diffLines", () => {
  it("returns empty diff for identical sources", () => {
    const src = "contract A {\n  uint x;\n}\n";
    const lines = diffLines(src, src);
    expect(diffStats(lines)).toEqual({
      added: 0,
      removed: 0,
      unchanged: src.replace(/\n$/, "").split("\n").length,
    });
    expect(lines.every((l) => l.op === " ")).toBe(true);
  });

  it("marks replaced lines as remove + add pairs", () => {
    const before = "pragma solidity ^0.7.6;\ncontract A {}\n";
    const after = "pragma solidity ^0.8.20;\ncontract A {}\n";
    const lines = diffLines(before, after);
    const first = lines[0];
    expect(first.op).toBe("-");
    expect(first.text).toContain("^0.7.6");
    expect(first.aLine).toBe(1);
    expect(first.bLine).toBeNull();
    const second = lines[1];
    expect(second.op).toBe("+");
    expect(second.text).toContain("^0.8.20");
    expect(second.aLine).toBeNull();
    expect(second.bLine).toBe(1);
  });

  it("handles pure insertion at the end", () => {
    const lines = diffLines("a\n", "a\nb\n");
    expect(lines.filter((l) => l.op === "+")).toHaveLength(1);
    expect(lines.filter((l) => l.op === "-")).toHaveLength(0);
  });

  it("handles pure deletion at the end", () => {
    const lines = diffLines("a\nb\n", "a\n");
    expect(lines.filter((l) => l.op === "-")).toHaveLength(1);
    expect(lines.filter((l) => l.op === "+")).toHaveLength(0);
  });

  it("maps line numbers correctly through mixed edits", () => {
    const before = "l1\nl2\nl3\nl4\n";
    const after = "l1\nL2\nl3\nl4\n";
    const lines = diffLines(before, after);
    const minus = lines.find((l) => l.op === "-")!;
    const plus = lines.find((l) => l.op === "+")!;
    expect(minus.aLine).toBe(2);
    expect(plus.bLine).toBe(2);
  });
});

describe("collapseContext", () => {
  it("collapses long unchanged runs into a single gap", () => {
    const unchanged = Array.from({ length: 50 }, (_, i) => `u${i}`).join("\n");
    const src = `${unchanged}\nEDIT\n${unchanged}`;
    const lines = diffLines(src, `${unchanged}\nEDITED\n${unchanged}`);
    const collapsed = collapseContext(lines, 3);
    const gaps = collapsed.filter((r) => r.op === "gap");
    expect(gaps.length).toBeGreaterThan(0);
    // No more than context*2 + edit rows kept per edit region plus gap rows
    expect(collapsed.length).toBeLessThan(lines.length);
  });

  it("keeps everything visible when edits are dense", () => {
    const before = "a\nb\nc\n";
    const after = "A\nB\nC\n";
    const collapsed = collapseContext(diffLines(before, after), 3);
    expect(collapsed.some((r) => r.op === "gap")).toBe(false);
  });
});

describe("diffStats", () => {
  it("counts added removed and unchanged", () => {
    const stats = diffStats(diffLines("a\nb\nc\n", "a\nB\nc\nd\n"));
    expect(stats).toEqual({ added: 2, removed: 1, unchanged: 2 });
  });
});
