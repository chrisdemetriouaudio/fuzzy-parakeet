#!/usr/bin/env node
/**
 * Builds the Labs home page from projects.json. It wears chrisdemetriou.com's
 * masthead, nav bar, fonts and colours (TECH is the current tab), and lists the
 * projects the way GitHub lists repositories: a header with the live link, the
 * screenshot, "built with" topic tags, an About panel with a languages bar, and
 * an architecture drawing underneath.
 * Output is plain HTML (no scripts), so it loads instantly and search engines
 * read it as-is. Also writes sitemap.xml and robots.txt.
 *
 *   node scripts/build.mjs
 *
 * Adding a project = adding one entry to projects.json (and its image in public/img/).
 * Projects can be built anywhere; the card's live details come from one of:
 *   - `manifest`: a labs.json the project publishes itself ({ sha, at, languages, image }),
 *     e.g. Genesis's demo writes one on every Genesis release. Its picture is copied
 *     into public/img/ (the page only loads pictures from its own address);
 *   - `source`: a folder in this repo, counted here (the website itself);
 *   - `github`: a public GitHub repository — GitHub's own languages and last push.
 * If a project can't be reached, its card keeps the picture it has and drops the bar.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://labs.chrisdemetriou.com";
const MAIN = "https://chrisdemetriou.com";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const NEW_WINDOW = `target="_blank" rel="noopener"`;
const NEW_WINDOW_SR = `<span class="sr"> (opens in a new window)</span>`;

// chrisdemetriou.com's sections, in its order; TECH is this site.
const NAV = [
  ["Biography", `${MAIN}/#biography`],
  ["Credits", `${MAIN}/#credits`],
  ["Media", `${MAIN}/#media`],
  ["Tech", "/"],
  ["Worship", `${MAIN}/#worship`],
  ["Contact", `${MAIN}/#contact`],
];

// GitHub's language colours, so the bar reads the way it does there.
const LANGUAGES = {
  ".ts": ["TypeScript", "#3178c6"],
  ".js": ["JavaScript", "#f1e05a"],
  ".mjs": ["JavaScript", "#f1e05a"],
  ".css": ["CSS", "#663399"],
  ".html": ["HTML", "#e34c26"],
  ".sql": ["SQL", "#e38c00"],
};
const GITHUB_COLOURS = Object.fromEntries(Object.values(LANGUAGES));
const NOT_OURS = /(^|\/)(vendor|previews|node_modules|dist|ds-bundle)\/|(^|\/)\.|\.min\./;
const fetchJson = async (url, headers = {}) => {
  const r = await fetch(url, { headers: { "cache-control": "no-cache", "user-agent": "labs-build", ...headers }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`${r.status} from ${url}`);
  return r.json();
};

/** Checks one projects.json entry; throws with a plain-English reason. No network. */
export function checkProject(p, root = ROOT) {
  for (const k of ["slug", "title", "description", "url", "image", "imageAlt", "topics", "architecture"]) if (!p[k]) throw new Error(`projects.json: "${p.slug || "?"}" is missing ${k}`);
  // New apps go on <project>.labs.chrisdemetriou.com; chrisdemetriou.com itself is listed as it is.
  if (!/^https:\/\/([a-z0-9-]+\.)*chrisdemetriou\.com\/$/.test(p.url)) throw new Error(`projects.json: ${p.slug} url must be on chrisdemetriou.com (new apps: https://<project>.labs.chrisdemetriou.com/)`);
  if (p.github && !/^[\w.-]+\/[\w.-]+$/.test(p.github)) throw new Error(`projects.json: ${p.slug} github must be "owner/repo"`);
  if (p.description.length > 140) throw new Error(`projects.json: ${p.slug} description is over 140 characters — keep it short`);
  if (!existsSync(join(root, "public", p.image))) throw new Error(`projects.json: ${p.slug} image ${p.image} not found in public/`);
  if (p.manifest && !/^https:\/\//.test(p.manifest)) throw new Error(`projects.json: ${p.slug} manifest must be an https:// address`);
}

export function readProjects(root = ROOT) {
  const list = JSON.parse(readFileSync(join(root, "projects.json"), "utf8"));
  for (const p of list) checkProject(p, root);
  return list;
}

/** The project list with each card's live details (languages, last update, build). */
export async function loadProjects(root = ROOT) {
  const list = readProjects(root);
  for (const p of list) {
    if (p.manifest) {
      const m = await fromManifest(p, root);
      p.languages = m.languages; p.updated = m.updated; p.build = m.build;
    } else if (p.source) {
      p.languages = countLanguages(join(root, p.source), p.exclude);
      p.updated = lastChange(join(root, p.source), p.exclude);
    } else if (p.github) {
      const gh = await fromGitHub(p.github);
      p.languages = gh.languages; p.updated = gh.updated;
    }
  }
  return list;
}

/** Share of the project's own code per language, by size — like GitHub's bar. */
export function countLanguages(dir, exclude = []) {
  let files;
  try { files = execFileSync("git", ["ls-files"], { cwd: dir, encoding: "utf8" }).split("\n"); }
  catch { return []; }
  const bytes = new Map();
  for (const f of files) {
    const lang = LANGUAGES[extname(f)];
    if (!lang || NOT_OURS.test(f) || exclude.some((x) => f.startsWith(x))) continue;
    let size = 0;
    try { size = statSync(join(dir, f)).size; } catch { continue; }
    const [name, colour] = lang;
    const cur = bytes.get(name) || { name, colour, size: 0 };
    cur.size += size;
    bytes.set(name, cur);
  }
  const total = [...bytes.values()].reduce((n, l) => n + l.size, 0);
  if (!total) return [];
  return [...bytes.values()].sort((a, b) => b.size - a.size).map((l) => ({ name: l.name, colour: l.colour, pct: (l.size / total) * 100 }));
}

/** Date of the last commit to a folder in this repo, leaving out `exclude`d subfolders. */
export function lastChange(dir, exclude = []) {
  try { return execFileSync("git", ["log", "-1", "--format=%cs", "--", ".", ...exclude.map((x) => `:!${x}`)], { cwd: dir, encoding: "utf8" }).trim() || undefined; }
  catch { return undefined; }
}

/** A project's own labs.json: its build, release date, languages and card picture. */
export async function fromManifest(p, root = ROOT) {
  try {
    const m = await fetchJson(p.manifest);
    if (m.image) {
      const r = await fetch(new URL(m.image, p.manifest), { signal: AbortSignal.timeout(15000) });
      if (r.ok && (r.headers.get("content-type") || "").startsWith("image/")) writeFileSync(join(root, "public", p.image), Buffer.from(await r.arrayBuffer()));
    }
    const languages = Array.isArray(m.languages) ? m.languages.filter((l) => l && typeof l.name === "string" && /^#[0-9a-f]{6}$/i.test(l.colour) && Number.isFinite(l.pct)) : [];
    return { languages, updated: typeof m.at === "string" ? m.at.slice(0, 10) : undefined, build: typeof m.sha === "string" ? m.sha.slice(0, 12) : undefined };
  } catch (e) {
    console.warn(`labs: couldn't read ${p.manifest} (${e.message}); keeping the current picture, no languages bar`);
    return {};
  }
}

/** A public repository's languages and last push, from GitHub's API. Offline: no bar, build date. */
export async function fromGitHub(repo) {
  const get = (path) => fetchJson(`https://api.github.com/repos/${repo}${path}`, { accept: "application/vnd.github+json" });
  try {
    const [langs, info] = await Promise.all([get("/languages"), get("")]);
    const total = Object.values(langs).reduce((n, b) => n + b, 0);
    const languages = Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([name, b]) => ({ name, colour: GITHUB_COLOURS[name] || "#8b949e", pct: (b / total) * 100 }));
    return { languages: total ? languages : [], updated: String(info.pushed_at || "").slice(0, 10) || undefined };
  } catch (e) {
    console.warn(`labs: couldn't reach GitHub for ${repo} (${e.message}); no languages bar this time`);
    return {};
  }
}

const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const host = (url) => new URL(url).host;

function renderLanguages(langs) {
  if (!langs || !langs.length) return "";
  let x = 0;
  // SVG attributes, not inline styles, so the strict CSP stays as it is.
  const rects = langs.map((l) => { const r = `<rect x="${x.toFixed(2)}" width="${l.pct.toFixed(2)}" height="8" fill="${l.colour}"/>`; x += l.pct; return r; }).join("");
  const legend = langs.map((l) => `<li><svg class="dot" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="${l.colour}"/></svg><span class="lang-name">${esc(l.name)}</span> <span class="lang-pct">${l.pct < 0.1 ? "<0.1" : l.pct.toFixed(1)}%</span></li>`).join("");
  return `
            <h4 class="label about-h">Languages</h4>
            <svg class="lang-bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>
            <ul class="lang-list">${legend}</ul>`;
}

function renderArchitecture(p) {
  const parts = [];
  for (const tier of p.architecture) {
    if (tier.link) parts.push(`
            <div class="wire"><span class="wire-label">${esc(tier.link)}</span></div>`);
    parts.push(`
            <div class="tier">
              <p class="tier-label">${esc(tier.label)}</p>
              <ul class="nodes">${tier.nodes.map((n) => `
                <li class="node"><strong>${esc(n.name)}</strong><span>${esc(n.note)}</span></li>`).join("")}
              </ul>
            </div>`);
  }
  return `
        <section class="arch" aria-labelledby="arch-${esc(p.slug)}">
          <h4 class="label arch-h" id="arch-${esc(p.slug)}">Architecture</h4>
          <div class="arch-flow">${parts.join("")}
          </div>
        </section>`;
}

function renderProject(p, today) {
  const url = esc(p.url);
  const all = [...(p.links || []), ...(p.github ? [{ label: "Code on GitHub", url: `https://github.com/${p.github}` }] : [])];
  const links = all.map((l) => `
              <li><a href="${esc(l.url)}" ${NEW_WINDOW}>${esc(l.label)} <span aria-hidden="true">↗</span>${NEW_WINDOW_SR}</a></li>`).join("");
  return `
    <article class="repo" id="${esc(p.slug)}" aria-labelledby="name-${esc(p.slug)}">
      <header class="repo-head">
        <h3 class="repo-name" id="name-${esc(p.slug)}"><span class="repo-owner">chrisdemetriou /</span> <a href="${url}" ${NEW_WINDOW}>${esc(p.name || p.slug)}${NEW_WINDOW_SR}</a></h3>
        <span class="pill">${esc(p.status || "Live")}</span>
        <a class="btn" href="${url}" ${NEW_WINDOW}>${esc(p.cta || "Open it")} <span aria-hidden="true">↗</span>${NEW_WINDOW_SR}</a>
      </header>
      <div class="repo-grid">
        <div class="repo-main">
          <a class="shot" href="${url}" ${NEW_WINDOW}><img src="/${esc(p.image)}" width="880" height="550" alt="${esc(p.imageAlt)}">${NEW_WINDOW_SR}</a>
          <h4 class="sr">Built with</h4>
          <ul class="topics">${p.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
        <aside class="repo-about" aria-label="About ${esc(p.title)}">
          <h4 class="label about-h">About</h4>
          <p class="about-desc">${esc(p.description)}</p>
          <p class="about-site"><a href="${url}" ${NEW_WINDOW}>${esc(host(p.url)).replace(/\./g, ".<wbr>")} <span aria-hidden="true">↗</span>${NEW_WINDOW_SR}</a></p>
          ${links ? `<ul class="about-links">${links}
          </ul>` : ""}${renderLanguages(p.languages)}
          <p class="label updated">Updated ${esc(shortDate(p.updated || today))}${p.build ? ` · build ${esc(p.build)}` : ""}</p>
        </aside>
      </div>${renderArchitecture(p)}
    </article>`;
}

export function renderHome(projects, today = new Date().toISOString().slice(0, 10)) {
  const nav = NAV.map(([label, href]) => href === "/"
    ? `      <li><a class="current" href="/" aria-current="page">${label}</a></li>`
    : `      <li><a href="${href}">${label}</a></li>`).join("\n");
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Labs · Chris Demetriou",
    url: `${SITE}/`,
    author: { "@type": "Person", name: "Chris Demetriou", url: `${MAIN}/` },
    hasPart: projects.map((p) => ({ "@type": "SoftwareApplication", name: p.title, description: p.description, url: p.url, applicationCategory: "WebApplication", keywords: p.topics.join(", ") })),
  };
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tech · Chris Demetriou</title>
<meta name="description" content="Apps and websites designed and built by Chris Demetriou. Each one is live — open it and try it.">
<link rel="canonical" href="${SITE}/"> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — a canonical URL loads nothing -->
<meta name="color-scheme" content="dark">
<meta property="og:title" content="Tech · Chris Demetriou">
<meta property="og:description" content="Apps and websites designed and built by Chris Demetriou. Each one is live — open it and try it.">
<meta property="og:url" content="${SITE}/">
<meta property="og:image" content="${SITE}/img/og-genesis.png">
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — a preconnect loads nothing -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — a preconnect loads nothing -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&amp;family=Space+Mono:wght@400;700&amp;family=Work+Sans:wght@300;400;500&amp;display=swap"> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — Google Fonts CSS varies by browser, so it can't carry a fixed hash; the same fonts as chrisdemetriou.com -->
<link rel="stylesheet" href="/site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to the projects</a>
<header class="masthead">
  <div class="container">
    <a class="wordmark" href="${MAIN}/">Chris Demetriou</a>
    <span class="label">Manchester, UK</span>
  </div>
</header>
<nav class="section-nav" aria-label="Sections">
  <div class="container">
    <ul>
${nav}
    </ul>
  </div>
</nav>
<main id="main">
  <section class="record-header">
    <div class="container">
      <h1 class="record-name">Tech</h1>
      <p class="record-roles">Design<span class="sep">/</span>Build<span class="sep">/</span>Run</p>
      <p class="record-standfirst">Apps and websites I've designed and built, from the first sketch to the servers they run on. Each one is live — it opens in a new window so you can come straight back.</p>
    </div>
  </section>
  <section class="band" aria-labelledby="projects-h">
    <div class="container">
      <h2 class="band-title" id="projects-h">Projects <span class="count">${projects.length}</span></h2>
${projects.map((p) => renderProject(p, today)).join("\n")}
    </div>
  </section>
</main>
<footer>
  <div class="container foot-line">
    <span>© <span data-year>${today.slice(0, 4)}</span> Chris Demetriou</span>
    <span><a href="${MAIN}/privacy/">Privacy</a> &nbsp;·&nbsp; <a href="${MAIN}/cookies/">Cookies</a></span>
  </div>
</footer>
</body>
</html>
`;
}

export function renderSitemap(projects, today = new Date().toISOString().slice(0, 10)) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
${projects.map((p) => `    <image:image><image:loc>${SITE}/${esc(p.image)}</image:loc></image:image>`).join("\n")}
  </url>
</urlset>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const projects = await loadProjects();
  writeFileSync(join(ROOT, "public", "index.html"), renderHome(projects));
  writeFileSync(join(ROOT, "public", "sitemap.xml"), renderSitemap(projects));
  writeFileSync(join(ROOT, "public", "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`labs: ${projects.length} project${projects.length === 1 ? "" : "s"} built`);
}
