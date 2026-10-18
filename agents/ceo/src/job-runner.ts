// One Durable Object per job. It is the only thing that changes a job once it exists,
// so two clicks (or a click during a running step) can never run a step twice.
//
// Flow: start() -> alarm() runs the next step -> alarm again ... until a step
// needs Chris (an outward ask, a blocker, a failure) or the job is done.
// decide() / retry() / stop() are Chris's answers from the dashboard.
import { DurableObject } from "cloudflare:workers";
import {
  addApprovals,
  addOutput,
  decideApproval,
  getApproval,
  getApprovals,
  getJob,
  getOutputs,
  getSteps,
  setJobStatus,
  setStep,
  type StepRow,
} from "./board.ts";
import { runDepartment, type ClaudeEnv } from "./claude.ts";
import { departments } from "./departments.ts";
import { carryOut, reviewResult, stepAfterDecisions } from "./gates.ts";
import { pipelineById } from "./pipelines.ts";
import type { Brief, DepartmentId, DepartmentResult } from "./types.ts";

export interface Env extends ClaudeEnv {
  DB: D1Database;
  JOB_RUNNER: DurableObjectNamespace<JobRunner>;
  FIXIT_PRICE?: string;
}

type Outcome = "next" | "wait";

export class JobRunner extends DurableObject<Env> {
  private get db() {
    return this.env.DB;
  }

  private async jobId(): Promise<string> {
    const id = await this.ctx.storage.get<string>("jobId");
    if (!id) throw new Error("This runner has no job.");
    return id;
  }

  /** Called once, right after the job is written to the board. */
  async start(jobId: string): Promise<void> {
    await this.ctx.storage.put("jobId", jobId);
    await this.ctx.storage.setAlarm(Date.now());
  }

  async alarm(): Promise<void> {
    const jobId = await this.jobId();
    let outcome: Outcome;
    try {
      outcome = await this.runNextStep(jobId);
    } catch (err) {
      // Never let the alarm retry on its own: put the problem in front of Chris instead.
      const steps = await getSteps(this.db, jobId);
      const running = steps.find((s) => s.status === "running");
      if (running) await setStep(this.db, running.id, { status: "failed", note: String(err), finished: true });
      await setJobStatus(this.db, jobId, "needs_you");
      return;
    }
    if (outcome === "next") await this.ctx.storage.setAlarm(Date.now());
  }

  private async runNextStep(jobId: string): Promise<Outcome> {
    const job = await getJob(this.db, jobId);
    if (!job || job.status !== "running") return "wait";
    const steps = await getSteps(this.db, jobId);
    if (steps.some((s) => s.status !== "pending" && s.status !== "done")) return "wait";
    const step = steps.find((s) => s.status === "pending");
    if (!step) {
      await setJobStatus(this.db, jobId, "done");
      return "wait";
    }

    const dept = departments[step.department as DepartmentId];
    await setStep(this.db, step.id, { status: "running", started: true, attempt: true });
    const attempt = step.attempts + 1;
    const brief = await this.brief(jobId, job.title, job.pipeline, JSON.parse(job.input), step, attempt);

    let raw: unknown;
    try {
      raw = await runDepartment(this.env, dept, brief);
    } catch (err) {
      await setStep(this.db, step.id, { status: "failed", note: (err as Error).message, finished: true });
      await setJobStatus(this.db, jobId, "needs_you");
      return "wait";
    }

    // Chris may have pressed Stop while the department was working.
    if ((await getJob(this.db, jobId))?.status !== "running") {
      await setStep(this.db, step.id, { status: "stopped", finished: true });
      return "wait";
    }

    await addOutput(this.db, { jobId, stepId: step.id, attempt, kind: "result", body: raw });
    const review = reviewResult(dept, raw);
    if (!review.ok) {
      await setStep(this.db, step.id, { status: "failed", note: review.problem, finished: true });
      await setJobStatus(this.db, jobId, "needs_you");
      return "wait";
    }
    if (review.blocker) {
      await setStep(this.db, step.id, { status: "blocked", note: review.blocker, finished: true });
      await setJobStatus(this.db, jobId, "needs_you");
      return "wait";
    }
    if (review.gated.length) {
      await addApprovals(this.db, jobId, step.id, review.gated);
      await setStep(this.db, step.id, { status: "needs_you", note: "Waiting for your yes." });
      await setJobStatus(this.db, jobId, "needs_you");
      return "wait";
    }
    await setStep(this.db, step.id, { status: "done", finished: true });
    return "next";
  }

