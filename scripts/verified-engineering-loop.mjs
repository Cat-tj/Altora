#!/usr/bin/env node
/**
 * Altora Verified Engineering Loop runner.
 *
 * Runs one bounded slice at a time. It never claims completion: every slice
 * writes evidence and stops on the first failed gate.
 *
 * Usage:
 *   node scripts/verified-engineering-loop.mjs --list
 *   node scripts/verified-engineering-loop.mjs --run baseline
 *   node scripts/verified-engineering-loop.mjs --run all
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const stateDir = resolve(root, ".engineering-loop");
const statePath = resolve(stateDir, "state.json");
const evidenceDir = resolve(stateDir, "evidence");

const slices = [
  {
    id: "baseline",
    title: "Repository baseline gates",
    commands: [
      ["npm", ["run", "check:boundaries"]],
      ["npm", ["run", "check-types"]],
      ["npm", ["run", "test"]],
    ],
  },
  {
    id: "service-runtime",
    title: "Altora Service runtime",
    commands: [["npm", ["run", "build", "--workspace=@altora/service"]]],
  },
  {
    id: "service-database-contracts",
    title: "Altora Service PostgreSQL persistence",
    commands: [
      ["env", ["DATABASE_URL=postgresql://altora:altora@127.0.0.1:5432/altora_market_ci", "npm", "run", "db:migrate", "--workspace=@altora/service"]],
      ["npm", ["run", "check-types", "--workspace=@altora/service"]],
      ["env", ["DATABASE_URL=postgresql://altora:altora@127.0.0.1:5432/altora_market_ci", "node", "apps/service/scripts/service-persistence-contract.mjs"]],
    ],
  },
  {
    id: "inventory-contracts",
    title: "Inventory core contracts",
    commands: [["npm", ["run", "test", "--workspace=@altora/inventory-core"]]],
  },
  {
    id: "all-app-builds",
    title: "All application production builds",
    commands: [["npm", ["run", "build"]]],
  },
  {
    id: "all-workspace-tests",
    title: "All workspace contract and unit tests",
    commands: [["npm", ["run", "test"]]],
  },
  {
    id: "tenant-isolation",
    title: "Tenant isolation contracts",
    commands: [["node", ["--test", "packages/db/src/tenant.test.mjs"]]],
  },
  {
    id: "database-contracts",
    title: "Market and Resto PostgreSQL migrations",
    commands: [
      ["env", ["DATABASE_URL=postgresql://altora:altora@127.0.0.1:5432/altora_market_ci", "npm", "run", "db:migrate", "--workspace=@altora/market"]],
      ["env", ["DATABASE_URL=postgresql://altora:altora@127.0.0.1:5432/altora_resto_dev", "npm", "run", "db:migrate", "--workspace=@altora/resto"]],
    ],
  },
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function loadState() {
  if (!existsSync(statePath)) return { version: 1, slices: {} };
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function saveState(state) {
  await mkdir(stateDir, { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
}

function run(command, args) {
  return new Promise((resolveRun) => {
    const startedAt = new Date().toISOString();
    const child = spawn(command, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code, signal) => resolveRun({
      command: [command, ...args].join(" "),
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: code,
      signal,
      stdout,
      stderr,
    }));
  });
}

const mode = arg("--run");
if (process.argv.includes("--list")) {
  for (const slice of slices) console.log(`${slice.id}: ${slice.title}`);
  process.exit(0);
}
if (!mode) {
  console.error("Usage: --list | --run <slice-id|all>");
  process.exit(2);
}

const selected = mode === "all" ? slices : slices.filter((slice) => slice.id === mode);
if (!selected.length) {
  console.error(`Unknown slice: ${mode}`);
  process.exit(2);
}

const state = await loadState();
for (const slice of selected) {
  const evidence = { slice: slice.id, title: slice.title, status: "running", startedAt: new Date().toISOString(), commands: [] };
  await mkdir(evidenceDir, { recursive: true });
  for (const [command, args] of slice.commands) {
    const result = await run(command, args);
    evidence.commands.push(result);
    if (result.exitCode !== 0) {
      evidence.status = "blocked";
      evidence.finishedAt = new Date().toISOString();
      state.slices[slice.id] = { status: "blocked", evidence: `evidence/${slice.id}.json`, updatedAt: evidence.finishedAt };
      await writeFile(resolve(evidenceDir, `${slice.id}.json`), JSON.stringify(evidence, null, 2) + "\n");
      await saveState(state);
      console.error(`BLOCKED: ${slice.id} at ${result.command} (exit ${result.exitCode})`);
      process.exit(result.exitCode || 1);
    }
  }
  evidence.status = "passed";
  evidence.finishedAt = new Date().toISOString();
  state.slices[slice.id] = { status: "passed", evidence: `evidence/${slice.id}.json`, updatedAt: evidence.finishedAt };
  await writeFile(resolve(evidenceDir, `${slice.id}.json`), JSON.stringify(evidence, null, 2) + "\n");
  await saveState(state);
  console.log(`PASS: ${slice.id}`);
}
console.log(`Evidence directory: ${evidenceDir}`);
