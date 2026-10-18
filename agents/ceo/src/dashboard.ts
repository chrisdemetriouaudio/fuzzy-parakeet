// The one dashboard. Same shape as the PMO pages: Needs you, then In progress, then Done (folded).
import type { ApprovalRow, JobRow, OutputRow, StepRow } from "./board.ts";
import { departments } from "./departments.ts";
import { KIND_LABEL } from "./gates.ts";
import { pipelineById, pipelines } from "./pipelines.ts";
import type { DepartmentId } from "./types.ts";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const STEP_SYMBOL: Record<StepRow["status"], string> = {
  pending: "○",
  running: "🛠️",
  needs_you: "👉",
  done: "✅",
  blocked: "🔴",
  failed: "🔴",
  stopped: "🅿️",
};

const STEP_WORD: Record<StepRow["status"], string> = {
  pending: "Not started",
  running: "Working",
  needs_you: "Needs you",
  done: "Done",
  blocked: "Blocked",
  failed: "Failed",
  stopped: "Stopped",
};

const dept = (id: string) => departments[id as DepartmentId];
const deptLabel = (id: string) => `${dept(id)?.emoji ?? ""} ${dept(id)?.name ?? id}`;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

function page(title: string, body: string, refresh: boolean): string {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${refresh ? '<meta http-equiv="refresh" content="3">' : ""}
<title>${esc(title)}</title>
<style>
:root { --bg:#fbfaf7; --card:#fff; --ink:#1d1d1b; --muted:#5f5e58; --line:#e3e0d8; --accent:#1f5f8b; --yes:#1e7a3c; --no:#a1322a; --you:#fff6db; }
@media (prefers-color-scheme: dark) { :root { --bg:#161615; --card:#21211f; --ink:#f1efe9; --muted:#b4b1a8; --line:#3a3936; --accent:#7cb8e4; --yes:#5cc47f; --no:#f08a80; --you:#3a3320; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:18px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 780px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 1.6rem; margin: 0 0 4px; } h2 { font-size: 1.25rem; margin: 32px 0 12px; }
a { color: var(--accent); }
.muted { color: var(--muted); font-size: .9rem; }
.glance { border-left: 4px solid var(--accent); background: var(--card); padding: 12px 16px; border-radius: 6px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; margin: 10px 0; }
.card.you { background: var(--you); }
.row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top: 10px; }
button { font: inherit; font-size: 1rem; padding: 8px 18px; border-radius: 6px; border: 2px solid var(--line); background: var(--card); color: var(--ink); cursor: pointer; }
button.yes { border-color: var(--yes); color: var(--yes); font-weight: 600; }
button.no { border-color: var(--no); color: var(--no); }
textarea, input[type=text] { width: 100%; font: inherit; padding: 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--card); color: var(--ink); }
textarea { min-height: 110px; }
label { display:block; font-weight: 600; margin: 10px 0 4px; }
pre { white-space: pre-wrap; word-break: break-word; background: var(--bg); padding: 10px; border-radius: 6px; font-size: .9rem; }
details > summary { cursor: pointer; font-weight: 600; }
.steps { list-style: none; padding: 0; margin: 6px 0 0; }
.steps li { padding: 2px 0; }
.empty { color: var(--muted); }
</style>
</head>
<body><main>${body}</main></body></html>`;
}

function stepLine(s: StepRow, total: number): string {
  const note = s.note && s.status !== "done" ? ` <span class="muted">· ${esc(s.note)}</span>` : "";
  return `<li>${STEP_SYMBOL[s.status]} <strong>${s.position + 1} of ${total}: ${esc(deptLabel(s.department))}</strong> · ${esc(s.name)} · ${STEP_WORD[s.status]}${note}</li>`;
}

function askCard(a: ApprovalRow, job: JobRow | undefined): string {
  return `<div class="card you">
  <div>👉 <strong>${esc(KIND_LABEL[a.kind])}:</strong> ${esc(a.summary)}</div>
  <div class="muted">${job ? `<a href="/jobs/${esc(job.id)}">${esc(job.title)}</a>` : ""}</div>
  <details><summary>Read it first</summary><pre>${esc(a.detail)}</pre></details>
  <form method="post" action="/approvals/${esc(a.id)}" class="row">
    <button class="yes" name="decision" value="yes">Yes</button>
    <button class="no" name="decision" value="no">No, stop the job</button>
  </form>
  <div class="muted">Phase 1 sends nothing. Yes just records it, so you do it by hand.</div>
</div>`;
}

function stuckCard(job: JobRow, step: StepRow): string {
  const retryFrom = pipelineById(job.pipeline)?.steps[step.position]?.retryFrom;
  const back = step.status === "blocked" && retryFrom !== undefined ? "Send back" : "Try again";
  return `<div class="card you">
  <div>🔴 <strong>${esc(deptLabel(step.department))}:</strong> ${esc(step.note ?? STEP_WORD[step.status])}</div>
  <div class="muted"><a href="/jobs/${esc(job.id)}">${esc(job.title)}</a></div>
  <div class="row">
    <form method="post" action="/jobs/${esc(job.id)}/retry"><button class="yes">${back}</button></form>
    <form method="post" action="/jobs/${esc(job.id)}/stop"><button class="no">Stop the job</button></form>
  </div>
</div>`;
}

function jobCard(job: JobRow, steps: StepRow[]): string {
  return `<div class="card">
  <div><a href="/jobs/${esc(job.id)}"><strong>${esc(job.title)}</strong></a></div>
  <ul class="steps">${steps.map((s) => stepLine(s, steps.length)).join("")}</ul>
</div>`;
}

export function boardPage(
  board: { jobs: JobRow[]; steps: StepRow[]; waiting: ApprovalRow[] },
  opts: { live: boolean; message?: string },
): string {
  const stepsOf = (id: string) => board.steps.filter((s) => s.job_id === id);
  const jobById = new Map(board.jobs.map((j) => [j.id, j]));
  const stuck = board.jobs
    .filter((j) => j.status === "needs_you")
    .map((j) => ({ job: j, step: stepsOf(j.id).find((s) => s.status === "blocked" || s.status === "failed") }))
    .filter((x): x is { job: JobRow; step: StepRow } => Boolean(x.step));
  const inProgress = board.jobs.filter((j) => j.status === "running" || j.status === "needs_you");
  const finished = board.jobs.filter((j) => j.status === "done" || j.status === "stopped");
  const needsYou = board.waiting.length + stuck.length;
  const working = board.jobs.some((j) => j.status === "running");

  const body = `
<h1>🧭 CEO agent</h1>
<div class="glance">
  <strong>At a glance:</strong> ${needsYou} need${needsYou === 1 ? "s" : ""} you · ${inProgress.length} in progress · ${finished.length} done.<br>
  <span class="muted">Phase 1 · runs on this Mac only · ${opts.live ? "Live: Claude answers" : "Offline: stand-in answers, no API key"} · nothing is ever sent or deployed.</span>
</div>
${opts.message ? `<div class="card">${esc(opts.message)}</div>` : ""}

<h2>👉 Needs you</h2>
${needsYou ? board.waiting.map((a) => askCard(a, jobById.get(a.job_id))).join("") + stuck.map((x) => stuckCard(x.job, x.step)).join("") : '<p class="empty">Nothing needs you right now.</p>'}

<h2>⏳ In progress</h2>
${inProgress.length ? inProgress.map((j) => jobCard(j, stepsOf(j.id))).join("") : '<p class="empty">No jobs running.</p>'}

<h2>🗣️ Tell the CEO</h2>
<form method="post" action="/ideas" class="card">
  <label for="client">Who is it for?</label>
  <input type="text" id="client" name="client" placeholder="e.g. Acme Plumbing" required maxlength="120">
  <label for="text">What do they need?</label>
  <textarea id="text" name="text" placeholder="Paste the client's message, or say what you want done." required maxlength="8000"></textarea>
  <div class="row"><button class="yes">Start</button>
  <span class="muted">Pipelines on: ${pipelines.map((p) => esc(p.name)).join(", ")}.</span></div>
</form>

<details class="card"><summary>✅ Done (${finished.length})</summary>
${finished.length ? finished.map((j) => `<div>${j.status === "done" ? "✅" : "🅿️"} <a href="/jobs/${esc(j.id)}">${esc(j.title)}</a> <span class="muted">· ${j.status === "done" ? "Done" : "Stopped"} ${esc(shortDate(j.updated_at))}</span></div>`).join("") : '<p class="empty">Nothing finished yet.</p>'}
</details>
${working ? '<p class="muted">This page refreshes every 3 seconds while a job is working.</p>' : ""}`;
  return page("CEO agent", body, working);
}

export function jobPage(job: JobRow, steps: StepRow[], outputs: OutputRow[], approvals: ApprovalRow[]): string {
  const input = JSON.parse(job.input) as { client: string; text: string };
  const stepBlocks = steps
    .map((s) => {
      const outs = outputs.filter((o) => o.step_id === s.id);
      const asks = approvals.filter((a) => a.step_id === s.id);
      const results = outs
        .filter((o) => o.kind === "result")
        .map((o) => {
          const r = JSON.parse(o.body) as { summary?: string };
          return `<div><strong>Try ${o.attempt}:</strong> ${esc(r.summary ?? "")}</div>
<details><summary>Full answer</summary><pre>${esc(JSON.stringify(r, null, 2))}</pre></details>`;
        })
        .join("");
      const askLines = asks
        .map((a) => {
          const word = a.decision === "waiting" ? "👉 Waiting for you" : a.decision === "yes" ? "✅ You said yes" : "🅿️ You said no";
          const done = outs.find((o) => o.kind === "carried_out" && (JSON.parse(o.body) as { approval?: string }).approval === a.id);
          const note = done ? `<div class="muted">${esc((JSON.parse(done.body) as { note: string }).note)}</div>` : "";
          return `<div class="card"><strong>${esc(KIND_LABEL[a.kind])}:</strong> ${esc(a.summary)} · ${word}${note}
<details><summary>What it says</summary><pre>${esc(a.detail)}</pre></details></div>`;
        })
        .join("");
      return `<div class="card">
  <ul class="steps">${stepLine(s, steps.length)}</ul>
  ${results}${askLines}
</div>`;
    })
    .join("");
  const status = { running: "⏳ In progress", needs_you: "👉 Needs you", done: "✅ Done", stopped: "🅿️ Stopped" }[job.status];
  const body = `
<p><a href="/">← Back to the dashboard</a></p>
<h1>${esc(job.title)}</h1>
<div class="glance">
  <strong>Status:</strong> ${status} · <strong>Client:</strong> ${esc(input.client)} · <strong>Started:</strong> ${esc(shortDate(job.created_at))}<br>
  <span class="muted">${esc(job.note ?? "")}</span>
</div>
<details class="card"><summary>What came in</summary><pre>${esc(input.text)}</pre></details>
<h2>Steps</h2>
${stepBlocks}
${job.status === "running" || job.status === "needs_you" ? `<form method="post" action="/jobs/${esc(job.id)}/stop"><button class="no">Stop the job</button></form>` : ""}`;
  return page(job.title, body, job.status === "running");
}
