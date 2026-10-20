#!/usr/bin/env node
// Publishing commands. Run from the repo root:
//   node publisher/cli.mjs check      validate everything; fail if built files are out of date (CI runs this)
//   node publisher/cli.mjs dry-run    what would be published or blocked, and why (add --md FILE to save)
//   node publisher/cli.mjs diff       files a build would add, change or remove
//   node publisher/cli.mjs build      write published pages, redirect stubs and sitemap.xml
//   node publisher/cli.mjs preview    render every non-retired record into .preview/ (noindex, never committed)
//   node publisher/cli.mjs hash ID    the current version hash of one record
//   node publisher/cli.mjs approve ID Chris only: records an approval for the current version (interactive)

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import readline from "node:readline/promises";
import { plan, evaluate, versionHash, decisionOf, renderPage, routeOf, mainText, GENERATED_MARK, RUBRIC } from "./lib.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const C = path.join(ROOT, "content");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const today = new Date().toISOString().slice(0, 10);

export function loadContext() {
  const families = readJson(path.join(C, "families.json"));
  const corePages = readJson(path.join(C, "core-pages.json")).map((p) => ({
    ...p, text: p.file && fs.existsSync(path.join(ROOT, p.file)) ? mainText(fs.readFileSync(path.join(ROOT, p.file), "utf8")) : "",
  }));
  const dir = path.join(C, "records");
  const records = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => {
    const r = readJson(path.join(dir, f));
    if (`${r.id}.json` !== f) throw new Error(`${f}: file name must match its id ("${r.id}")`);
    return r;
  });
  const approvals = readJson(path.join(C, "approvals.json"));
  return {
    families, corePages, records, approvals, today,
    fileExists: (src) => fs.existsSync(path.join(ROOT, src.replace(/^\//, ""))),
  };
}

// Generated pages on disk, found by their marker (hand-written pages are never touched).
function generatedOnDisk(ctx) {
  const out = [];
  for (const fam of Object.values(ctx.families)) {
    const base = path.join(ROOT, fam.route);
    if (!fs.existsSync(base)) continue;
    for (const slug of fs.readdirSync(base)) {
      const f = path.join(base, slug, "index.html");
      if (fs.existsSync(f) && fs.readFileSync(f, "utf8").includes(GENERATED_MARK)) out.push(path.relative(ROOT, f));
    }
  }
  return out;
}

function diff(ctx) {
  const { results, files } = plan(ctx);
  const changes = [];
  for (const [rel, content] of files) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) changes.push({ op: "add", rel });
    else if (fs.readFileSync(abs, "utf8") !== content) changes.push({ op: "change", rel });
  }
  for (const rel of generatedOnDisk(ctx)) if (!files.has(rel)) changes.push({ op: "remove", rel });
  return { results, files, changes };
}

function report(results, ctx, { markdown = false } = {}) {
  const rows = results.map((x) => {
    const r = ctx.records.find((o) => o.id === x.id);
    const reasons = [...x.errors.map((e) => `${e.gate}: ${e.msg}`), ...x.approvalProblems.map((m) => `approval: ${m}`)];
    if (!x.eligible && !x.approval && r.status !== "retired") reasons.push("approval: none yet (Chris reads the preview, then runs approve)");
    return { id: x.id, route: x.route, status: x.status, decision: decisionOf(x), reasons, flags: x.flags, tasks: r.editorialTasks || [] };
  });
  if (!markdown) {
    for (const row of rows) {
      console.log(`\n${row.decision.padEnd(28)} ${row.id}  (${row.status})  ${row.route}`);
      for (const m of row.reasons) console.log(`   ✗ ${m}`);
      for (const f of row.flags) console.log(`   ⚑ ${f}`);
    }
    return rows;
  }
  const lines = [`# Publishing dry run`, ``, `Generated ${today} by \`node publisher/cli.mjs dry-run\`. Nothing was published.`, ``,
    `| Record | Status | Decision | Route |`, `|---|---|---|---|`,
    ...rows.map((r) => `| \`${r.id}\` | ${r.status} | **${r.decision}** | \`${r.route}\` |`), ``];
  for (const r of rows) {
    lines.push(`## ${r.id}`, ``, `- **Decision:** ${r.decision}`);
    if (r.reasons.length) lines.push(`- **Why not:**`, ...r.reasons.map((m) => `  - ${m}`));
    if (r.flags.length) lines.push(`- **Flags for a human:**`, ...r.flags.map((m) => `  - ${m}`));
    if (r.tasks.length) lines.push(`- **Editorial tasks:**`, ...r.tasks.map((m) => `  - ${m}`));
    lines.push(``);
  }
  return lines.join("\n");
}

function approvalAuthorCheck() {
  // Approvals are a human act. Refuse any approvals.json last changed by a Claude commit.
  try {
    const email = execFileSync("git", ["log", "-1", "--format=%ae", "--", "content/approvals.json"], { cwd: ROOT, encoding: "utf8" }).trim();
    const ctx = loadContext();
    if (ctx.approvals.length && /noreply@anthropic\.com/i.test(email)) return `content/approvals.json was last changed by an AI commit (${email})`;
  } catch { /* not a git checkout: nothing to check */ }
  return null;
}

