// Offline checks for Labs: the project list is valid; the overview stays compact and
// keeps chrisdemetriou.com's nav; live projects open in a new window, write-ups in the
// same tab; filters work without script; nothing loads from elsewhere.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readProjects, checkProject, renderHome, renderProjectPage, renderFilterCss, renderSitemap, filterTopics, countLanguages } from "../scripts/build.mjs";

const projects = readProjects();
const today = "2031-05-04";
const home = renderHome(projects, today);
const pages = projects.map((p) => [p, renderProjectPage(p, projects, today)]);
const anchors = (html) => html.match(/<a [^>]*>/g) || [];
const esc = (s) => s.replace(/[.]/g, "\\.");

test("every project in projects.json passes its checks", () => {
  assert.ok(projects.length >= 2);
  assert.equal(new Set(projects.map((p) => p.slug)).size, projects.length, "slugs are unique");
});

test("project addresses must be on chrisdemetriou.com, slugs and topics URL-safe", () => {
  assert.throws(() => checkProject({ ...projects[0], url: "https://example.com/" }), /must be on chrisdemetriou.com/);
  assert.throws(() => checkProject({ ...projects[0], slug: "My App" }), /slug/);
  assert.throws(() => checkProject({ ...projects[0], topics: ["Type Script"] }), /topic/);
});

test("every page keeps chrisdemetriou.com's nav in the same tab, with Tech current", () => {
  for (const html of [home, ...pages.map(([, h]) => h)]) {
    for (const s of ["#biography", "#credits", "#media", "#worship", "#contact"]) assert.ok(html.includes(`href="https://chrisdemetriou.com/${s}"`), s);
    assert.match(html, /<a class="current" href="\/" aria-current="page">Tech<\/a>/);
    const nav = html.match(/<nav class="section-nav"[\s\S]*?<\/nav>/)[0];
    assert.ok(!nav.includes("_blank"));
  }
});

test("the overview has one compact card per project, with both ways in", () => {
  assert.equal((home.match(/<li class="pcard"/g) || []).length, projects.length);
  const cards = home.match(/<ul class="pcards">[\s\S]*?<\/ul>\s*<\/div>\s*<\/section>/)[0];
  for (const p of projects) {
    const live = anchors(cards).filter((a) => new RegExp(`href="${esc(p.url)}"`).test(a));
    assert.ok(live.length >= 1, `${p.slug} has an Open live link`);
    for (const a of live) assert.match(a, /target="_blank" rel="noopener"/);
    const more = anchors(cards).filter((a) => a.includes(`href="/${p.slug}/"`));
    assert.ok(more.length >= 1, `${p.slug} links to its write-up`);
    for (const a of more) assert.ok(!a.includes("_blank"), "write-ups open in the same tab");
  }
  assert.ok(!home.includes('<section class="arch"'), "architecture lives on the project pages, not the overview");
});

test("the overview shows the key numbers", () => {
  assert.match(home, /<dt>Projects<\/dt><dd>\d+<\/dd>/);
  assert.match(home, /<dd>\d+ \w+ \d{4}<\/dd>/, "last updated date");
});

test("technology filters: one row at most, each with a rule, no script", () => {
  const topics = filterTopics(projects);
  assert.ok(topics.length <= 8);
  const css = renderFilterCss(projects);
  for (const t of topics) {
    assert.ok(home.includes(`id="f-${t}"`), t);
    assert.ok(css.includes(`#f-${t}:checked`) && css.includes(`[data-topics~="${t}"]`), t);
  }
  assert.ok(!/<script(?! type="application\/ld\+json")/.test(home), "no scripts besides structured data");
});

test("each project page is a full write-up; its outside links open in a new window", () => {
  for (const [p, html] of pages) {
    assert.ok(html.includes('<article class="repo"'), p.slug);
    assert.ok(html.includes('<section class="arch"'), `${p.slug} has its architecture drawing`);
    assert.ok(html.includes('<ul class="topics">'), `${p.slug} has its tags`);
    assert.ok(html.includes('href="/">← All projects</a>'), `${p.slug} links back`);
    const card = html.match(/<article class="repo"[\s\S]*?<\/article>/)[0];
    for (const a of anchors(card)) assert.match(a, /target="_blank" rel="noopener"/);
    assert.ok(html.includes("(opens in a new window)"));
  }
});

test("pictures come from this site only (the CSP allows nothing else)", () => {
  for (const html of [home, ...pages.map(([, h]) => h)]) {
    for (const [, src] of html.matchAll(/<img [^>]*src="([^"]+)"/g)) assert.ok(src.startsWith("/"), src);
  }
});

test("footer year is a placeholder the Worker fills in", () => {
  assert.ok(home.includes("<span data-year>2031</span>"));
});

test("the sitemap lists every project page", () => {
  const map = renderSitemap(projects, today);
  for (const p of projects) assert.ok(map.includes(`/${p.slug}/</loc>`), p.slug);
});

test("the website's own languages leave out Labs and the PMO", () => {
  const langs = countLanguages(fileURLToPath(new URL("../..", import.meta.url)), ["labs/", "chrisdemetriou-PMO/", ".github/"]);
  assert.ok(langs.some((l) => l.name === "HTML"));
  assert.ok(Math.abs(langs.reduce((n, l) => n + l.pct, 0) - 100) < 0.01);
});
