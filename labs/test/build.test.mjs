// Offline checks for the Labs page: the project list is valid, and the page keeps
// chrisdemetriou.com's nav, opens projects in a new window and loads nothing from elsewhere.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readProjects, checkProject, renderHome, countLanguages } from "../scripts/build.mjs";

const projects = readProjects();
const html = renderHome(projects, "2031-05-04");

test("every project in projects.json passes its checks", () => {
  assert.ok(projects.length >= 2);
  assert.deepEqual(projects.map((p) => p.slug).sort(), [...new Set(projects.map((p) => p.slug))].sort(), "slugs are unique");
});

test("project addresses must be on chrisdemetriou.com", () => {
  const p = { ...projects[0], url: "https://example.com/" };
  assert.throws(() => checkProject(p), /must be on chrisdemetriou.com/);
});

test("the nav matches chrisdemetriou.com (same tab), with Tech as this page", () => {
  for (const s of ["#biography", "#credits", "#media", "#worship", "#contact"]) assert.ok(html.includes(`href="https://chrisdemetriou.com/${s}"`), s);
  assert.match(html, /<a class="current" href="\/" aria-current="page">Tech<\/a>/);
  const nav = html.match(/<nav class="section-nav"[\s\S]*?<\/nav>/)[0];
  assert.ok(!nav.includes("_blank"), "the site's own nav stays in the same tab");
});

test("every link in a project card opens in a new window, and says so", () => {
  const cards = (html.match(/<article class="repo"[\s\S]*?<\/article>/g) || []).join("\n");
  for (const a of cards.match(/<a [^>]*>/g) || []) assert.match(a, /target="_blank" rel="noopener"/);
  for (const p of projects) {
    const links = cards.match(new RegExp(`<a [^>]*href="${p.url.replace(/[.]/g, "\\.")}"[^>]*>`, "g")) || [];
    assert.ok(links.length >= 2, `${p.slug} is linked`);
  }
  assert.ok(html.includes("(opens in a new window)"));
});

test("each project shows tags and an architecture drawing", () => {
  assert.equal((html.match(/<ul class="topics">/g) || []).length, projects.length);
  assert.equal((html.match(/<section class="arch"/g) || []).length, projects.length);
});

test("pictures come from this site only (the CSP allows nothing else)", () => {
  for (const [, src] of html.matchAll(/<img [^>]*src="([^"]+)"/g)) assert.ok(src.startsWith("/"), src);
});

test("footer year is a placeholder the Worker fills in", () => {
  assert.ok(html.includes("<span data-year>2031</span>"));
});

test("the website's own languages leave out Labs and the PMO", () => {
  const langs = countLanguages(new URL("../..", import.meta.url).pathname, ["labs/", "chrisdemetriou-PMO/", ".github/"]);
  assert.ok(langs.some((l) => l.name === "HTML"));
  assert.ok(Math.abs(langs.reduce((n, l) => n + l.pct, 0) - 100) < 0.01);
});
