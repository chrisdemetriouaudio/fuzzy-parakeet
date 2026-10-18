// Sales: takes a Fix-it ticket in, checks it fits the offer, drafts the quote reply.
import { resultSchema } from "../ceo/src/gates.ts";
import type { Brief, Department, DepartmentResult } from "../ceo/src/types.ts";

const price = (b: Brief) => b.settings.fixItPrice || "[your Fix-it price]";

export const sales: Department = {
  id: "sales",
  name: "Sales",
  emoji: "🤝",
  effort: "low",
  tools: ["read the ticket", "read the price list (settings)"],
  mayPropose: ["send"],
  instructions: `You are Sales for Chris Demetriou's one-person software studio.
Chris fixes and builds software for small firms and charities with no tech staff.
His three fixed-price offers: Fix-it ticket (one clear problem, fixed price), Build (a new site or app), Care plan (monthly looking-after).

Your job on a Fix-it ticket:
1. Work out who the client is and what is wrong, in plain words.
2. Decide if it fits a Fix-it ticket: one clear fault, likely fixed within a day, no new features.
3. If it fits, draft a short, warm reply to the client with the fixed price, what is included, and one question if anything is unclear. Put it in actions as one "send" action. Chris checks it before anything goes out.
4. If it does not fit, say which offer fits better in blocker, and do not draft a reply.

Rules: write for owners and trustees, not developers. No jargon. UK English. Never promise a date. Never invent a price: use the one you are given. You may only ask to "send".`,
  outputSchema: resultSchema(
    {
      client: { type: "string" },
      problem: { type: "string", description: "What is wrong, in one plain sentence." },
      fitsFixIt: { type: "boolean" },
      questions: { type: "array", items: { type: "string" } },
    },
    ["client", "problem", "fitsFixIt", "questions"],
  ),
  offline(b): DepartmentResult {
    const fits = !/#not-fixit|whole new (site|app)/i.test(b.input.text);
    const problem = b.input.text.split(/[.\n]/)[0].trim().slice(0, 140);
    if (!fits) {
      return {
        summary: `${b.input.client}'s request is bigger than a Fix-it ticket.`,
        actions: [],
        blocker: "Not a Fix-it ticket: this sounds like a Build. Offer a Build instead.",
        client: b.input.client,
        problem,
        fitsFixIt: false,
        questions: [],
      };
    }
    return {
      summary: `${b.input.client}: "${problem}". Fits a Fix-it ticket; quote drafted.`,
      actions: [
        {
          kind: "send",
          summary: `Send the Fix-it quote to ${b.input.client}`,
          detail: `Hello,\n\nThanks for getting in touch. This sounds like a Fix-it ticket: one clear problem, fixed for a fixed price of ${price(b)}.\n\nThat covers finding the cause, fixing it, checking it works, and a short note on what I changed.\n\nIf you're happy, reply "yes" and I'll start.\n\nChris`,
        },
      ],
      blocker: "",
      client: b.input.client,
      problem,
      fitsFixIt: true,
      questions: [],
    };
  },
};
