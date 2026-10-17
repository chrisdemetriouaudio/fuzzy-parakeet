#!/usr/bin/env node
/**
 * Builds Labs (chrisdemetriou.com's TECH page) from projects.json, in that site's
 * masthead, nav bar, fonts and colours (TECH is the current tab):
 *   /            an overview that fits on one screen: key numbers, technology
 *                filters (CSS only), and compact "pinned" cards like a GitHub profile;
 *   /<slug>/     each project's full write-up, like a GitHub repository page:
 *                screenshot, topic tags, About panel with a languages bar, and an
 *                architecture drawing.
 * Output is plain HTML (no scripts), so it loads instantly and search engines
 * read it as-is. Also writes filters.css, sitemap.xml and robots.txt.
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
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
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
const GITHUB_COLOURS = { ...Object.fromEntries(Object.values(LANGUAGES)), Astro: "#ff5a03", Shell: "#89e051", Python: "#3572a5", PHP: "#4f5d95" };
const NOT_OURS = /(^|\/)(vendor|previews|node_modules|dist|ds-bundle)\/|(^|\/)\.|\.min\./;
const fetchJson = async (url, headers = {}) => {
  const r = await fetch(url, { headers: { "cache-control": "no-cache", "user-agent": "labs-build", ...headers }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`${r.status} from ${url}`);
  return r.json();
};

/** Checks one projects.json entry; throws with a plain-English reason. No network. */
export function checkProject(p, root = ROOT) {
  for (const k of ["slug", "title", "description", "url", "image", "imageAlt", "topics", "architecture"]) if (!p[k]) throw new Error(`projects.json: "${p.slug || "?"}" is missing ${k}`);
  // New apps go on <project>.labs.chrisdemetriou.com; sites built for others keep their own address.
  if (!/^https:\/\/([a-z0-9-]+\.)+[a-z]{2,}\/$/.test(p.url)) throw new Error(`projects.json: ${p.slug} url must be an https:// home page ending in / (new apps: https://<project>.labs.chrisdemetriou.com/)`);
  if (!/^[a-z0-9-]+$/.test(p.slug) || ["img", "og"].includes(p.slug)) throw new Error(`projects.json: slug "${p.slug}" must be lower-case letters, digits and dashes (it becomes /${p.slug}/)`);
  for (const t of p.topics) if (!/^[a-z0-9-]+$/.test(t)) throw new Error(`projects.json: ${p.slug} topic "${t}" must be lower-case letters, digits and dashes`);
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

const navHtml = () => NAV.map(([label, href]) => href === "/"
  ? `      <li><a class="current" href="/" aria-current="page">${label}</a></li>`
  : `      <li><a href="${href}">${label}</a></li>`).join("\n");
const slugify = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-");
const primaryLanguage = (p) => (p.languages && p.languages[0]) || null;
const langDot = (l) => `<svg class="dot" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="${l.colour}"/></svg>`;

/** One page in chrisdemetriou.com's frame: masthead, nav (TECH current), footer. */
function page({ title, description, path, ogImage, ld, body, today, extraCss = [] }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}"> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — a canonical URL loads nothing -->
<meta name="color-scheme" content="dark">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/${esc(ogImage)}">
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — a preconnect loads nothing -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — a preconnect loads nothing -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&amp;family=Space+Mono:wght@400;700&amp;family=Work+Sans:wght@300;400;500&amp;display=swap"> <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity — Google Fonts CSS varies by browser, so it can't carry a fixed hash; the same fonts as chrisdemetriou.com -->
<link rel="stylesheet" href="/site.css">
${extraCss.map((h) => `<link rel="stylesheet" href="${h}">`).join("\n")}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to the content</a>
<header class="masthead">
  <div class="container">
    <a class="wordmark" href="${MAIN}/">Chris Demetriou</a>
    <span class="label">Manchester, UK</span>
  </div>
</header>
<nav class="section-nav" aria-label="Sections">
  <div class="container">
    <ul>
${navHtml()}
    </ul>
  </div>
</nav>
<main id="main">
${body}
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

/** Newest first, like GitHub's "Last updated" sort; ties keep projects.json order. */
export function sortProjects(projects, today) {
  return projects.map((p, i) => ({ p, i })).sort((a, b) => (b.p.updated || today).localeCompare(a.p.updated || today) || a.i - b.i).map((x) => x.p);
}

/** Technologies to filter by, at most 8 (one row): the most used first, then the ones each
 *  project lists earliest (projects.json lists a project's key technologies first). */
export function filterTopics(projects) {
  const count = new Map();
  const rank = new Map();
  for (const p of projects) p.topics.forEach((t, i) => { count.set(t, (count.get(t) || 0) + 1); rank.set(t, Math.min(rank.get(t) ?? i, i)); });
  return [...count.keys()].sort((a, b) => count.get(b) - count.get(a) || rank.get(a) - rank.get(b) || a.localeCompare(b)).slice(0, 8);
}

/** The filter rules: one per technology. A stylesheet, so the CSP needs no inline styles. */
export function renderFilterCss(projects) {
  return `/* Generated by scripts/build.mjs: one rule per technology filter on the Tech page. */\n` +
    filterTopics(projects).map((t) => `.labs:has(#f-${slugify(t)}:checked) .pcard:not([data-topics~="${t}"]){display:none}`).join("\n") + "\n";
}

/** A compact "pinned" card for the overview. */
function renderCard(p, today, i = 0) {
  const url = esc(p.url);
  const lang = primaryLanguage(p);
  return `
      <li class="pcard" data-topics="${esc(p.topics.join(" "))}">
        <a class="pcard-shot" href="/${esc(p.slug)}/" tabindex="-1" aria-hidden="true"><img src="/${esc(p.image)}" width="880" height="550" alt=""${i >= 4 ? ` loading="lazy"` : ""}></a>
        <div class="pcard-body">
          <h3 class="pcard-name"><a href="/${esc(p.slug)}/">${esc(p.name || p.slug)}</a> <span class="pill">${esc(p.status || "Live")}</span></h3>
          <p class="pcard-desc">${esc(p.description)}</p>
          <p class="pcard-meta">${lang ? `<span class="pcard-lang">${langDot(lang)}${esc(lang.name)}</span>` : ""}<span class="pcard-updated">Updated ${esc(shortDate(p.updated || today))}</span></p>
          <ul class="pcard-tags" aria-label="Built with">${p.topics.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join("")}${p.topics.length > 3 ? `<li class="more">+${p.topics.length - 3}</li>` : ""}</ul>
          <p class="pcard-actions">
            <a class="btn btn-sm" href="${url}" ${NEW_WINDOW}>Open live <span aria-hidden="true">↗</span>${NEW_WINDOW_SR}</a>
            <a class="pcard-more" href="/${esc(p.slug)}/">How it's built <span aria-hidden="true">→</span></a>
          </p>
        </div>
      </li>`;
}

/** The full write-up, laid out like a GitHub repository page. */
function renderProject(p, today) {
  const url = esc(p.url);
  const all = [...(p.links || []), ...(p.github ? [{ label: "Code on GitHub", url: `https://github.com/${p.github}` }] : [])];
  const links = all.map((l) => `
              <li><a href="${esc(l.url)}" ${NEW_WINDOW}>${esc(l.label)} <span aria-hidden="true">↗</span>${NEW_WINDOW_SR}</a></li>`).join("");
  return `
    <article class="repo" id="${esc(p.slug)}" aria-labelledby="name-${esc(p.slug)}">
      <header class="repo-head">
        <h1 class="repo-name" id="name-${esc(p.slug)}"><span class="repo-owner">chrisdemetriou /</span> <a href="${url}" ${NEW_WINDOW}>${esc(p.name || p.slug)}${NEW_WINDOW_SR}</a></h1>
        <span class="pill">${esc(p.status || "Live")}</span>
        <a class="btn" href="${url}" ${NEW_WINDOW}>${esc(p.cta || "Open it")} <span aria-hidden="true">↗</span>${NEW_WINDOW_SR}</a>
      </header>
      <div class="repo-grid">
        <div class="repo-main">
          <a class="shot" href="${url}" ${NEW_WINDOW}><img src="/${esc(p.image)}" width="880" height="550" alt="${esc(p.imageAlt)}">${NEW_WINDOW_SR}</a>
          <h2 class="sr">Built with</h2>
          <ul class="topics">${p.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
        <aside class="repo-about" aria-label="About ${esc(p.title)}">
          <h2 class="label about-h">About</h2>
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
  const list = sortProjects(projects, today);
  const topics = filterTopics(list);
  const tech = new Set(list.flatMap((p) => p.topics)).size;
  const live = list.filter((p) => (p.status || "Live") === "Live").length;
  const latest = list.map((p) => p.updated || today).sort().pop();
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tech · Chris Demetriou",
    url: `${SITE}/`,
    author: { "@type": "Person", name: "Chris Demetriou", url: `${MAIN}/` },
    hasPart: list.map((p) => ({ "@type": "SoftwareApplication", name: p.title, description: p.description, url: `${SITE}/${p.slug}/`, applicationCategory: "WebApplication", keywords: p.topics.join(", ") })),
  };
  const body = `  <section class="record-header labs-head">
    <div class="container">
      <div>
        <h1 class="record-name">Tech</h1>
        <p class="record-standfirst">Apps and websites I've designed, built and run. Open any of them live, or see how it's built.</p>
      </div>
      <dl class="stats">
        <div><dt>Projects</dt><dd>${list.length}</dd></div>
        <div><dt>Live</dt><dd>${live}</dd></div>
        <div><dt><span class="long">Technologies</span><span class="short">Tech</span></dt><dd>${tech}</dd></div>
        <div><dt>Updated</dt><dd>${esc(shortDate(latest))}</dd></div>
      </dl>
    </div>
  </section>
  <section class="band labs" aria-labelledby="projects-h">
    <div class="container">
      <h2 class="sr" id="projects-h">Projects</h2>
      <fieldset class="filters">
        <legend class="label">Filter by technology</legend>
        <div class="filter-row">
          <input class="sr" type="radio" name="f" id="f-all" checked><label for="f-all">All <span class="count">${list.length}</span></label>${topics.map((t) => `<input class="sr" type="radio" name="f" id="f-${slugify(t)}"><label for="f-${slugify(t)}">${esc(t)}</label>`).join("")}
        </div>
      </fieldset>
      <ul class="pcards">${list.map((p, i) => renderCard(p, today, i)).join("")}
      </ul>
    </div>
  </section>`;
  return page({ title: "Tech · Chris Demetriou", description: "Apps and websites designed, built and run by Chris Demetriou. Each one is live — open it, or see how it's built.", path: "/", ogImage: "img/og-genesis.png", ld, body, today, extraCss: ["/filters.css"] });
}

export function renderProjectPage(p, projects, today = new Date().toISOString().slice(0, 10)) {
  const list = sortProjects(projects, today);
  const i = list.indexOf(p);
  const next = list[(i + 1) % list.length];
  const ld = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: p.title, description: p.description, url: p.url, applicationCategory: "WebApplication", keywords: p.topics.join(", "), author: { "@type": "Person", name: "Chris Demetriou", url: `${MAIN}/` } };
  const body = `  <div class="container crumbs"><a href="/">← All projects</a><span class="label">${i + 1} of ${list.length}</span></div>
  <section class="band repo-page">
    <div class="container">${renderProject(p, today)}
      ${list.length > 1 ? `<p class="next-project"><span class="label">Next project</span> <a href="/${esc(next.slug)}/">${esc(next.name || next.slug)} <span aria-hidden="true">→</span></a></p>` : ""}
    </div>
  </section>`;
  return page({ title: `${p.title} · Tech · Chris Demetriou`, description: p.description, path: `/${p.slug}/`, ogImage: p.image, ld, body, today });
}

export function renderSitemap(projects, today = new Date().toISOString().slice(0, 10)) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
  </url>
${projects.map((p) => `  <url>
    <loc>${SITE}/${esc(p.slug)}/</loc>
    <lastmod>${esc(p.updated || today)}</lastmod>
    <image:image><image:loc>${SITE}/${esc(p.image)}</image:loc></image:image>
  </url>`).join("\n")}
</urlset>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const projects = await loadProjects();
  writeFileSync(join(ROOT, "public", "index.html"), renderHome(projects));
  writeFileSync(join(ROOT, "public", "filters.css"), renderFilterCss(projects));
  for (const p of projects) {
    mkdirSync(join(ROOT, "public", p.slug), { recursive: true });
    writeFileSync(join(ROOT, "public", p.slug, "index.html"), renderProjectPage(p, projects));
  }
  writeFileSync(join(ROOT, "public", "sitemap.xml"), renderSitemap(projects));
  writeFileSync(join(ROOT, "public", "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`labs: ${projects.length} project${projects.length === 1 ? "" : "s"} built`);
}
