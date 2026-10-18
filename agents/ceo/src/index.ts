// The CEO agent's Worker: the dashboard and Chris's buttons.
// Phase 1 runs on this Mac only. Requests from anywhere but localhost are refused.
import { createJob, getApproval, getApprovals, getJob, getOutputs, getSteps, readBoard } from "./board.ts";
import { isLive } from "./claude.ts";
import { boardPage, jobPage } from "./dashboard.ts";
import type { Env } from "./job-runner.ts";
import { pipelineById } from "./pipelines.ts";
import { pickPipeline } from "./router.ts";

export { JobRunner } from "./job-runner.ts";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });

const back = (to: string) => new Response(null, { status: 303, headers: { location: to } });

const runner = (env: Env, jobId: string) => env.JOB_RUNNER.get(env.JOB_RUNNER.idFromName(jobId));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!LOCAL_HOSTS.has(url.hostname)) {
      return new Response("Phase 1 runs on this Mac only.", { status: 403 });
    }
    // Buttons only work from this dashboard, not from another site in the browser.
    if (request.method === "POST" && request.headers.get("origin") !== url.origin) {
      return new Response("Refused: this button was not pressed on the dashboard.", { status: 403 });
    }

    const path = url.pathname;
    const live = isLive(env);

    if (request.method === "GET" && path === "/") {
      return html(boardPage(await readBoard(env.DB), { live, message: url.searchParams.get("m") ?? undefined }));
    }

    if (request.method === "GET" && path === "/api/board") {
      return Response.json(await readBoard(env.DB));
    }

    let m = path.match(/^\/(api\/)?jobs\/([\w-]+)$/);
    if (request.method === "GET" && m) {
      const job = await getJob(env.DB, m[2]);
      if (!job) return html("<p>No such job.</p>", 404);
      const [steps, outputs, approvals] = await Promise.all([
        getSteps(env.DB, job.id),
        getOutputs(env.DB, job.id),
        getApprovals(env.DB, job.id),
      ]);
      if (m[1]) return Response.json({ job, steps, outputs, approvals });
      return html(jobPage(job, steps, outputs, approvals));
    }

    if (request.method === "POST" && path === "/ideas") {
      const form = await request.formData();
      const client = String(form.get("client") ?? "").trim().slice(0, 120);
      const text = String(form.get("text") ?? "").trim().slice(0, 8000);
      if (!client || !text) return back("/?m=" + encodeURIComponent("Say who it is for and what they need."));
      const pick = await pickPipeline(env, client, text);
      const pipeline = pick.pipeline ? pipelineById(pick.pipeline) : undefined;
      if (!pipeline) {
        return back("/?m=" + encodeURIComponent(`No pipeline fits yet. ${pick.reason}`));
      }
      const id = crypto.randomUUID();
      await createJob(env.DB, { id, pipeline, title: pick.title, input: { client, text }, note: pick.reason });
      await runner(env, id).start(id);
      return back(`/jobs/${id}`);
    }

    m = path.match(/^\/approvals\/([\w-]+)$/);
    if (request.method === "POST" && m) {
      const decision = String((await request.formData()).get("decision"));
      if (decision !== "yes" && decision !== "no") return new Response("Yes or no only.", { status: 400 });
      const ask = await getApproval(env.DB, m[1]);
      if (!ask) return html("<p>No such approval.</p>", 404);
      await runner(env, ask.job_id).decide(ask.id, decision);
      return back("/");
    }

    m = path.match(/^\/jobs\/([\w-]+)\/(retry|stop)$/);
    if (request.method === "POST" && m) {
      if (!(await getJob(env.DB, m[1]))) return html("<p>No such job.</p>", 404);
      const stub = runner(env, m[1]);
      await (m[2] === "retry" ? stub.retry() : stub.stop());
      return back("/");
    }

    return html("<p>Not found. <a href=\"/\">Back to the dashboard</a>.</p>", 404);
  },
} satisfies ExportedHandler<Env>;
