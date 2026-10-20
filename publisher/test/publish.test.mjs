// node --test publisher/test
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, plan, versionHash, renderPage, RUBRIC } from "../lib.mjs";
import { loadContext } from "../cli.mjs";

const families = {
  "case-studies": { label: "Case study", route: "work", enabled: true, maxPages: 8, requiresOriginalNotes: true },
  resources: { label: "Resource", route: "resources", enabled: true, maxPages: 6, requiresOriginalNotes: false },
  services: { label: "Service", route: "services", enabled: false, maxPages: 6, requiresOriginalNotes: true },
};
const corePages = [{ path: "/", intentKey: "hire-custom-software-developer-consultant", indexable: true, lastmod: "2026-10-20", text: "Custom software that solves your business problems." }];
const pass = Object.fromEntries(RUBRIC.map((k) => [k, "pass"]));

// A well-supported case study: confirmed claims, Chris's own notes, cleared media.
function goodRecord(over = {}) {
  return {
    id: "case-good", family: "case-studies", slug: "good-project", status: "published",
    title: "Rebuilding a booking process for a small trade business",
    audience: "Small trade businesses", uniqueValue: "Shows a real before-and-after with the owner's numbers.",
    intent: { key: "rebuild-trade-booking-process", primary: "How do you stop double bookings?" },
    seo: { title: "Trade booking process case study | Chris Demetriou", description: "How a small trade business moved bookings out of a shared inbox and stopped double-booking, with the owner's own numbers." },
    role: { summary: "Designed and built the booking tool.", relationship: "commissioned", status: "owner-provided" },
    claims: [
      { id: "c1", kind: "fact", text: "Bookings moved from a shared inbox to an online form.", status: "owner-provided", sources: [{ ref: "intake:2026-11-02", public: false }] },
      { id: "c2", kind: "outcome", text: "Double bookings stopped in the first month.", status: "independently-supported", sources: [{ ref: "client email, 2026-12-01 (private)", public: false }] },
    ],
    body: [
      { text: "Bookings moved out of a shared inbox and onto an online form that only offers free slots. Double bookings stopped in the first month, according to the owner.", claims: ["c1", "c2"] },
      { heading: "What I built", text: "A form, a diary check and a confirmation email.", claims: ["c1"] },
    ],
    originalNotes: [{ text: "The hard part was the owner's rule that Fridays are for repairs only.", source: "intake:2026-11-02", status: "owner-provided" }],
    media: [{ src: "/images/x.jpg", alt: "The booking form", rights: "owned" }],
    links: { internal: ["/", "/#contact"], related: [] },
    nextAction: { label: "Describe your problem", href: "/#contact" },
    location: null, localEvidence: [], indexable: true, substantiveModified: "2026-12-02",
    ...over,
  };
}
function ctxWith(records, approvals = null) {
  const appr = approvals ?? records.map((r) => ({ id: r.id, versionHash: versionHash(r), reviewer: "Chris Demetriou", date: "2026-12-03", rubric: pass, acknowledgedFlags: [] }));
  return { families, corePages, records, approvals: appr, today: "2026-12-10", fileExists: () => true };
}
const gates = (x) => x.errors.map((e) => e.gate);

