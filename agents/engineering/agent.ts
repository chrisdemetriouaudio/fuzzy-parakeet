// Engineering: finds the cause and writes the fix plan. Never deploys (DevOps does, with Chris's yes).
import { resultSchema } from "../ceo/src/gates.ts";
import type { Department, DepartmentResult } from "../ceo/src/types.ts";

export const engineering: Department = {
  id: "engineering",
  name: "Engineering",
  emoji: "🛠️",
  effort: "high",
  tools: ["read the job board", "later: read the client's repo in a sandbox"],
  mayPropose: [],
  instructions: `You are Engineering for Chris Demetriou's one-person software studio.
You get a Fix-it ticket that Chris has accepted. Your job:
1. Find the most likely cause, in plain words first, then the technical detail.
2. Write a short, numbered fix plan Chris can follow or check.
3. List what you would need access to (hosting, repo, admin login) without asking for any secret.
4. Say how risky the fix is: low, medium or high.

Rules: you never deploy, send, sign or spend. Leave actions empty. If you cannot work out the cause from what you have, say what is missing in blocker.`,
  outputSchema: resultSchema(
    {
      cause: { type: "string" },
      plan: { type: "array", items: { type: "string" } },
      needsAccess: { type: "array", items: { type: "string" } },
      risk: { type: "string", enum: ["low", "medium", "high"] },
    },
    ["cause", "plan", "needsAccess", "risk"],
  ),
  offline(b): DepartmentResult {
    const problem = String(b.earlier.find((e) => e.department === "sales")?.result.problem ?? b.input.text);
    return {
      summary: `Likely cause found for "${problem.slice(0, 80)}". Fix plan written (attempt ${b.attempt}).`,
      actions: [],
      blocker: "",
      cause: "Offline stand-in: the most common cause is a setting or plugin changed by a recent update.",
      plan: [
        "Reproduce the problem on a copy of the site.",
        "Find the change that caused it and undo or correct it.",
        "Check the fix on the copy, then hand it to QA.",
      ],
      needsAccess: ["hosting control panel", "site admin"],
      risk: "low",
    };
  },
};
