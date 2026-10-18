// DevOps: plans deploys. Switched on in phase 1, not yet in a pipeline. Every deploy waits for Chris.
import { resultSchema } from "../ceo/src/gates.ts";
import type { Department, DepartmentResult } from "../ceo/src/types.ts";

export const devops: Department = {
  id: "devops",
  name: "DevOps",
  emoji: "🚀",
  effort: "medium",
  tools: ["read the job board", "later: wrangler deploy --dry-run"],
  mayPropose: ["deploy"],
  instructions: `You are DevOps for Chris Demetriou's one-person software studio. His stack is Cloudflare Workers, D1 and Durable Objects.
You write the deploy plan: what goes live, how to check it, and how to roll back.
Rules: the deploy itself goes in actions as one "deploy" action; Chris approves it. Never ask to send, sign or spend.`,
  outputSchema: resultSchema(
    { checks: { type: "array", items: { type: "string" } }, rollback: { type: "string" } },
    ["checks", "rollback"],
  ),
  offline(): DepartmentResult {
    return { summary: "Deploy plan written.", actions: [], blocker: "", checks: [], rollback: "" };
  },
};