test("a legitimate, well-supported case study passes and is published, indexable and in the sitemap", () => {
  const r = goodRecord();
  const ctx = ctxWith([r]);
  const x = evaluate(r, ctx);
  assert.deepEqual(x.errors, []);
  assert.deepEqual(x.approvalProblems, []);
  assert.equal(x.eligible, true);
  const { files } = plan(ctx);
  assert.match(files.get("sitemap.xml"), /https:\/\/chrisdemetriou\.com\/work\/good-project\//);
  const html = files.get("work/good-project/index.html");
  assert.match(html, /<link rel="canonical" href="https:\/\/chrisdemetriou\.com\/work\/good-project\/">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(html, /<h1>Rebuilding a booking process/);
});

test("rejects a city swapped into an otherwise identical page", () => {
  const a = goodRecord({ id: "case-mcr", slug: "booking-manchester", location: "Manchester", localEvidence: [{ text: "Client is in Salford", source: "intake:1" }] });
  const b = goodRecord({
    id: "case-leeds", slug: "booking-leeds", location: "Leeds", localEvidence: [],
    intent: { key: "rebuild-trade-booking-process-leeds", primary: "How do you stop double bookings in Leeds?" },
    seo: { title: "Trade booking process case study Leeds | Chris Demetriou", description: a.seo.description.replace("small trade business", "small Leeds trade business") },
  });
  const x = evaluate(b, ctxWith([a, b]));
  assert.ok(gates(x).includes("location"));
  assert.ok(x.flags.includes("similar-to:case-mcr"), "near-identical copy is flagged for review");
  assert.equal(x.eligible, false);
});

test("rejects a credit padded with invented behind-the-scenes detail", () => {
  const r = goodRecord({
    claims: [...goodRecord().claims, { id: "c3", kind: "process", text: "We worked through the night to finish the mix.", status: "awaiting-confirmation", sources: [{ ref: "none", public: true }] }],
    body: [...goodRecord().body, { text: "We worked through the night to finish the mix.", claims: ["c3"] }],
    originalNotes: [],
  });
  const x = evaluate(r, ctxWith([r]));
  assert.ok(gates(x).includes("evidence"));
  assert.ok(gates(x).includes("original"));
  assert.equal(x.eligible, false);
});

test("rejects a page that makes Chris an award nominee", () => {
  const r = goodRecord({ title: "From Oscar-nominated producer to software developer" });
  const x = evaluate(r, ctxWith([r]));
  assert.ok(gates(x).includes("awards"));
  // the accurate form passes
  const ok = goodRecord({ body: [{ text: "I was a performer on an Oscar-nominated song.", claims: ["c1"] }, goodRecord().body[1]] });
  assert.ok(!gates(evaluate(ok, ctxWith([ok]))).includes("awards"));
});

test("rejects a media page that is only an embed", () => {
  const r = goodRecord({ media: [{ src: "https://www.youtube.com/embed/x", type: "embed", alt: "Video", rights: "embed-permitted", permissionSource: "YouTube embed" }], body: [{ text: "Watch the video.", claims: ["c1"] }] });
  const x = evaluate(r, ctxWith([r]));
  assert.ok(x.errors.some((e) => e.gate === "media" && /embed/.test(e.msg)));
});

test("rejects two pages for the same task, even when worded differently", () => {
  const a = goodRecord();
  const b = goodRecord({ id: "case-other", slug: "stop-double-bookings", title: "How to stop double-booking jobs", seo: { title: "Stop double bookings | Chris Demetriou", description: "A different wording of the same question about double bookings for trade businesses and how to fix it for good." } });
  const x = evaluate(b, ctxWith([a, b]));
  assert.ok(gates(x).includes("intent"));
});

test("an unapproved page can never reach the sitemap", () => {
  const draft = goodRecord({ id: "case-draft", slug: "draft-page", status: "draft", intent: { key: "k-draft" }, seo: { ...goodRecord().seo, title: "Draft page title here | Chris Demetriou" } });
  const sneaky = goodRecord({ id: "case-sneaky", slug: "sneaky-page", status: "published", intent: { key: "k-sneaky" }, seo: { ...goodRecord().seo, title: "Sneaky page title | Chris Demetriou" } });
  const ctx = ctxWith([draft, sneaky], []); // no approvals at all
  const { files, results } = plan(ctx);
  const sitemap = files.get("sitemap.xml");
  assert.doesNotMatch(sitemap, /draft-page|sneaky-page/);
  assert.ok(!files.has("work/sneaky-page/index.html"));
  assert.ok(results.find((x) => x.id === "case-sneaky").approvalProblems.includes("no approval recorded"));
});

test("editing a published record after approval voids the approval", () => {
  const r = goodRecord();
  const ctx = ctxWith([r]);
  r.body = [{ text: "Bookings moved online and double bookings fell to zero, and revenue doubled.", claims: ["c1", "c2"] }, r.body[1]];
  const x = evaluate(r, ctx);
  assert.equal(x.eligible, false);
  assert.ok(x.approvalProblems.some((m) => /changed after it was approved/.test(m)));
});

test("an AI can't be the reviewer", () => {
  const r = goodRecord();
  const appr = [{ id: r.id, versionHash: versionHash(r), reviewer: "Claude", date: "2026-12-03", rubric: pass }];
  const x = evaluate(r, ctxWith([r], appr));
  assert.equal(x.eligible, false);
  assert.ok(x.approvalProblems.some((m) => /not a named person/.test(m)));
});

test("a failed rubric item blocks publication whatever the other scores", () => {
  const r = goodRecord();
  const appr = [{ id: r.id, versionHash: versionHash(r), reviewer: "Chris Demetriou", date: "2026-12-03", rubric: { ...pass, "honest-representation": "fail" } }];
  assert.equal(evaluate(r, ctxWith([r], appr)).eligible, false);
});

test("unsafe slugs, switched-off families and hand-written folders are refused", () => {
  for (const slug of ["../etc", "Upper-Case", "a", "double--hyphen", "x".repeat(61)]) {
    assert.ok(gates(evaluate(goodRecord({ slug }), ctxWith([goodRecord({ slug })]))).includes("route"), slug);
  }
  const svc = goodRecord({ family: "services" });
  assert.ok(gates(evaluate(svc, ctxWith([svc]))).includes("family"));
  const fams = { ...families, clash: { label: "x", route: "creative", enabled: true, maxPages: 2 } };
  const c = goodRecord({ family: "clash" });
  assert.ok(gates(evaluate(c, { ...ctxWith([c]), families: fams })).includes("route"));
});

test("a family can't grow past its cap", () => {
  const many = Array.from({ length: 9 }, (_, i) => goodRecord({ id: `case-${i}`, slug: `project-${i}`, intent: { key: `k${i}` }, seo: { ...goodRecord().seo, title: `Project number ${i} | Chris Demetriou` } }));
  assert.ok(gates(evaluate(many[0], ctxWith(many))).includes("route"));
});

test("placeholders, private links and stray contact details block publication", () => {
  const r = goodRecord({ body: [{ text: "TODO: add the result. Files at https://drive.google.com/x. Call 07700 900123 or email someone@example.com.", claims: ["c1"] }, goodRecord().body[1]] });
  const g = gates(evaluate(r, ctxWith([r])));
  assert.ok(g.includes("placeholders"));
  assert.ok(g.includes("privacy"));
});

test("a published noindex page is built with noindex and kept out of the sitemap", () => {
  const r = goodRecord({ indexable: false });
  const { files } = plan(ctxWith([r]));
  assert.match(files.get("work/good-project/index.html"), /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(files.get("sitemap.xml"), /good-project/);
});

test("retiring a page with a redirect writes a noindex stub and drops it from the sitemap", () => {
  const r = goodRecord({ status: "retired", redirectTo: "/#proof" });
  const { files } = plan(ctxWith([r]));
  const stub = files.get("work/good-project/index.html");
  assert.match(stub, /noindex/);
  assert.match(stub, /url=\/#proof/);
  assert.doesNotMatch(files.get("sitemap.xml"), /good-project/);
});

test("preview pages are always noindex and never canonical", () => {
  const html = renderPage(goodRecord({ status: "draft" }), ctxWith([goodRecord()]), { preview: true });
  assert.match(html, /content="noindex"/);
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.match(html, /PREVIEW/);
});

test("the repository's own records: nothing is published until Chris approves, and the sitemap lists only real pages", () => {
  const ctx = loadContext();
  const { results, files } = plan(ctx);
  for (const x of results) assert.equal(x.eligible, false, `${x.id} should not be publishable yet`);
  const locs = [...files.get("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, ctx.corePages.map((p) => `https://chrisdemetriou.com${p.path}`));
});
