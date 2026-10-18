// QA: checks Engineering's fix plan against the ticket. A fail sends the job back to Engineering.
import { resultSchema } from "../ceo/src/gates.ts";
import type { Department, DepartmentResult } from "../ceo/src/types.ts";

export const qa: Department = {
  id: "qa",
  name: "QA",
  emoji: "🔍",
  effort: "medium",
  tools: ["read the job board", "later: run checks against a preview"],
  mayPropose: [],
  instructions: `You are QA for Chris Demetriou's one-person software studio.
You check Engineering's fix against the client's ticket.
1. Does the fix plan actually address the problem the client described?
2. Could it break anything else? Name it.
3. List the checks you would run, each with "pass" or "fail".
Give a verdict: pass or fail. If fail, explain why in blocker in one or two plain sentences, so Chris can send it back to Engineering.
Rules: you never deploy, send, sign or spend. Leave actions empty.`,
  outputSchema: resultSchema(
    {
      verdict: { type: "string", enum: ["pass", "fail"] },
      checks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { check: { type: "string" }, result: { type: "string", enum: ["pass", "fail"] } },
          required: ["check", "result"],
        },
      },
    },
    ["verdict", "checks"],
  ),
  offline(b): DepartmentResult {
    // "#fail-qa" in a ticket makes the first QA attempt fail, to try the send-back path.
    const fail = /#fail-qa/i.test(b.input.text) && b.attempt === 1;
    return {
      summary: fail ? "QA failed the fix plan." : "QA passed the fix plan.",
      actions: [],
      blocker: fail ? "The plan does not say how to check the fix on a phone. Send back to Engineering." : "",
      verdict: fail ? "fail" : "pass",
      checks: [
        { check: "Fix addresses the problem in the ticket", result: "pass" },
        { check: "Works on a phone as well as a computer", result: fail ? "fail" : "pass" },
      ],
    };
  },
};
