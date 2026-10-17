#!/usr/bin/env node
/**
 * npm run release — release labs.chrisdemetriou.com:
 *
 *   1. checks: on main, nothing uncommitted (PMO notes and card pictures aside),
 *      the same as GitHub's main, and the tests pass;
 *   2. build: the page from projects.json plus each project's live details
 *      (Genesis's labs.json from its demo, this website's own files);
 *   3. deploy the Worker "demo-hub", stamped with the commit and time (/version.json);
 *   4. smoke test: Labs answers, reports this build, the old address forwards,
 *      and every project it links to answers.
 *
 * Prints the rollback command at the end.   --dry-run: checks and build only.
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LABS_URL = "https://labs.chrisdemetriou.com";
const OLD_URL = "https://demo.chrisdemetriou.com/";
const DRY = process.argv.includes("--dry-run");

const sh = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const run = (cmd, args) => { execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit" }); };
const step = (s) => console.log(`\n▶ ${s}`);
const fail = (s) => { console.error(`\n✗ ${s}\n`); process.exit(1); };
const must = (s) => (DRY ? console.log(`  ⚠ ${s} (dry run: continuing)`) : fail(s));

// ---------------------------------------------------------------- 1. checks
step("Checks");
const branch = sh("git", ["branch", "--show-current"]);
if (branch !== "main") must(`Release from main (you're on ${branch}).`);
// The PMO vault saves itself, and the build refreshes card pictures: neither counts.
const IGNORED = ["chrisdemetriou-PMO/", "labs/public/img/"];
const dirty = sh("git", ["status", "--porcelain"]).split("\n").filter((l) => l.trim() && !l.startsWith("??") && !IGNORED.some((g) => l.includes(g)));
if (dirty.length) must(`Uncommitted changes:\n${dirty.join("\n")}`);
sh("git", ["fetch", "-q", "origin", "main"]);
if (sh("git", ["rev-parse", "HEAD"]) !== sh("git", ["rev-parse", "origin/main"])) must("Local main isn't the same as GitHub's main. Pull first.");
run("npm", ["test", "--silent"]);
const SHA = sh("git", ["rev-parse", "--short", "HEAD"]);
const AT = new Date().toISOString();

// ---------------------------------------------------------------- 2. build
step("Build");
run("node", ["scripts/build.mjs"]);
if (DRY) { run("npx", ["wrangler", "deploy", "--dry-run", "--outdir", "dist/dryrun"]); console.log("\n(dry run: nothing deployed)"); process.exit(0); }

// ---------------------------------------------------------------- 3. deploy
const previous = (sh("npx", ["wrangler", "deployments", "list"]).match(/\(100%\) ([0-9a-f-]{36})/g) || []).pop()?.slice(7);
step("Release Labs");
run("npx", ["wrangler", "deploy", "--var", `BUILD_SHA:${SHA}`, "--var", `BUILD_AT:${AT}`]);

// ---------------------------------------------------------------- 4. smoke test
step("Smoke test");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url, opts = {}) => {
  for (let i = 0; i < 12; i++) {
    try { return await fetch(url, { headers: { "cache-control": "no-cache" }, ...opts }); } catch { await wait(5000); }
  }
  return null;
};
let ok = true;
const page = await get(`${LABS_URL}/`);
console.log(`  labs: ${page?.status ?? "not reachable"}`); if (page?.status !== 200) ok = false;
let v = null;
for (let i = 0; i < 6; i++) { v = await (await get(`${LABS_URL}/version.json?t=${Date.now()}`))?.json().catch(() => null); if (v?.sha === SHA) break; await wait(5000); }
console.log(`  version: ${v?.sha} → ${v?.sha === SHA ? "this build ✓" : "NOT this build ✗"}`); if (v?.sha !== SHA) ok = false;
const old = await get(OLD_URL, { redirect: "manual" });
console.log(`  old address: ${old?.status} → ${old?.headers.get("location")}`); if (old?.status !== 301) ok = false;
const { readProjects } = await import("./build.mjs");
for (const p of readProjects()) {
  const r = await get(p.url);
  console.log(`  ${p.slug}: ${r?.status ?? "not reachable"}`); if (r?.status !== 200) ok = false;
}
if (previous) console.log(`\nRollback if needed:  npx wrangler rollback ${previous}`);
if (!ok) fail("Smoke test failed — check the lines above.");
console.log(`\n✓ Released ${SHA} to labs.chrisdemetriou.com.`);
