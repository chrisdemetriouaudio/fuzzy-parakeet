// The site Worker's pure parts: what goes live, the CSP, and byte ranges.
// Run with `npm test` (it builds worker/csp-hashes.js first).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ROOT, allowlist, publishedFiles, inlineScripts, urlFor } from "../site-files.mjs";
import { csp } from "../headers.js";
import { span } from "../media.js";

const published = new Set(publishedFiles());

test("publishes exactly what GitHub Pages published, minus CNAME and the showreel", () => {
  // Jekyll's rules: skip names starting with "." or "_" and anything in _config.yml's exclude list.
  const config = readFileSync(join(ROOT, "_config.yml"), "utf8");
  const exclude = [...config.matchAll(/^\s+-\s+(\S+)\s*$/gm)].map((m) => m[1].replace(/\/$/, ""));
  const pages = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" })
    .split("\0").filter(Boolean)
    .filter((f) => !f.split("/").some((part) => /^[._]/.test(part)))
    .filter((f) => !exclude.some((x) => f === x || f.startsWith(x + "/")))
    .filter((f) => f !== "CNAME" && !f.startsWith("video/"));
  const missing = pages.filter((f) => !published.has(f));
  assert.deepEqual(missing, [], "on GitHub Pages but not in .assetsignore");
  const tracked = new Set(pages);
  const extra = [...published].filter((f) => !tracked.has(f) && !f.startsWith("work/") && !f.startsWith("resources/"));
  assert.deepEqual(extra, [], "in .assetsignore but not a site file");
});

