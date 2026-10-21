// The files the Worker publishes: the repo, filtered by .assetsignore. The build, the tests
// and the parity check all read the list from here, so they agree with what wrangler uploads.
// .assetsignore uses one simple shape: "/*" (ignore everything), then "!/name" for a file
// or "!/folder/" for a folder that goes live, then bare names ("._*") never published
// anywhere, such as the files macOS leaves behind. Anything else in it is rejected.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

function rules(text = readFileSync(join(ROOT, ".assetsignore"), "utf8")) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (lines[0] !== "/*") throw new Error('.assetsignore must start with "/*"');
  const allow = [], never = [];
  for (const l of lines.slice(1)) {
    if (/^!\/[^*?[\]!]+$/.test(l) && !never.length) allow.push(l.slice(2));
    else if (/^[^!/*?[\]][^/?[\]]*$/.test(l)) never.push(new RegExp("^" + l.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"));
    else throw new Error(`.assetsignore: unexpected line "${l}"`);
  }
  return { allow, never };
}

export function allowlist(text) {
  return rules(text).allow;
}

function walk(rel, never) {
  const abs = join(ROOT, rel);
  if (!statSync(abs).isDirectory()) return [rel];
  return readdirSync(abs).sort()
    .filter((name) => !never.some((re) => re.test(name)))
    .flatMap((name) => walk(join(rel, name), never));
}

// Every published file, as a path relative to the repo root ("creative/index.html").
export function publishedFiles() {
  const { allow, never } = rules();
  return allow
    .map((entry) => entry.replace(/\/$/, ""))
    .filter((entry) => existsSync(join(ROOT, entry)))
    .flatMap((entry) => walk(entry, never));
}

// The address a file is served at: folders' index.html files at the folder ("/creative/").
export function urlFor(file) {
  return "/" + file.replace(/(^|\/)index\.html$/, "$1");
}

// Inline scripts the browser runs (no src, and JavaScript rather than data like JSON-LD).
// The HTML parser turns CRLF into LF before the browser hashes a script, so do the same.
export function inlineScripts(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (type && !/^(text\/javascript|module)$/i.test(type)) continue;
    out.push(m[2].replace(/\r\n?/g, "\n"));
  }
  return out;
}
