#!/usr/bin/env node
/**
 * Securithm CLI — scan, fix and harden Solidity contracts from the terminal.
 *
 *   npm install -g securithm
 *   securithm scan MyContract.sol --fix
 *
 * Free tier: 5 contract scans, no account needed. After the 5th scan the CLI
 * asks you to paste your Securithm API key (dashboard → API Keys) to continue.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { exec } from "node:child_process";
import {
  runAgents,
  buildFixedSource,
  buildUnifiedPatch,
  calculateRiskScore,
  extractContractName,
  sanitizeName,
  type AgentFinding,
} from "./engine.js";

const DEFAULT_BASE_URL = "https://securithm.vercel.app";
const FREE_SCAN_LIMIT = 5;
const CONFIG_DIR = path.join(os.homedir(), ".securithm");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const USAGE_FILE = path.join(CONFIG_DIR, "usage.json");

interface CliConfig {
  api_key: string | null;
  base_url: string;
  version_check_at: string | null;
}

interface UsageRecord {
  count: number;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config / usage persistence
// ─────────────────────────────────────────────────────────────────────────────

function loadJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function loadConfig(): CliConfig {
  return loadJson<CliConfig>(CONFIG_FILE, {
    api_key: null,
    base_url: DEFAULT_BASE_URL,
    version_check_at: null,
  });
}

function saveConfig(config: CliConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadUsage(): UsageRecord {
  const rec = loadJson<UsageRecord>(USAGE_FILE, { count: 0, updated_at: new Date().toISOString() });
  return {
    count: typeof rec.count === "number" ? rec.count : 0,
    updated_at: rec.updated_at ?? new Date().toISOString(),
  };
}

function bumpUsage(): UsageRecord {
  const rec = loadUsage();
  rec.count += 1;
  rec.updated_at = new Date().toISOString();
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(USAGE_FILE, JSON.stringify(rec, null, 2));
  return rec;
}

function resetUsage(): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(USAGE_FILE, JSON.stringify({ count: 0, updated_at: new Date().toISOString() }, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Terminal styling (no deps)
// ─────────────────────────────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  violet: (s: string) => (isTTY ? `\x1b[35m${s}\x1b[0m` : s),
  bold: (s: string) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s),
  red: (s: string) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s: string) => (isTTY ? `\x1b[33m${s}\x1b[0m` : s),
  green: (s: string) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s),
  cyan: (s: string) => (isTTY ? `\x1b[36m${s}\x1b[0m` : s),
  dim: (s: string) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s),
};

const BANNER = `
${c.violet("  ┌─────────────────────────────────────────┐")}
${c.violet("  │")}${c.bold("        S E C U R I T H M   CLI        ")}${c.violet("│")}
${c.violet("  │")}${c.dim("   scan · fix · harden your contracts   ")}${c.violet("│")}
${c.violet("  └─────────────────────────────────────────┘")}
`;

// ─────────────────────────────────────────────────────────────────────────────
// API key gate (paste flow)
// ─────────────────────────────────────────────────────────────────────────────

/** Best-effort cross-platform browser open (no dependencies). */
function openBrowser(url: string): void {
  try {
    if (process.platform === "win32") exec(`start "" "${url}"`);
    else if (process.platform === "darwin") exec(`open "${url}"`);
    else exec(`xdg-open "${url}"`);
  } catch {
    // headless/CI — the printed URL is the fallback
  }
}

async function promptApiKey(config: CliConfig): Promise<string | null> {
  const pricingUrl = `${config.base_url}/pricing?cli=1`;
  console.log("");
  console.log(c.bold("  ── Free limit reached — API key required ──"));
  console.log("");
  console.log(`  You've used all ${c.bold(String(FREE_SCAN_LIMIT))} free scans.`);
  console.log("  Opening your browser — sign in, pick a plan and complete checkout");
  console.log("  (Razorpay); your API key is generated right on the page.");
  openBrowser(pricingUrl);
  console.log("");
  console.log(c.dim(`  If the browser didn't open, go to: ${pricingUrl}`));
  console.log("");
  console.log("  Then paste your API key here (press Enter to abort):");
  console.log("");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let answer = "";
  try {
    answer = (await rl.question(c.cyan("  API key: "))).trim();
  } catch {
    // stdin closed before a full line arrived
  }
  rl.close();
  if (!answer) {
    console.log(c.red("  No key entered — aborting."));
    console.log(c.dim("  Tip: run `securithm login` after your key is ready."));
    return null;
  }
  return answer;
}

