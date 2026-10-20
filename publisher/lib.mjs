// Evidence-gated publishing for chrisdemetriou.com.
//
// Records in content/records/*.json become pages only when every gate passes AND a
// human approval matches the record's current version. Rendering is deterministic: the
// same records always produce the same files. Nothing here calls a model or the network.
// See docs/search/PUBLISHING.md for the workflow.

import { createHash } from "node:crypto";

export const SITE = "https://chrisdemetriou.com";
export const STATUSES = ["candidate", "evidence-needed", "draft", "review-ready", "approved", "published", "needs-review", "retired"];
export const CLAIM_OK = ["owner-provided", "independently-supported"];
export const CLAIM_STATUSES = [...CLAIM_OK, "awaiting-confirmation"];
export const RELATIONSHIPS = ["self-initiated", "commissioned", "volunteer", "employment", "training", "worship-ministry", "unknown"];
export const MEDIA_RIGHTS = ["owned", "licensed", "permission-granted", "embed-permitted"];
export const RUBRIC = [
  "evidence-accuracy", "distinct-user-need", "original-contribution", "completeness",
  "media-and-permissions", "clear-writing", "internal-linking", "honest-representation",
  "technical-readiness", "next-action",
];
export const GENERATED_MARK = "<!-- generated:content-record";
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Folders that belong to hand-written pages or tooling. A family route can never be one of these.
export const HAND_WRITTEN_DIRS = ["creative", "privacy", "cookies", "images", "styles", "scripts", "video", "labs", "content", "publisher", "docs", "chrisdemetriou-PMO"];
// Names a reviewer can't have: approval is a human decision, never a model's.
const NON_HUMAN_REVIEWER = /\b(claude|gpt|chatgpt|openai|anthropic|gemini|copilot|llm|ai|bot|assistant|model)\b/i;

// Fields that make up a page. Changing any of them changes the version, which voids
// an approval. Workflow fields (status, history, tasks) are deliberately left out.
const VERSIONED = ["id", "family", "slug", "title", "seo", "intent", "audience", "uniqueValue", "role",
  "claims", "body", "originalNotes", "media", "links", "nextAction", "indexable", "location", "localEvidence"];

// ── helpers ────────────────────────────────────────────────────────────────

export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

export function versionHash(record) {
  const subset = {};
  for (const k of VERSIONED) subset[k] = record[k] === undefined ? null : record[k];
  return createHash("sha256").update(stable(subset)).digest("hex");
}

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function routeOf(record, families) {
  const fam = families[record.family];
  return fam ? `/${fam.route}/${record.slug}/` : null;
}

