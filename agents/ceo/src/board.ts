// Reading and writing the job board (D1). No decisions here: those live in job-runner.ts.
import type { Pipeline } from "./types.ts";

export type JobStatus = "running" | "needs_you" | "done" | "stopped";
export type StepStatus = "pending" | "running" | "needs_you" | "done" | "blocked" | "failed" | "stopped";

export interface JobRow {
  id: string;
  pipeline: string;
  title: string;
  input: string;
  status: JobStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface StepRow {
  id: string;
  job_id: string;
  position: number;
  department: string;
  name: string;
  status: StepStatus;
  attempts: number;
  note: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface OutputRow {
  id: number;
  job_id: string;
  step_id: string;
  attempt: number;
  kind: "result" | "carried_out";
  body: string;
  created_at: string;
}

export interface ApprovalRow {
  id: string;
  job_id: string;
  step_id: string;
  kind: "send" | "deploy" | "sign" | "spend";
  summary: string;
  detail: string;
  decision: "waiting" | "yes" | "no";
  created_at: string;
  decided_at: string | null;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export async function createJob(
  db: D1Database,
  job: { id: string; pipeline: Pipeline; title: string; input: { client: string; text: string }; note: string },
): Promise<void> {
  const stmts = [
    db
      .prepare("INSERT INTO jobs (id, pipeline, title, input, note) VALUES (?, ?, ?, ?, ?)")
      .bind(job.id, job.pipeline.id, job.title, JSON.stringify(job.input), job.note),
    ...job.pipeline.steps.map((s, i) =>
      db
        .prepare("INSERT INTO steps (id, job_id, position, department, name) VALUES (?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), job.id, i, s.department, s.name),
    ),
  ];
  await db.batch(stmts);
}

export const getJob = (db: D1Database, id: string) =>
  db.prepare("SELECT * FROM jobs WHERE id = ?").bind(id).first<JobRow>();

export const getSteps = async (db: D1Database, jobId: string) =>
  (await db.prepare("SELECT * FROM steps WHERE job_id = ? ORDER BY position").bind(jobId).all<StepRow>()).results;

export const getOutputs = async (db: D1Database, jobId: string) =>
  (await db.prepare("SELECT * FROM outputs WHERE job_id = ? ORDER BY id").bind(jobId).all<OutputRow>()).results;

export const getApprovals = async (db: D1Database, jobId: string) =>
  (await db.prepare("SELECT * FROM approvals WHERE job_id = ? ORDER BY created_at").bind(jobId).all<ApprovalRow>())
    .results;

export const getApproval = (db: D1Database, id: string) =>
  db.prepare("SELECT * FROM approvals WHERE id = ?").bind(id).first<ApprovalRow>();

export function setJobStatus(db: D1Database, id: string, status: JobStatus) {
  return db.prepare(`UPDATE jobs SET status = ?, updated_at = ${NOW} WHERE id = ?`).bind(status, id).run();
}

export function setStep(
  db: D1Database,
  id: string,
  fields: { status: StepStatus; note?: string | null; started?: boolean; finished?: boolean; attempt?: boolean },
) {
  const sets = ["status = ?", "note = ?"];
  if (fields.started) sets.push(`started_at = ${NOW}`, "finished_at = NULL");
  if (fields.finished) sets.push(`finished_at = ${NOW}`);
  if (fields.attempt) sets.push("attempts = attempts + 1");
  return db
    .prepare(`UPDATE steps SET ${sets.join(", ")} WHERE id = ?`)
    .bind(fields.status, fields.note ?? null, id)
    .run();
}

export function addOutput(
  db: D1Database,
  o: { jobId: string; stepId: string; attempt: number; kind: OutputRow["kind"]; body: unknown },
) {
  return db
    .prepare("INSERT INTO outputs (job_id, step_id, attempt, kind, body) VALUES (?, ?, ?, ?, ?)")
    .bind(o.jobId, o.stepId, o.attempt, o.kind, JSON.stringify(o.body))
    .run();
}

export function addApprovals(
  db: D1Database,
  jobId: string,
  stepId: string,
  asks: { kind: ApprovalRow["kind"]; summary: string; detail: string }[],
) {
  return db.batch(
    asks.map((a) =>
      db
        .prepare("INSERT INTO approvals (id, job_id, step_id, kind, summary, detail) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), jobId, stepId, a.kind, a.summary, a.detail),
    ),
  );
}

export function decideApproval(db: D1Database, id: string, decision: "yes" | "no") {
  return db
    .prepare(`UPDATE approvals SET decision = ?, decided_at = ${NOW} WHERE id = ? AND decision = 'waiting'`)
    .bind(decision, id)
    .run();
}

/** Everything the dashboard shows, in three queries. */
export async function readBoard(db: D1Database) {
  const [jobs, steps, waiting] = await db.batch([
    db.prepare("SELECT * FROM jobs ORDER BY updated_at DESC LIMIT 200"),
    db.prepare(
      "SELECT steps.* FROM steps JOIN jobs ON jobs.id = steps.job_id ORDER BY steps.job_id, steps.position",
    ),
    db.prepare("SELECT * FROM approvals WHERE decision = 'waiting' ORDER BY created_at"),
  ]);
  return {
    jobs: jobs.results as unknown as JobRow[],
    steps: steps.results as unknown as StepRow[],
    waiting: waiting.results as unknown as ApprovalRow[],
  };
}
