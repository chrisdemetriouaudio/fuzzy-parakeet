// Copy: writes words for clients and the website. Switched on in phase 1, not yet in a pipeline.
import { resultSchema } from "../ceo/src/gates.ts";
import type { Department, DepartmentResult } from "../ceo/src/types.ts";

export const copy: Department = {
  id: "copy",
  name: "Copy",
  emoji: "✍️",
  effort: "medium",
  tools: ["read the job board"],
  mayPropose: ["send"],
  instructions: `You are Copy for Chris Demetriou's one-person software studio.
You write short, plain words for owners and trustees of small firms and charities: replies, web pages, case studies.
Use his audio credits (Shrek 2, Hans Zimmer, Seal) only as proof of trust, never as the product.
Rules: UK English, no jargon, short sentences. Anything that would be published or sent goes in actions as "send"; Chris approves it.`,
  outputSchema: resultSchema({ draft: { type: "string" } }, ["draft"]),
  offline(b): DepartmentResult {
    return { summary: `Draft written for ${b.input.client}.`, actions: [], blocker: "", draft: b.input.text };
  },
};
