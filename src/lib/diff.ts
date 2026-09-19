/**
 * Minimal client-side unified diff for the scan detail preview.
 * LCS-based line diff — no external dependency, fine for contract-sized files.
 */

function splitLines(text: string): string[] {
  // keepends-style split for stable reconstruction
  return text.split(/(?<=\n)/);
}

/** Longest-common-subsequence table over two line arrays (as string keys). */
function lcsTable(a: string[], b: string[]): Uint32Array[] {
  const table: Uint32Array[] = Array.from(
    { length: a.length + 1 },
    () => new Uint32Array(b.length + 1)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

export type DiffOp = " " | "-" | "+";

export interface DiffLine {
  op: DiffOp;
  text: string;
  /** 1-based line numbers in the original / fixed file (null for inserts/deletes) */
  aLine: number | null;
  bLine: number | null;
}

/** Full line-level diff between original and fixed source. */
export function diffLines(original: string, fixed: string): DiffLine[] {
  const a = splitLines(original);
  const b = splitLines(fixed);
  const table = lcsTable(a, b);

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ op: " ", text: a[i], aLine: i + 1, bLine: j + 1 });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ op: "-", text: a[i], aLine: i + 1, bLine: null });
      i++;
    } else {
      out.push({ op: "+", text: b[j], aLine: null, bLine: j + 1 });
      j++;
    }
  }
  while (i < a.length) {
    out.push({ op: "-", text: a[i], aLine: i + 1, bLine: null });
    i++;
  }
  while (j < b.length) {
    out.push({ op: "+", text: b[j], aLine: null, bLine: j + 1 });
    j++;
  }
  return out;
}

/**
 * Collapse long runs of unchanged lines to `context` lines around edits —
 * the classic unified-diff hunk behavior, rendered inline.
 */
export function collapseContext(
  lines: DiffLine[],
  context: number = 3
): (DiffLine | { op: "gap"; skipped: number })[] {
  const keep = new Array(lines.length).fill(false);
  lines.forEach((l, idx) => {
    if (l.op !== " ") {
      for (let k = Math.max(0, idx - context); k <= Math.min(lines.length - 1, idx + context); k++) {
        keep[k] = true;
      }
    }
  });

  const out: (DiffLine | { op: "gap"; skipped: number })[] = [];
  let gap = 0;
  lines.forEach((l, idx) => {
    if (keep[idx]) {
      if (gap > 0) {
        out.push({ op: "gap", skipped: gap });
        gap = 0;
      }
      out.push(l);
    } else {
      gap++;
    }
  });
  if (gap > 0) out.push({ op: "gap", skipped: gap });
  return out;
}

/** Stats for the preview header: added / removed / unchanged counts. */
export function diffStats(lines: DiffLine[]): {
  added: number;
  removed: number;
  unchanged: number;
} {
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const l of lines) {
    if (l.op === "+") added++;
    else if (l.op === "-") removed++;
    else unchanged++;
  }
  return { added, removed, unchanged };
}
