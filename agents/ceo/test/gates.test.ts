// Gates and permissions: run with `npm test` (Node's own test runner, no Cloudflare needed).
import assert from "node:assert/strict";
import { test } from "node:test";
import { departments } from "../src/departments.ts";
import { carryOut, OUTWARD_KINDS, reviewResult, stepAfterDecisions } from "../src/gates.ts";
import { pipelines } from "../src/pipelines.ts";
import type { Brief, DepartmentId } from "../src/types.ts";

const brief = (text: string, attempt = 1): Brief => ({
  jobTitle: "Fix: contact form",
  pipeline: "Fix-it ticket",
  stepName: "test",
  attempt,
  input: { client: "Acme Plumbing", text },
  earlier: [],
  settings: { fixItPrice: "" },
});

test("phase 1 switches on exactly six departments", () => {
  assert.deepEqual(Object.keys(departments).sort(), ["copy", "devops", "engineering", "finance", "qa", "sales"]);
});

test("Fix-it ticket runs Sales, Engineering, QA, Finance in that order", () => {
  const fixIt = pipelines.find((p) => p.id === "fix-it-ticket");
  assert.ok(fixIt);
  assert.deepEqual(fixIt.steps.map((s) => s.department), ["sales", "engineering", "qa", "finance"]);
  for (const s of fixIt.steps) assert.ok(departments[s.department], `${s.department} exists`);
});

test("Engineering and QA may not ask for anything outward-facing", () => {
  assert.deepEqual(departments.engineering.mayPropose, []);
  assert.deepEqual(departments.qa.mayPropose, []);
});

test("an outward ask is always gated, never done", () => {
  const r = reviewResult(departments.sales, departments.sales.offline(brief("The contact form is broken.")));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.gated.length, 1);
  assert.equal(r.gated[0].kind, "send");
});

test("asking for a kind the department is not allowed fails the step", () => {
  const raw = { summary: "Fixed.", blocker: "", actions: [{ kind: "deploy", summary: "Deploy it", detail: "now" }] };
  const r = reviewResult(departments.engineering, raw);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.problem, /not allowed/);
});

test("unknown kinds and missing fields fail the step", () => {
  const d = departments.sales;
  assert.equal(reviewResult(d, null).ok, false);
  assert.equal(reviewResult(d, { summary: "", actions: [], blocker: "" }).ok, false);
  assert.equal(reviewResult(d, { summary: "x", blocker: "" }).ok, false);
  assert.equal(reviewResult(d, { summary: "x", blocker: "", actions: [{ kind: "email", summary: "x", detail: "" }] }).ok, false);
  assert.equal(reviewResult(d, { summary: "x", blocker: "", actions: [{ kind: "send", summary: " ", detail: "" }] }).ok, false);
});

test("a blocker is passed on so the job stops for Chris", () => {
  const r = reviewResult(departments.qa, departments.qa.offline(brief("Menu broken #fail-qa", 1)));
  assert.equal(r.ok, true);
  if (r.ok) assert.notEqual(r.blocker, "");
  const second = reviewResult(departments.qa, departments.qa.offline(brief("Menu broken #fail-qa", 2)));
  assert.equal(second.ok && second.blocker, "");
});

test("every department's offline answer passes its own review", () => {
  for (const id of Object.keys(departments) as DepartmentId[]) {
    const r = reviewResult(departments[id], departments[id].offline(brief("The booking page shows an error.")));
    assert.equal(r.ok, true, id);
  }
});

test("every schema asks for summary, actions and blocker, and allows only the four outward kinds", () => {
  for (const d of Object.values(departments)) {
    const schema = d.outputSchema as { required: string[]; properties: { actions: { items: { properties: { kind: { enum: string[] } } } } } };
    for (const f of ["summary", "actions", "blocker"]) assert.ok(schema.required.includes(f), `${d.id} requires ${f}`);
    assert.deepEqual(schema.properties.actions.items.properties.kind.enum, [...OUTWARD_KINDS]);
  }
});

test("one no stops the step; any waiting keeps it waiting; all yes goes on", () => {
  assert.equal(stepAfterDecisions(["yes", "no"]), "stop");
  assert.equal(stepAfterDecisions(["yes", "waiting"]), "waiting");
  assert.equal(stepAfterDecisions(["yes", "yes"]), "go");
});

test("carrying out an approved action does nothing in phase 1", () => {
  const out = carryOut({ kind: "send", summary: "Send the invoice to Acme", detail: "..." });
  assert.equal(out.done, false);
  assert.match(out.note, /by hand/);
});
