// End-to-end check against the local Worker (start it first with `npm run dev`).
// Runs two Fix-it tickets offline:
//   1. the happy path: quote -> yes -> engineering -> QA -> invoice -> yes -> done
//   2. QA fails once (#fail-qa) -> send back -> engineering again -> QA passes -> stop at invoice
// Nothing is sent anywhere: approvals only record a yes.
import assert from "node:assert/strict";

const BASE = process.env.CEO_URL ?? "http://127.0.0.1:8797";
const origin = new URL(BASE).origin;

const post = (path, fields) =>
  fetch(BASE + path, {
    method: "POST",
    redirect: "manual",
    headers: { origin, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });

const job = async (id) => (await fetch(`${BASE}/api/jobs/${id}`)).json();

async function waitFor(id, ok, what) {
  for (let i = 0; i < 100; i++) {
    const j = await job(id);
    if (ok(j)) return j;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timed out waiting for: ${what}\n${JSON.stringify(await job(id), null, 2)}`);
}

const statusOf = (j) => j.steps.map((s) => s.status).join(",");
const waitingAsks = (j) => j.approvals.filter((a) => a.decision === "waiting");

async function start(client, text) {
  const res = await post("/ideas", { client, text });
  assert.equal(res.status, 303, "new job redirects");
  return res.headers.get("location").split("/").pop();
}

// A POST from another site is refused.
const foreign = await fetch(BASE + "/ideas", {
  method: "POST",
  headers: { origin: "https://evil.example", "content-type": "application/x-www-form-urlencoded" },
  body: "client=x&text=y",
});
assert.equal(foreign.status, 403, "cross-site POST refused");

// 1. Happy path.
const a = await start("Acme Plumbing", "Our contact form stopped sending e-mails last week.");
let j = await waitFor(a, (j) => waitingAsks(j).length === 1, "Sales quote waiting for Chris");
assert.equal(j.job.status, "needs_you");
assert.equal(statusOf(j), "needs_you,pending,pending,pending", "nothing runs past the gate");
assert.equal(j.approvals[0].kind, "send");

await post(`/approvals/${j.approvals[0].id}`, { decision: "yes" });
j = await waitFor(a, (j) => waitingAsks(j).length === 1 && j.steps[3].status === "needs_you", "invoice waiting");
assert.equal(statusOf(j), "done,done,done,needs_you");
assert.ok(j.outputs.some((o) => o.kind === "carried_out" && JSON.parse(o.body).done === false), "yes sent nothing");

const invoice = waitingAsks(j)[0];
await post(`/approvals/${invoice.id}`, { decision: "yes" });
j = await waitFor(a, (j) => j.job.status === "done", "job done");
assert.equal(statusOf(j), "done,done,done,done");
console.log("✅ Happy path: quote and invoice both waited for a yes, then done.");

// 2. QA fails once, gets sent back, then the invoice is refused.
const b = await start("Hope Charity", "The donate button does nothing on phones. #fail-qa");
j = await waitFor(b, (j) => waitingAsks(j).length === 1, "Sales quote waiting");
await post(`/approvals/${j.approvals[0].id}`, { decision: "yes" });
j = await waitFor(b, (j) => j.steps[2].status === "blocked", "QA blocked");
assert.equal(j.job.status, "needs_you");

await post(`/jobs/${b}/retry`, {});
j = await waitFor(b, (j) => j.steps[3].status === "needs_you", "invoice waiting after send-back");
assert.equal(j.steps[1].attempts, 2, "Engineering ran again");
assert.equal(j.steps[2].attempts, 2, "QA ran again");

await post(`/approvals/${waitingAsks(j)[0].id}`, { decision: "no" });
j = await waitFor(b, (j) => j.job.status === "stopped", "job stopped after a no");
console.log("✅ Send-back path: QA failed, went back to Engineering, passed; a no stopped the job.");

// The dashboard renders all three sections.
const page = await (await fetch(BASE + "/")).text();
for (const h of ["Needs you", "In progress", "Done ("]) assert.ok(page.includes(h), `dashboard shows ${h}`);
console.log("✅ Dashboard shows Needs you, In progress and Done.");