export function words(text) {
  return String(text || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").match(/[a-z0-9’']+/g) || [];
}

// Word 5-gram shingles; Jaccard overlap. A flag for a human, never a verdict.
export function similarity(a, b, n = 5) {
  const sh = (t) => { const w = words(t); const s = new Set(); for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(" ")); return s; };
  const A = sh(a), B = sh(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export function recordText(r) {
  return [r.title, ...(r.body || []).map((b) => `${b.heading || ""} ${b.text || ""} ${(b.items || []).join(" ")}`), ...(r.originalNotes || []).map((n) => n.text)].join(" \n ");
}

// Main content of a hand-written page, without masthead, nav, footer or scripts.
export function mainText(html) {
  const m = String(html).match(/<main[\s\S]*?<\/main>/i);
  return (m ? m[0] : String(html)).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function publicStrings(r) {
  const out = [r.title, r.seo?.title, r.seo?.description, r.uniqueValue, r.nextAction?.label, r.role?.summary];
  for (const c of r.claims || []) out.push(c.text);
  for (const b of r.body || []) out.push(b.heading, b.text, ...(b.items || []));
  for (const n of r.originalNotes || []) out.push(n.text);
  for (const m of r.media || []) out.push(m.alt, m.caption);
  return out.filter(Boolean).map(String);
}

const PLACEHOLDER = /\b(TODO|TBC|TBD|FIXME|XXX)\b|lorem ipsum|\{\{|\}\}|\[\[|\]\]|\[placeholder|<insert|INSERT HERE/i;
const AWARD_PATTERNS = [
  /\b(oscar|academy award|grammy|bafta|emmy|ivor novello|brit award)[- ]?(nominated|nominee|winning|winner)\s+(producer|engineer|musician|arranger|composer|performer|artist|songwriter|mixer|developer|consultant)\b/i,
  /\b(i am|i['’]m|i was|chris(?: demetriou)? (?:is|was)|he (?:is|was))\s+(?:an?\s+)?(?:\w+[- ])?(oscar|grammy|bafta|emmy)[- ]?(nominated|nominee|winning|winner)\b/i,
  /\b(oscar|grammy|bafta|emmy)[- ](nominee|winner)\b/i,
  /\baward[- ]winning\s+(producer|engineer|musician|arranger|composer|developer|consultant|me|chris)\b/i,
];
const PRIVATE_LINK = /(drive\.google|docs\.google|dropbox\.com|onedrive|sharepoint\.com|wetransfer|icloud\.com\/|1drv\.ms)/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PUBLIC_EMAILS = new Set(["hello@chrisdemetriou.com", "privacy@chrisdemetriou.com"]);
const PHONE = /(?:\+44\s?7\d{3}|\b07\d{3})\s?\d{3}\s?\d{3}\b/;

// ── gates ──────────────────────────────────────────────────────────────────
// Each gate returns hard errors (block publication, no override) and flags (block until
// a human acknowledges them in the approval).

export function evaluate(record, ctx) {
  const errors = [];
  const flags = [];
  const err = (gate, msg) => errors.push({ gate, msg });
  const r = record;
  const fam = ctx.families[r.family];

  // schema / lifecycle
  for (const k of ["id", "family", "slug", "title", "status", "intent", "seo", "claims", "body"]) {
    if (r[k] === undefined || r[k] === null || r[k] === "") err("schema", `missing field "${k}"`);
  }
  if (!STATUSES.includes(r.status)) err("lifecycle", `unknown status "${r.status}"`);

  // family and route safety
  if (!fam) err("family", `unknown family "${r.family}"`);
  else if (!fam.enabled && r.status !== "retired") err("family", `family "${r.family}" is switched off`);
  if (!SLUG_RE.test(r.slug || "") || r.slug.length < 3 || r.slug.length > 60) err("route", `slug "${r.slug}" must be 3–60 lowercase letters, numbers and single hyphens`);
  if (fam && HAND_WRITTEN_DIRS.includes(fam.route)) err("route", `"/${fam.route}/" is a hand-written folder; families need their own`);
  const route = routeOf(r, ctx.families);
  const sameRoute = ctx.records.filter((o) => o.id !== r.id && o.status !== "retired" && routeOf(o, ctx.families) === route);
  if (sameRoute.length) err("route", `route ${route} is also used by ${sameRoute.map((o) => o.id).join(", ")}`);
  if (fam) {
    const live = ctx.records.filter((o) => o.family === r.family && o.status !== "retired");
    if (live.length > fam.maxPages) err("route", `family "${r.family}" has ${live.length} records; the cap is ${fam.maxPages}`);
  }

  // evidence: every claim sourced and confirmed; private evidence stays private
  const claimIds = new Set();
  for (const c of r.claims || []) {
    if (!c.id || !c.text) { err("evidence", "a claim is missing its id or text"); continue; }
    claimIds.add(c.id);
    if (!CLAIM_STATUSES.includes(c.status)) err("evidence", `claim ${c.id}: unknown status "${c.status}"`);
    else if (!CLAIM_OK.includes(c.status)) err("evidence", `claim ${c.id} is ${c.status}`);
    if (!Array.isArray(c.sources) || !c.sources.length) err("evidence", `claim ${c.id} has no source`);
    for (const s of c.sources || []) {
      if (!s.ref) err("evidence", `claim ${c.id} has a source without a reference`);
      if (s.public === false && /^https?:/i.test(s.ref || "")) err("privacy", `claim ${c.id}: private evidence must be a label, not a link`);
    }
  }

  // claim references: every block of copy must point at the claims it relies on
  if (!(r.body || []).length) err("claim-refs", "no body");
  for (const [i, b] of (r.body || []).entries()) {
    if (!b.text) err("claim-refs", `block ${i + 1} has no text`);
    if (!Array.isArray(b.claims) || !b.claims.length) err("claim-refs", `block ${i + 1} cites no claims`);
    for (const id of b.claims || []) if (!claimIds.has(id)) err("claim-refs", `block ${i + 1} cites unknown claim "${id}"`);
  }

  // honest representation: role and relationship stated precisely
  if (!r.role?.summary) err("honesty", "role.summary (what Chris did) is missing");
  if (!RELATIONSHIPS.includes(r.role?.relationship)) err("honesty", `role.relationship must be one of ${RELATIONSHIPS.join(", ")}`);
  else if (r.role.relationship === "unknown") err("honesty", "the working relationship (commissioned, volunteer…) is unknown");
  if (r.role && !CLAIM_OK.includes(r.role.status)) err("honesty", `role is ${r.role.status || "unconfirmed"}`);

  // text-level checks across everything that would be public
  const pub = publicStrings(r);
  for (const s of pub) {
    if (PLACEHOLDER.test(s)) err("placeholders", `unresolved placeholder in: "${s.slice(0, 60)}…"`);
    for (const re of AWARD_PATTERNS) if (re.test(s)) err("awards", `award wording makes Chris the nominee or winner: "${s.match(re)[0]}"`);
    if (PRIVATE_LINK.test(s)) err("privacy", "a private storage link is in public text");
    for (const e of s.match(EMAIL) || []) if (!PUBLIC_EMAILS.has(e.toLowerCase())) err("privacy", `email address in public text: ${e}`);
    if (PHONE.test(s)) err("privacy", "a phone number is in public text");
  }

  // media: rights known, and no page that is only a wrapper round an embed
  for (const [i, m] of (r.media || []).entries()) {
    if (!m.src) err("media", `media ${i + 1} has no src`);
    if (!m.decorative && !m.alt) err("media", `media ${i + 1} has no alt text`);
    if (!MEDIA_RIGHTS.includes(m.rights)) err("media", `media ${i + 1}: rights "${m.rights || "unknown"}" not cleared`);
    else if (m.rights !== "owned" && !m.permissionSource) err("media", `media ${i + 1}: say where permission came from`);
    if (m.src && !/^https:\/\//.test(m.src) && ctx.fileExists && !ctx.fileExists(m.src)) err("media", `media ${i + 1}: ${m.src} does not exist`);
  }
  const hasEmbed = (r.media || []).some((m) => m.type === "embed");
  const bodyWords = (r.body || []).reduce((n, b) => n + words(`${b.text} ${(b.items || []).join(" ")}`).length, 0);
  if (hasEmbed && ((r.body || []).length < 2 || bodyWords < 120)) err("media", "the page is little more than an embed");

  // original contribution: Chris's own notes, not paraphrase of public facts
  if (fam?.requiresOriginalNotes) {
    const own = (r.originalNotes || []).filter((n) => n.text && /^(intake|owner):/.test(n.source || "") && CLAIM_OK.includes(n.status));
    if (!own.length) err("original", "needs Chris's own notes (intake answers), confirmed by him");
  }

  // location pages need a real local proposition
  if (r.location && !(r.localEvidence || []).length) err("location", `targets "${r.location}" without location-specific evidence`);

  // distinct intent: one page per task
  const key = r.intent?.key;
  if (!key) err("intent", "intent.key (the one task this page serves) is missing");
  else {
    const clash = [...ctx.records.filter((o) => o.id !== r.id && o.status !== "retired" && o.intent?.key === key).map((o) => o.id),
      ...ctx.corePages.filter((p) => p.intentKey === key).map((p) => p.path)];
    if (clash.length) err("intent", `intent "${key}" is already served by ${clash.join(", ")}`);
  }
  if (!r.uniqueValue) err("intent", "uniqueValue (why this page should exist) is missing");

  // similarity against other records and hand-written pages: a reason to look, not a verdict
  const mine = recordText(r);
  for (const o of ctx.records) {
    if (o.id === r.id || o.status === "retired") continue;
    const s = similarity(mine, recordText(o));
    if (s >= (ctx.similarityFlag ?? 0.3)) flags.push(`similar-to:${o.id}`);
  }
  for (const p of ctx.corePages) {
    if (!p.text) continue;
    const s = similarity(mine, p.text);
    if (s >= (ctx.similarityFlag ?? 0.3)) flags.push(`similar-to:${p.path}`);
  }

  // technical readiness
  const t = r.seo?.title || "";
  const d = r.seo?.description || "";
  if (t.length < 10 || t.length > 65) err("seo", `seo.title is ${t.length} characters (10–65)`);
  if (d.length < 50 || d.length > 170) err("seo", `seo.description is ${d.length} characters (50–170)`);
  const sameTitle = ctx.records.filter((o) => o.id !== r.id && o.status !== "retired" && o.seo?.title === t);
  if (t && sameTitle.length) err("seo", `seo.title duplicates ${sameTitle.map((o) => o.id).join(", ")}`);
  if (!r.nextAction?.label || !r.nextAction?.href) err("next-action", "nextAction (label and link) is missing");
  const known = new Set([...ctx.corePages.map((p) => p.path), ...ctx.records.filter((o) => o.status === "published").map((o) => routeOf(o, ctx.families))]);
  for (const href of [r.nextAction?.href, ...(r.links?.internal || [])].filter(Boolean)) {
    if (/^https:\/\//.test(href)) continue;
    const path = href.split("#")[0] || "/";
    if (!href.startsWith("/") || !known.has(path)) err("links", `internal link ${href} doesn't point at a live page`);
  }

  // approval: human, current, complete
  const approval = currentApproval(r, ctx.approvals);
  const approvalProblems = approvalIssues(r, approval, flags);
  const wantsPublish = r.status === "published";
  const eligible = wantsPublish && !errors.length && !approvalProblems.length;

  // review dates: a published page past its review date is flagged, not removed
  if (wantsPublish && r.reviewBy && ctx.today && r.reviewBy < ctx.today) flags.push(`review-due:${r.reviewBy}`);

  return { id: r.id, route, status: r.status, version: versionHash(r), errors, flags, approval, approvalProblems, eligible, indexable: eligible && r.indexable !== false };
}

export function currentApproval(r, approvals) {
  return (approvals || []).filter((a) => a.id === r.id).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}

export function approvalIssues(r, a, flags) {
  if (r.status !== "published" && r.status !== "approved") return [];
  const out = [];
  if (!a) return ["no approval recorded"];
  if (a.versionHash !== versionHash(r)) out.push("the record changed after it was approved; it needs a fresh review");
  if (!a.reviewer || NON_HUMAN_REVIEWER.test(a.reviewer)) out.push(`reviewer "${a.reviewer || ""}" is not a named person`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || "")) out.push("approval date missing");
  for (const k of RUBRIC) {
    const v = a.rubric?.[k];
    if (v !== "pass") out.push(`rubric "${k}" is ${v || "not scored"}`);
  }
  for (const f of flags) if (!(a.acknowledgedFlags || []).includes(f)) out.push(`flag not acknowledged: ${f}`);
  return out;
}

// ── rendering ──────────────────────────────────────────────────────────────

const NAV = [["Tools", "/#tools"], ["Proof", "/#proof"], ["Process", "/#process", true], ["FAQ", "/#faq", true]];
const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function renderPage(r, ctx, { preview = false } = {}) {
  const fam = ctx.families[r.family];
  const route = routeOf(r, ctx.families);
  const url = `${SITE}${route}`;
  const noindex = preview || r.indexable === false;
  const blocks = (r.body || []).map((b) => `
      ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ""}
      ${String(b.text).split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      ${(b.items || []).length ? `<ol>${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ol>` : ""}`).join("\n");
  const notes = (r.originalNotes || []).length ? `
      <h2>In my words</h2>
      ${r.originalNotes.map((n) => `<blockquote><p>${esc(n.text)}</p></blockquote>`).join("\n      ")}` : "";
  const media = (r.media || []).filter((m) => m.type !== "embed").map((m) => `
      <figure>
        <img src="${esc(m.src)}" alt="${m.decorative ? "" : esc(m.alt)}" ${m.width ? `width="${m.width}" height="${m.height}"` : ""} loading="lazy">
        ${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}
      </figure>`).join("");
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: r.title,
    description: r.seo.description,
    url,
    mainEntityOfPage: url,
    inLanguage: "en-GB",
    author: { "@id": `${SITE}/#person` },
    dateModified: r.substantiveModified,
    ...(r.firstPublished ? { datePublished: r.firstPublished } : {}),
  };
  const relatedLinks = (r.links?.related || []).map((id) => ctx.records.find((o) => o.id === id)).filter((o) => o && o.status === "published")
    .map((o) => `<li><a href="${routeOf(o, ctx.families)}">${esc(o.title)}</a></li>`).join("");
  return `<!DOCTYPE html>
${GENERATED_MARK} id=${r.id} version=${versionHash(r).slice(0, 12)} -- edit content/records/${r.id}.json, not this file -->
<html lang="en-GB" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(r.seo.title)}</title>
<meta name="description" content="${esc(r.seo.description)}">
<meta name="robots" content="${noindex ? "noindex" : "index, follow"}">
${preview ? "" : `<link rel="canonical" href="${url}">`}
<link rel="icon" href="/favicon.ico" sizes="any">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(r.seo.title)}">
<meta property="og:description" content="${esc(r.seo.description)}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles/record.css">
<script>
  // Display settings (/scripts/display.js), applied before the page paints so there's no flash
  (function(){var r=document.documentElement,p={};try{p=JSON.parse(localStorage.getItem("cd-display")||"{}")||{};}catch(e){}try{var t=p.theme==="auto"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p.theme;if(t==="dark")r.removeAttribute("data-theme");["text","font","spacing","contrast","motion"].forEach(function(k){var v=p[k];if(typeof v==="string"&&/^[a-z]+$/.test(v)&&v!=="normal"&&v!=="default")r.setAttribute("data-"+k,v);});if(p.motion!=="reduced"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)r.classList.add("motion");}catch(e){}})();
</script>
<link rel="stylesheet" href="/styles/display.css?v=5">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${preview ? `<p class="preview-banner">PREVIEW · status: ${esc(r.status)} · not published · noindex</p>` : ""}
<header class="masthead"><div class="container"><a class="wordmark" href="/">Chris Demetriou</a></div></header>
<nav class="section-nav" aria-label="Sections"><div class="container"><ul>
${NAV.map(([l, h, wide]) => `<li${wide ? ' class="nav-wide"' : ""}><a href="${h}">${l}</a></li>`).join("")}<li><a href="https://labs.chrisdemetriou.com/">Labs</a></li><li><a href="/#contact">Contact</a></li><li class="nav-side"><a href="/creative/">Creative</a></li>
</ul></div></nav>
<main id="main" tabindex="-1">
  <article class="container record">
    <p class="label">${esc(fam.label)}</p>
    <h1>${esc(r.title)}</h1>
    <p class="meta">By Chris Demetriou · Updated <time datetime="${esc(r.substantiveModified)}">${esc(longDate(r.substantiveModified))}</time></p>
    <p class="role"><strong>My role:</strong> ${esc(r.role.summary)}</p>
    ${r.intent?.primary ? `<p class="question">${esc(r.intent.primary)}</p>` : ""}
${blocks}
${media}
${notes}
    <aside class="next">
      <p><a class="btn" href="${esc(r.nextAction.href)}">${esc(r.nextAction.label)}</a></p>
      ${relatedLinks ? `<h2>Related</h2><ul>${relatedLinks}</ul>` : ""}
    </aside>
  </article>
</main>
<footer><div class="container"><span>&copy; Chris Demetriou · Software Developer &amp; Consultant, Manchester</span>
<nav aria-label="Footer"><a href="/creative/">Creative</a> <a href="https://labs.chrisdemetriou.com/">Labs</a> <a href="/privacy/">Privacy</a> <a href="/cookies/">Cookies</a></nav></div></footer>
<script src="/scripts/display.js?v=4" defer></script>
</body>
</html>
`;
}

export function renderRedirect(r, ctx) {
  const to = r.redirectTo;
  return `<!DOCTYPE html>
${GENERATED_MARK} id=${r.id} retired -- edit content/records/${r.id}.json, not this file -->
<html lang="en-GB"><head><meta charset="UTF-8"><title>Moved · Chris Demetriou</title>
<meta name="robots" content="noindex"><link rel="canonical" href="${SITE}${esc(to)}">
<meta http-equiv="refresh" content="0; url=${esc(to)}"></head>
<body><p>This page has moved: <a href="${esc(to)}">continue</a>.</p></body></html>
`;
}

export function renderSitemap(ctx, results) {
  const urls = [
    ...ctx.corePages.filter((p) => p.indexable !== false).map((p) => ({ loc: `${SITE}${p.path}`, lastmod: p.lastmod })),
    ...results.filter((x) => x.indexable).map((x) => ({ loc: `${SITE}${x.route}`, lastmod: ctx.records.find((r) => r.id === x.id).substantiveModified })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- generated by publisher: core pages from content/core-pages.json plus approved, published records only -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`).join("\n")}
</urlset>
`;
}

// ── plan: what a build would write, and why ────────────────────────────────

export function plan(ctx) {
  const results = ctx.records.map((r) => evaluate(r, ctx));
  const files = new Map(); // path -> content
  for (const x of results) {
    const r = ctx.records.find((o) => o.id === x.id);
    if (x.eligible) files.set(`${x.route.slice(1)}index.html`, renderPage(r, ctx));
    if (r.status === "retired" && r.redirectTo && x.route) files.set(`${x.route.slice(1)}index.html`, renderRedirect(r, ctx));
  }
  files.set("sitemap.xml", renderSitemap(ctx, results));
  return { results, files };
}

export function decisionOf(x) {
  if (x.eligible) return x.indexable ? "publish" : "publish (noindex)";
  if (x.status === "retired") return "retired";
  if (x.status === "published") return "BLOCKED (marked published)";
  return "not published";
}