  private async brief(
    jobId: string,
    title: string,
    pipelineId: string,
    input: Brief["input"],
    step: StepRow,
    attempt: number,
  ): Promise<Brief> {
    const [steps, outputs] = await Promise.all([getSteps(this.db, jobId), getOutputs(this.db, jobId)]);
    const earlier = steps
      .filter((s) => s.position < step.position && s.status === "done")
      .map((s) => {
        const latest = outputs.filter((o) => o.step_id === s.id && o.kind === "result").at(-1);
        return {
          department: s.department as DepartmentId,
          stepName: s.name,
          result: (latest ? JSON.parse(latest.body) : {}) as DepartmentResult,
        };
      });
    return {
      jobTitle: title,
      pipeline: pipelineById(pipelineId)?.name ?? pipelineId,
      stepName: step.name,
      attempt,
      input,
      earlier,
      settings: { fixItPrice: this.env.FIXIT_PRICE ?? "" },
    };
  }

  /** Chris says yes or no to one outward ask. */
  async decide(approvalId: string, decision: "yes" | "no"): Promise<void> {
    const jobId = await this.jobId();
    const ask = await getApproval(this.db, approvalId);
    if (!ask || ask.job_id !== jobId || ask.decision !== "waiting") return;
    await decideApproval(this.db, approvalId, decision);
    const step = (await getSteps(this.db, jobId)).find((s) => s.id === ask.step_id);
    if (!step) return;

    if (decision === "yes") {
      await addOutput(this.db, {
        jobId,
        stepId: step.id,
        attempt: step.attempts,
        kind: "carried_out",
        body: { approval: approvalId, ...carryOut(ask) },
      });
    }

    const asks = (await getApprovals(this.db, jobId)).filter((a) => a.step_id === step.id);
    const next = stepAfterDecisions(asks.map((a) => a.decision));
    if (next === "waiting") return;
    if (next === "stop") {
      await setStep(this.db, step.id, { status: "stopped", note: "You said no.", finished: true });
      await setJobStatus(this.db, jobId, "stopped");
      return;
    }
    await setStep(this.db, step.id, { status: "done", finished: true });
    await setJobStatus(this.db, jobId, "running");
    await this.ctx.storage.setAlarm(Date.now());
  }

  /** Run a blocked or failed step again, or go back to the step its pipeline names. */
  async retry(): Promise<void> {
    const jobId = await this.jobId();
    const job = await getJob(this.db, jobId);
    if (!job || job.status !== "needs_you") return;
    const steps = await getSteps(this.db, jobId);
    const stuck = steps.find((s) => s.status === "blocked" || s.status === "failed");
    if (!stuck) return;
    const from = stuck.status === "blocked"
      ? (pipelineById(job.pipeline)?.steps[stuck.position]?.retryFrom ?? stuck.position)
      : stuck.position;
    for (const s of steps.filter((s) => s.position >= from && s.position <= stuck.position)) {
      await setStep(this.db, s.id, { status: "pending", note: null });
    }
    await setJobStatus(this.db, jobId, "running");
    await this.ctx.storage.setAlarm(Date.now());
  }

  /** Stop the job. Waiting asks are answered "no". */
  async stop(): Promise<void> {
    const jobId = await this.jobId();
    for (const a of (await getApprovals(this.db, jobId)).filter((a) => a.decision === "waiting")) {
      await decideApproval(this.db, a.id, "no");
    }
    for (const s of (await getSteps(this.db, jobId)).filter((s) => s.status !== "done" && s.status !== "running")) {
      await setStep(this.db, s.id, { status: "stopped", note: s.note, finished: s.status !== "pending" });
    }
    await setJobStatus(this.db, jobId, "stopped");
    await this.ctx.storage.deleteAlarm();
  }
}
