// URL-parity check: does an address serve the site exactly as the repo has it?
//   npm run parity -- https://chrisdemetriou-site.<you>.workers.dev
//   npm run parity -- https://chrisdemetriou.com        (after the move; also checks www and http)
// Checks every published file byte for byte, the redirects, the 404 page, that private
// files stay private, the security headers and the showreel's byte ranges.
import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { ROOT, publishedFiles, urlFor } from "./site-files.mjs";

const base = (process.argv[2] || "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("Usage: npm run parity -- <address>, e.g. https://chrisdemetriou-site.<you>.workers.dev");
  process.exit(2);
}
const VIDEO = "video/chrisdemetriou_musicREEL_FINAL2026.mp4";
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const get = (path, init = {}) => fetch(base + path, { redirect: "manual", ...init });
let failed = 0;
function row(ok, what, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✅" : "❌"} ${what}${detail ? `  (${detail})` : ""}`);
}

// 1. Every site file, byte for byte (404.html is checked in step 3: the asset server
//    serves it for unknown addresses, and sends /404.html itself on to /404)
const files = publishedFiles().filter((f) => f !== "404.html");
const wrong = [];
for (const f of files) {
  const res = await get(urlFor(f));
  const body = Buffer.from(await res.arrayBuffer());
  if (res.status !== 200 || sha(body) !== sha(readFileSync(join(ROOT, f)))) wrong.push(`${urlFor(f)} → ${res.status}`);
}
row(wrong.length === 0, `${files.length - wrong.length} of ${files.length} site files match the repo`, wrong.join(", "));

// 2. Missing trailing slash: a permanent redirect, as on GitHub Pages
for (const [from, to] of [["/creative", "/creative/"], ["/privacy", "/privacy/"], ["/cookies", "/cookies/"], ["/index.html", "/"]]) {
  const res = await get(from);
  const loc = res.headers.get("location");
  row(res.status === 301 && loc && new URL(loc, base).pathname === to, `${from} → 301 ${to}`, `${res.status} ${loc || ""}`);
}

// 3. Unknown address: the site's own 404 page
{
  const res = await get("/no-such-page-" + Date.now());
  const same = sha(Buffer.from(await res.arrayBuffer())) === sha(readFileSync(join(ROOT, "404.html")));
  row(res.status === 404 && same, "Unknown address → 404 with 404.html", `${res.status}${same ? "" : ", different page"}`);
}

// 4. Private files stay private
const PRIVATE = ["/AGENTS.md", "/CLAUDE.md", "/CNAME", "/_config.yml", "/wrangler.jsonc", "/package.json", "/.assetsignore",
  "/docs/PMO.md", "/chrisdemetriou-PMO/00%20Start%20here/00%20Dashboard.md", "/content/approvals.json",
  "/publisher/cli.mjs", "/labs/projects.json", "/worker/index.js", "/node_modules/wrangler/package.json", "/.git/config"];
const leaked = [];
for (const p of PRIVATE) if ((await get(p)).status !== 404) leaked.push(p);
row(leaked.length === 0, `${PRIVATE.length} private files answer 404`, leaked.join(", "));

// 5. Security headers
for (const page of ["/", "/creative/"]) {
  const h = (await get(page)).headers;
  const missing = ["content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "referrer-policy"]
    .filter((k) => !h.get(k));
  row(missing.length === 0, `Security headers on ${page}`, missing.length ? "missing " + missing.join(", ") : "");
}
if (base.includes(".workers.dev")) {
  row((await get("/")).headers.get("x-robots-tag") === "noindex", "Preview address is hidden from search (noindex)");
}

// 6. The showreel, from R2, with byte ranges
{
  const local = join(ROOT, VIDEO);
  const head = await get("/" + VIDEO, { method: "HEAD" });
  const size = Number(head.headers.get("content-length"));
  const expected = existsSync(local) ? statSync(local).size : size;
  row(head.status === 200 && head.headers.get("accept-ranges") === "bytes" && size > 0 && size === expected,
    "Showreel is there and seekable", `${head.status}, ${size} bytes`);
  const part = await get("/" + VIDEO, { headers: { range: "bytes=0-1023" } });
  const body = Buffer.from(await part.arrayBuffer());
  const match = !existsSync(local) || sha(body) === sha(readFileSync(local).subarray(0, 1024));
  row(part.status === 206 && body.length === 1024 && match && part.headers.get("content-range") === `bytes 0-1023/${size}`,
    "Showreel answers a byte range (206)", `${part.status} ${part.headers.get("content-range") || ""}`);
}

// 7. On the real address: www and http redirect, and Cloudflare is serving it
if (base === "https://chrisdemetriou.com") {
  for (const from of ["https://www.chrisdemetriou.com/privacy/", "http://chrisdemetriou.com/privacy/"]) {
    const res = await fetch(from, { redirect: "manual" });
    row(res.status === 301 && res.headers.get("location") === "https://chrisdemetriou.com/privacy/", `${from} → 301`, `${res.status} ${res.headers.get("location") || ""}`);
  }
  row(/cloudflare/i.test((await get("/")).headers.get("server") || ""), "Served by Cloudflare, not GitHub");
}

console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