async function main(argv) {
  const [cmd, arg] = argv;
  const ctx = loadContext();
  if (cmd === "hash") {
    const r = ctx.records.find((o) => o.id === arg);
    if (!r) throw new Error(`no record "${arg}"`);
    console.log(versionHash(r));
    return 0;
  }
  if (cmd === "dry-run") {
    const { results, changes } = diff(ctx);
    const i = argv.indexOf("--md");
    if (i > -1) { fs.writeFileSync(path.resolve(argv[i + 1]), report(results, ctx, { markdown: true }) + "\n"); console.log(`written ${argv[i + 1]}`); }
    else report(results, ctx);
    console.log(`\nfiles a build would touch: ${changes.length ? changes.map((c) => `${c.op} ${c.rel}`).join(", ") : "none"}`);
    return 0;
  }
  if (cmd === "diff") {
    const { changes } = diff(ctx);
    if (!changes.length) console.log("no changes");
    for (const c of changes) console.log(`${c.op.padEnd(7)} ${c.rel}`);
    return 0;
  }
  if (cmd === "build") {
    const { changes, files } = diff(ctx);
    for (const c of changes) {
      const abs = path.join(ROOT, c.rel);
      if (c.op === "remove") { fs.rmSync(abs); try { fs.rmdirSync(path.dirname(abs)); } catch {} }
      else { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, files.get(c.rel)); }
      console.log(`${c.op.padEnd(7)} ${c.rel}`);
    }
    if (!changes.length) console.log("nothing to do");
    return 0;
  }
  if (cmd === "preview") {
    const out = path.join(ROOT, ".preview");
    fs.rmSync(out, { recursive: true, force: true });
    for (const r of ctx.records.filter((o) => o.status !== "retired")) {
      const rel = routeOf(r, ctx.families);
      if (!rel) continue;
      fs.mkdirSync(path.join(out, rel), { recursive: true });
      fs.writeFileSync(path.join(out, rel, "index.html"), renderPage(r, ctx, { preview: true }));
      console.log(`preview  .preview${rel}`);
    }
    console.log("\nServe the repo root locally (e.g. python3 -m http.server 8000) and open http://localhost:8000/.preview/…");
    return 0;
  }
  if (cmd === "check") {
    const { results, changes } = diff(ctx);
    const problems = [];
    for (const x of results) {
      if (x.status === "published" && !x.eligible) problems.push(`${x.id} is marked published but fails: ${[...x.errors.map((e) => e.msg), ...x.approvalProblems].join("; ")}`);
    }
    for (const c of changes) problems.push(`out of date: ${c.op} ${c.rel} (run: node publisher/cli.mjs build)`);
    const author = approvalAuthorCheck();
    if (author) problems.push(author);
    report(results, ctx);
    if (problems.length) { console.error(`\n✗ ${problems.length} problem(s):\n- ${problems.join("\n- ")}`); return 1; }
    console.log(`\n✓ ${results.length} record(s) checked; built files are up to date`);
    return 0;
  }
  if (cmd === "approve") {
    // Interactive on purpose: an automated session can't type the confirmation.
    if (!process.stdin.isTTY || process.env.CLAUDECODE) throw new Error("approve must be run by Chris in his own terminal");
    const r = ctx.records.find((o) => o.id === arg);
    if (!r) throw new Error(`no record "${arg}"`);
    const x = evaluate(r, ctx);
    if (x.errors.length) throw new Error(`can't approve: ${x.errors.map((e) => e.msg).join("; ")}`);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(`Approving ${r.id} at version ${versionHash(r).slice(0, 12)}. Read the preview first: node publisher/cli.mjs preview`);
    const reviewer = (await rl.question("Your full name: ")).trim();
    const rubric = {};
    for (const k of RUBRIC) rubric[k] = (await rl.question(`${k} — pass? (y/n) `)).trim().toLowerCase() === "y" ? "pass" : "fail";
    const ack = x.flags.length ? ((await rl.question(`Acknowledge flags (${x.flags.join(", ")})? (y/n) `)).trim().toLowerCase() === "y" ? x.flags : []) : [];
    const notes = (await rl.question("Notes (optional): ")).trim();
    const confirm = (await rl.question(`Type the record id to confirm: `)).trim();
    rl.close();
    if (confirm !== r.id) throw new Error("not confirmed");
    ctx.approvals.push({ id: r.id, versionHash: versionHash(r), reviewer, date: today, rubric, acknowledgedFlags: ack, notes });
    fs.writeFileSync(path.join(C, "approvals.json"), JSON.stringify(ctx.approvals, null, 2) + "\n");
    console.log(`Recorded. To publish: set "status": "published" in content/records/${r.id}.json, then run build.`);
    return 0;
  }
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 10).join("\n"));
  return cmd ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