async function ensureEntitlement(usage: UsageRecord, config: CliConfig): Promise<boolean> {
  if (usage.count < FREE_SCAN_LIMIT) return true;
  if (config.api_key) return true;
  const key = await promptApiKey(config);
  if (!key) return false;

  // Validate the key against the website before accepting it.
  process.stdout.write(c.dim("  validating key… "));
  try {
    const res = await fetch(`${config.base_url}/api/v1/api-keys/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (res.ok) {
      const data = (await res.json()) as { valid: boolean };
      if (data.valid) {
        console.log(c.green("ok"));
        config.api_key = key;
        saveConfig(config);
        resetUsage();
        console.log(c.green("  ✓ Key saved — unlimited scanning unlocked."));
        return true;
      }
    }
  } catch {
    // network issue — fall through to offline acceptance
  }
  console.log(c.yellow("  could not validate (offline?) — saving key locally."));
  config.api_key = key;
  saveConfig(config);
  resetUsage();
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update check
// ─────────────────────────────────────────────────────────────────────────────

const PKG_VERSION = "1.1.0";

function isNewerVersion(current: string, candidate: string): boolean {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const [c1, c2, c3] = parse(current);
  const [l1, l2, l3] = parse(candidate);
  return l1 !== c1 ? l1 > c1 : l2 !== c2 ? l2 > c2 : l3 > c3;
}

async function checkForUpdates(config: CliConfig): Promise<void> {
  const now = Date.now();
  const last = config.version_check_at ? Date.parse(config.version_check_at) : 0;
  if (now - last < 24 * 60 * 60 * 1000) return; // at most once/day
  config.version_check_at = new Date().toISOString();
  saveConfig(config);
  try {
    const res = await fetch("https://registry.npmjs.org/securithm/latest");
    if (!res.ok) return;
    const data = (res as unknown as { json: () => Promise<{ version?: string }> });
    const latest = (await data.json()).version;
    if (latest && isNewerVersion(PKG_VERSION, latest)) {
      console.log("");
      console.log(c.yellow(`  ↺ Update available: ${PKG_VERSION} → ${latest}`));
      console.log(c.dim("    run: npm install -g securithm@latest"));
      console.log("");
    }
  } catch {
    // offline — ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scanning
// ─────────────────────────────────────────────────────────────────────────────

interface ScanOutcome {
  file: string;
  contractName: string;
  findings: AgentFinding[];
  riskScore: string;
  fixedCode: string;
  fullPatch: string;
  appliedCount: number;
  manualCount: number;
}

function scanSource(source: string): Omit<ScanOutcome, "file"> {
  const contractName = extractContractName(source);
  const findings = runAgents(source);
  const riskScore = calculateRiskScore(findings);
  const { fixed, applied, manual } = buildFixedSource(source);
  const fullPatch = buildUnifiedPatch(source, fixed, contractName);
  return {
    contractName,
    findings,
    riskScore,
    fixedCode: fixed,
    fullPatch,
    appliedCount: applied.length,
    manualCount: manual.length,
  };
}

const SEV_COLOR: Record<string, (s: string) => string> = {
  critical: c.red,
  high: c.red,
  medium: c.yellow,
  low: c.dim,
  informational: c.dim,
};

function printReport(outcome: Omit<ScanOutcome, "file">): void {
  const { findings, riskScore, contractName, appliedCount, manualCount } = outcome;
  console.log("");
  console.log(c.bold(`  ${contractName} — risk grade ${c.bold(c.violet(riskScore))}`));
  console.log(c.dim(`  ${findings.length} findings · ${appliedCount} auto-fixed · ${manualCount} need manual review`));
  console.log("");

  if (findings.length === 0) {
    console.log(c.green("  ✓ No issues found. Contract looks clean."));
    return;
  }

  for (const f of findings) {
    const sev = SEV_COLOR[f.severity] ?? c.dim;
    console.log(`  ${sev(f.severity.toUpperCase().padEnd(8))} ${c.bold(f.category)} ${c.dim("· " + f.agent)}`);
    console.log(c.dim(`    line ${f.line_number}: ${f.code_snippet}`));
    console.log(`    ${f.description}`);
    console.log(c.cyan(`    fix: ${f.suggested_fix}${f.fixable ? c.green("  [AUTO-FIX READY]") : c.yellow("  [MANUAL REVIEW]")}`));
    console.log("");
  }
}

function writeOutputs(outcome: ScanOutcome, outDir: string | undefined): string[] {
  const base = sanitizeName(outcome.contractName);
  const dir = outDir ?? path.dirname(outcome.file);
  fs.mkdirSync(dir, { recursive: true });
  const written: string[] = [];

  const fixedPath = path.join(dir, `${base}_fixed.sol`);
  fs.writeFileSync(fixedPath, outcome.fixedCode);
  written.push(fixedPath);

  if (outcome.fullPatch) {
    const patchPath = path.join(dir, `${base}_auditai.patch`);
    fs.writeFileSync(patchPath, outcome.fullPatch);
    written.push(patchPath);
  }
  return written;
}

// ─────────────────────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(BANNER);
  console.log("  Usage: securithm <command> [options]");
  console.log("");
  console.log("  Commands:");
  console.log("    scan <files...>     Scan Solidity contracts (globs ok)");
  console.log("      --fix             Write <Name>_fixed.sol next to the input");
  console.log("      --patch           Also write a unified .patch file");
  console.log("      --out <dir>       Output directory (default: beside input)");
  console.log("      --no-sync         Skip syncing to your Securithm dashboard");
  console.log("    login               Paste your API key (unlocks unlimited scans + dashboard sync)");
  console.log("    status              Show usage, key state and version");
  console.log("    update              Check npm for a newer CLI version");
  console.log("    help                Show this help");
  console.log("");
  console.log("  Free tier: " + FREE_SCAN_LIMIT + " scans, no account needed.");
  console.log("  Docs: " + DEFAULT_BASE_URL + "/docs");
}

async function cmdLogin(): Promise<void> {
  const config = loadConfig();
  const key = await promptApiKey(config);
  if (!key) return;
  config.api_key = key;
  saveConfig(config);
  resetUsage();
  console.log(c.green("  ✓ Key saved to " + CONFIG_FILE));
}

async function cmdStatus(): Promise<void> {
  const config = loadConfig();
  const usage = loadUsage();
  console.log(BANNER);
  console.log(`  version      : ${PKG_VERSION}`);
  console.log(`  scans used   : ${usage.count}${config.api_key ? c.green(" (unlimited — key active)") : c.dim(` of ${FREE_SCAN_LIMIT} free`)}`);
  console.log(`  api key      : ${config.api_key ? c.green("configured") : c.dim("not set")}`);
  console.log(`  config       : ${CONFIG_FILE}`);
}

/** Push a local scan result to the user's Securithm dashboard (best effort). */
async function syncScan(config: CliConfig, source: string, contractName: string): Promise<boolean> {
  try {
    const res = await fetch(`${config.base_url}/api/v1/scans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
        "X-Securithm-Client": "cli",
      },
      body: JSON.stringify({
        contract_source: source,
        chain: "ethereum",
        contract_name: contractName,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function cmdScan(args: string[]): Promise<void> {
  const config = loadConfig();
  await checkForUpdates(config);

  const fix = args.includes("--fix");
  const wantPatch = args.includes("--patch");
  const noSync = args.includes("--no-sync");
  const outIdx = args.indexOf("--out");
  const outDir = outIdx !== -1 ? args[outIdx + 1] : undefined;
  const files = args.filter(
    (a, i) => !a.startsWith("--") && (outIdx === -1 || i !== outIdx + 1)
  );

  if (files.length === 0) {
    console.error(c.red("  error: no input files. Usage: securithm scan <files...> [--fix] [--patch] [--out dir]"));
    process.exitCode = 1;
    return;
  }

  // Collect .sol files (globs resolved by the shell)
  const solFiles: string[] = [];
  for (const f of files) {
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
      solFiles.push(...walkSol(f));
    } else if (fs.existsSync(f)) {
      solFiles.push(f);
    } else {
      console.error(c.yellow(`  warning: ${f} not found — skipping`));
    }
  }
  if (solFiles.length === 0) {
    console.error(c.red("  error: no .sol files found"));
    process.exitCode = 1;
    return;
  }

  const usage = loadUsage();
  const totalScans = solFiles.length;
  if (!config.api_key && usage.count + totalScans > FREE_SCAN_LIMIT) {
    const ok = await ensureEntitlement(usage, config);
    if (!ok) {
      console.log(c.dim("  scan cancelled."));
      return;
    }
  }

  let failures = 0;
  for (const file of solFiles) {
    const source = fs.readFileSync(file, "utf8");
    const outcome = { file, ...scanSource(source) };
    printReport(outcome);
    if (fix || wantPatch) {
      const written = writeOutputs(outcome, outDir);
      console.log(c.green("  → wrote: " + written.join(", ")));
    }
    if (config.api_key && !noSync) {
      const synced = await syncScan(config, source, outcome.contractName);
      if (synced) console.log(c.green("  ✓ synced to your Securithm dashboard"));
      else console.log(c.yellow("  ! sync failed (offline?) — scan kept local"));
    } else if (!config.api_key) {
      console.log(c.dim("  tip: `securithm login` syncs scans to your dashboard"));
    }
    bumpUsage();
    if (outcome.findings.some((f) => f.severity === "critical")) failures = 1;
  }

  const after = loadUsage();
  console.log("");
  console.log(
    c.dim(
      `  scans used: ${after.count}${config.api_key ? "" : ` / ${FREE_SCAN_LIMIT} free`}` +
        (config.api_key ? "" : after.count >= FREE_SCAN_LIMIT ? c.yellow("  ← next scan needs an API key") : "")
    )
  );
  process.exitCode = failures;
}

function walkSol(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkSol(full));
    else if (entry.name.endsWith(".sol")) out.push(full);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const [, , cmd, ...args] = process.argv;
  switch (cmd) {
    case "scan":
      await cmdScan(args);
      break;
    case "login":
      await cmdLogin();
      break;
    case "status":
      await cmdStatus();
      break;
    case "update":
      await checkForUpdates({ ...loadConfig(), version_check_at: null });
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      break;
    default:
      console.error(c.red(`  unknown command: ${cmd} — try 'securithm help'`));
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(c.red("  fatal: " + (err?.message ?? String(err))));
  process.exitCode = 1;
});
