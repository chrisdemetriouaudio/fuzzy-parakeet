#!/usr/bin/env node
/**
 * Writes chrisdemetriou-PMO/00 Start here/Live status.md: whether each site answers,
 * which build it runs, open pull requests and the latest changes on main.
 * Run by .github/workflows/pmo-status.yml (every change to main, pull requests
 * opening or closing, and every 15 minutes); Obsidian Git pulls it into the vault.
 * The file is only rewritten when something in it has really changed.
 *
 *   GH_TOKEN=$(gh auth token) node .github/scripts/pmo-status.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "chrisdemetriou-PMO", "00 Start here", "Live status.md");
const REPO = process.env.REPO || "chrisdemetriouaudio/fuzzy-parakeet";
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const QUIET = /^(docs\(pmo\): (vault backup|live status)|Merge (pull request|branch))/;

const ukDate = (iso, time = false) => new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) });
const cell = (s) => String(s).replace(/\|/g, "/").replace(/\s+/g, " ").trim();

async function get(url, opts = {}) {
  try {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000), headers: { "cache-control": "no-cache", "user-agent": "pmo-status" }, ...opts });
    const type = r.headers.get("content-type") || "";
    return { status: r.status, json: type.includes("json") ? await r.json().catch(() => null) : null };
  } catch { return { status: 0, json: null }; }
}
const github = (path) => get(`https://api.github.com/repos/${REPO}${path}`, { headers: { accept: "application/vnd.github+json", "user-agent": "pmo-status", ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) } });
const answer = (s) => (s === 200 ? "✅ 200" : s === 0 ? "🔴 no answer" : `🔴 ${s}`);

const [site, labs, labsVersion, genesis, genesisVersion, pages, pulls, commits] = await Promise.all([
  get("https://chrisdemetriou.com/"),
  get("https://labs.chrisdemetriou.com/"),
  get(`https://labs.chrisdemetriou.com/version.json?t=${Date.now()}`),
  get("https://genesis.labs.chrisdemetriou.com/"),
  get(`https://genesis.labs.chrisdemetriou.com/version.json?t=${Date.now()}`),
  github("/pages/builds/latest"),
  github("/pulls?state=open&per_page=20"),
  github("/commits?sha=main&per_page=40"),
]);

const pagesBuild = pages.json?.commit ? `main \`${pages.json.commit.slice(0, 7)}\` (GitHub Pages: ${pages.json.status})` : "GitHub Pages";
const lv = labsVersion.json;
const gv = genesisVersion.json;
const rows = [
  ["chrisdemetriou.com", answer(site.status), pagesBuild],
  ["labs.chrisdemetriou.com", answer(labs.status), lv?.sha ? `\`${lv.sha}\`${lv.at ? `, released ${ukDate(lv.at)}` : ""}` : "not stamped yet"],
  ["genesis.labs.chrisdemetriou.com", answer(genesis.status), gv?.sha ? `\`${gv.sha}\`, ${gv.same ? "same build as the band app ✅" : "different from the band app 🔴"}` : "unknown"],
];
const down = rows.filter((r) => !r[1].startsWith("✅")).map((r) => r[0]);
if (pages.json?.status === "errored") down.push("GitHub Pages build");

const prs = Array.isArray(pulls.json) ? pulls.json : [];
const changes = (Array.isArray(commits.json) ? commits.json : [])
  .filter((c) => !QUIET.test(c.commit.message))
  .slice(0, 10)
  .map((c) => `- ${ukDate(c.commit.committer.date)} · \`${c.sha.slice(0, 7)}\` · ${cell(c.commit.message.split("\n")[0])}`);

const body = `# 🟢 Live status

> [!info] At a glance
> **This page writes itself.** Don't edit it: changes are overwritten.
> **Everything answering:** ${down.length ? `🔴 no: ${down.join(", ")}` : "✅ yes"}
> **Open pull requests:** ${prs.length}
> **Back to:** [[00 Dashboard]]

## 🌐 Sites

| Site | Answers | Build |
|---|---|---|
${rows.map((r) => `| ${r.join(" | ")} |`).join("\n")}

## 🔀 Open pull requests

${prs.length ? prs.map((p) => `- 👉 **#${p.number} ${cell(p.title)}**: opened ${ukDate(p.created_at)}${p.draft ? " (draft)" : ""}`).join("\n") : "- None."}

## 🕑 Latest changes on main

${changes.length ? changes.join("\n") : "- Couldn't read them this time."}
`;

const old = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
const oldBody = old.replace(/^---[\s\S]*?---\n\n/, "");
if (oldBody === body) { console.log("Live status: no change"); process.exit(0); }
const now = new Date().toISOString();
writeFileSync(OUT, `---\ntitle: Live status\nupdated: ${now.slice(0, 10)}\nchanged: ${ukDate(now, true)} (UK time)\n---\n\n${body}`);
console.log(`Live status: updated (${down.length ? `down: ${down.join(", ")}` : "all answering"}; ${prs.length} open PRs)`);