test("never publishes the repo's private folders and files", () => {
  for (const f of published) {
    assert.doesNotMatch(f, /^(chrisdemetriou-PMO|content|publisher|docs|labs|worker|migrations|node_modules|video|\.git|\.github)\//, f);
    assert.doesNotMatch(f, /^(AGENTS\.md|CLAUDE\.md|README\.md|CNAME|_config\.yml|wrangler\.jsonc|vitest\.config\.mjs|package(-lock)?\.json|\.assetsignore)$/, f);
  }
  assert.ok(published.has("index.html") && published.has("404.html"));
});

test(".assetsignore rejects anything but the simple allowlist shape", () => {
  assert.deepEqual(allowlist("/*\n# note\n!/a.html\n!/b/\n.DS_Store\n._*\n"), ["a.html", "b/"]);
  assert.throws(() => allowlist("!/a.html\n"));
  assert.throws(() => allowlist("/*\n._*\n!/late.html\n"));
  assert.throws(() => allowlist("/*\n!/b/*.js\n"));
  assert.throws(() => allowlist("/*\nsecret/\n"));
});

test("finds the inline scripts a browser runs, and skips data blocks and files", () => {
  const html = '<script>a()</script><script src="/x.js"></script><script type="application/ld+json">{}</script><script type="module">b()</script>\r\n<script>c()\r\n</script>';
  assert.deepEqual(inlineScripts(html), ["a()", "b()", "c()\n"]);
  assert.equal(urlFor("creative/index.html"), "/creative/");
  assert.equal(urlFor("index.html"), "/");
  assert.equal(urlFor("styles/page.css"), "/styles/page.css");
});

test("every inline script on every page is allowed by its hash", () => {
  for (const f of [...published].filter((f) => f.endsWith(".html"))) {
    const policy = csp(urlFor(f));
    for (const code of inlineScripts(readFileSync(join(ROOT, f), "utf8"))) {
      const h = createHash("sha256").update(code, "utf8").digest("base64");
      assert.ok(policy.includes(`'sha256-${h}'`), `${f}: inline script not in the CSP`);
    }
  }
});

test("the CSP is strict everywhere and widened only where a page needs it", () => {
  const dir = (policy, name) => (policy.split("; ").find((d) => d.startsWith(name + " ")) || "").split(" ").slice(1);
  for (const page of ["/", "/creative/", "/privacy/", "/cookies/", "/404.html", "/portal/"]) {
    const p = csp(page);
    assert.deepEqual(dir(p, "default-src"), ["'none'"]);
    assert.deepEqual(dir(p, "frame-ancestors"), ["'none'"]);
    assert.deepEqual(dir(p, "base-uri"), ["'none'"]);
    assert.ok(!/'unsafe-(inline|eval)'|\*/.test(dir(p, "script-src").join(" ")), `${page}: loose script-src`);
    assert.ok(dir(p, "script-src").includes("https://challenges.cloudflare.com"), `${page}: Turnstile script`);
    assert.ok(dir(p, "frame-src").includes("https://challenges.cloudflare.com"), `${page}: Turnstile frame`);
    assert.ok(dir(p, "connect-src").includes("'self'"), `${page}: chat API`);
  }
  assert.ok(dir(csp("/"), "connect-src").includes("https://api.web3forms.com"));
  assert.ok(dir(csp("/"), "form-action").includes("https://api.web3forms.com"));
  assert.ok(!dir(csp("/privacy/"), "form-action").includes("https://api.web3forms.com"));
  assert.ok(dir(csp("/creative/"), "frame-src").includes("https://w.soundcloud.com"));
  assert.ok(!dir(csp("/"), "frame-src").includes("https://w.soundcloud.com"));
  assert.deepEqual(dir(csp("/creative/"), "media-src"), ["'self'"]);
});

test("works out the bytes in a range R2 reports", () => {
  assert.deepEqual(span({ offset: 0, length: 1024 }, 5000), { start: 0, end: 1023 });
  assert.deepEqual(span({ offset: 4000 }, 5000), { start: 4000, end: 4999 });
  assert.deepEqual(span({ suffix: 500 }, 5000), { start: 4500, end: 4999 });
  assert.deepEqual(span({ suffix: 9000 }, 5000), { start: 0, end: 4999 });
  assert.deepEqual(span({ offset: 4900, length: 500 }, 5000), { start: 4900, end: 4999 });
});

test("the deploy workflow runs for every published path", () => {
  const yml = readFileSync(join(ROOT, ".github/workflows/deploy-site.yml"), "utf8");
  const watched = [...yml.matchAll(/^\s+-\s+"([^"]+)"\s*$/gm)].map((m) => m[1]);
  const missing = allowlist().filter((entry) => !watched.includes(entry.endsWith("/") ? `${entry}**` : entry));
  assert.deepEqual(missing, [], "add these to the paths in deploy-site.yml");
  for (const f of ["worker/**", "wrangler.jsonc", ".assetsignore", "package-lock.json"]) assert.ok(watched.includes(f), f);
});

test("the Worker redirects www and http, and only marks non-live addresses noindex", async () => {
  const { default: worker } = await import("../index.js");
  const seen = [];
  const env = {
    ASSETS: {
      fetch: async (req) => {
        seen.push(new URL(req.url).pathname);
        if (new URL(req.url).pathname === "/privacy") return new Response(null, { status: 307, headers: { location: "/privacy/" } });
        if (new URL(req.url).pathname === "/gone") return new Response("<p>404</p>", { status: 404, headers: { "content-type": "text/html" } });
        return new Response("<p>ok</p>", { headers: { "content-type": "text/html; charset=utf-8" } });
      },
    },
  };
  const go = (url) => worker.fetch(new Request(url), env);

  let res = await go("https://www.chrisdemetriou.com/privacy/?a=1");
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://chrisdemetriou.com/privacy/?a=1");
  res = await go("http://chrisdemetriou.com/cookies/");
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://chrisdemetriou.com/cookies/");
  assert.deepEqual(seen, [], "redirects never reach the assets");

  res = await go("https://chrisdemetriou.com/");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-robots-tag"), null);
  assert.match(res.headers.get("content-security-policy"), /connect-src 'self' https:\/\/api\.web3forms\.com/);
  assert.equal(res.headers.get("x-frame-options"), "DENY");

  res = await go("https://preview.chrisdemetriou.com/");
  assert.equal(res.headers.get("x-robots-tag"), "noindex");

  res = await go("https://chrisdemetriou.com/privacy");
  assert.equal(res.status, 301, "trailing slash is permanent");
  assert.equal(res.headers.get("location"), "/privacy/");

  res = await go("https://chrisdemetriou.com/gone");
  assert.equal(res.status, 404);
  assert.doesNotMatch(res.headers.get("content-security-policy"), /form-action[^;]*web3forms/, "404 page gets the plain policy");
});
