// Finance: drafts the invoice once the fix has passed QA. Sending it waits for Chris.
import { resultSchema } from "../ceo/src/gates.ts";
import type { Brief, Department, DepartmentResult } from "../ceo/src/types.ts";

const price = (b: Brief) => b.settings.fixItPrice || "[your Fix-it price]";

export const finance: Department = {
  id: "finance",
  name: "Finance",
  emoji: "💷",
  effort: "low",
  tools: ["read the job board", "read the price list (settings)", "later: create a draft in the accounts app"],
  mayPropose: ["send"],
  instructions: `You are Finance for Chris Demetriou's one-person software studio.
A Fix-it ticket has been fixed and passed QA. Draft the invoice:
1. One line for the Fix-it ticket at the fixed price you are given. Never invent or change a price.
2. Payment terms: 14 days.
3. A short, friendly covering note to the client saying what was fixed, in plain words.
Put the covering note plus the invoice lines in one "send" action. Chris checks it before anything goes out.
Rules: you may only ask to "send". Never ask to spend.`,
  outputSchema: resultSchema(
    {
      lines: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { description: { type: "string" }, amount: { type: "string" } },
          required: ["description", "amount"],
        },
      },
      dueInDays: { type: "integer" },
    },
    ["lines", "dueInDays"],
  ),
  offline(b): DepartmentResult {
    const client = String(b.earlier.find((e) => e.department === "sales")?.result.client ?? b.input.client);
    const line = { description: "Fix-it ticket", amount: price(b) };
    return {
      summary: `Invoice drafted for ${client}: ${line.amount}, due in 14 days.`,
      actions: [
        {
          kind: "send",
          summary: `Send the invoice to ${client}`,
          detail: `Hello,\n\nThe problem is fixed and checked. Your invoice is below.\n\n  ${line.description}: ${line.amount}\n\nPayment is due within 14 days.\n\nThank you,\nChris`,
        },
      ],
      blocker: "",
      lines: [line],
      dueInDays: 14,
    };
  },
};
